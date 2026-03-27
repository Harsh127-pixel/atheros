const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
const temp = require('temp').track();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { performSecurityAudit } = require('./securityAudit');
const logger = require('./../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 
const detectLanguage = (files) => {
  if (files.includes('package.json')) return 'Node.js';
  if (files.includes('go.mod')) return 'Go';
  if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java';
  if (files.includes('requirements.txt') || files.includes('pyproject.toml')) return 'Python';
  if (files.includes('Cargo.toml')) return 'Rust';
  if (files.includes('composer.json')) return 'PHP';
  return 'Unknown';
};
 
const findEntryPoint = (files, lang) => {
  const common = ['server.js', 'index.js', 'main.go', 'app.py', 'main.py', 'src/server.js', 'src/index.js'];
  const found = files.find(f => common.includes(f));
  return found || 'Not detected';
};

const detectComponents = async (tempDir, files) => {
  const components = [];
  
  // Check for backend
  const backendDir = files.find(f => f.toLowerCase() === 'backend');
  if (backendDir) {
    const backendFiles = await fs.readdir(path.join(tempDir, backendDir));
    components.push({
      type: 'backend',
      path: backendDir,
      language: detectLanguage(backendFiles),
      entryPoint: findEntryPoint(backendFiles)
    });
  } else {
    // Check root for backend
    const lang = detectLanguage(files);
    if (lang !== 'Unknown') {
      components.push({
        type: 'backend',
        path: '.',
        language: lang,
        entryPoint: findEntryPoint(files, lang)
      });
    }
  }

  // Check for frontend
  const frontendDir = files.find(f => f.toLowerCase() === 'frontend');
  if (frontendDir) {
    const frontendFiles = await fs.readdir(path.join(tempDir, frontendDir));
    components.push({
      type: 'frontend',
      path: frontendDir,
      language: 'JavaScript/TypeScript', // Usually
      isStatic: frontendFiles.includes('index.html') || frontendFiles.includes('next.config.js') || frontendFiles.includes('vite.config.ts')
    });
  }

  return components;
};

const analyzeRepo = async (repoUrl, logEmitter = null, scanId = null) => {
  const emit = (message) => {
    if (logEmitter && scanId) {
      logEmitter.emit('log', { deploymentId: scanId, message: `[scanner] ${message}` });
    }
    logger.info(`[${scanId || 'scan'}] ${message}`);
  };

  const tempDir = temp.mkdirSync('aetheros-scan');
  const git = simpleGit();

  try {
    emit(`Initializing scan for: ${repoUrl}`);
    
    // 1. Clone to temp directory
    emit("Cloning repository (shallow)...");
    await git.clone(repoUrl, tempDir, ['--depth', '1']);
    
    // 2. Read file names and detect components
    emit("Detecting project structure and components...");
    const files = await fs.readdir(tempDir);
    const components = await detectComponents(tempDir, files);
    emit(`Found ${components.length} components.`);

    // 3. Read snippets for AI context (backend focused)
    let snippets = '';
    if (mainBackend && mainBackend.entryPoint !== 'Not detected') {
      const entryPath = path.join(tempDir, mainBackend.path, mainBackend.entryPoint);
      if (await fs.pathExists(entryPath)) {
        emit(`Reading entry point context: ${mainBackend.entryPoint}`);
        const entryContent = await fs.readFile(entryPath, 'utf8');
        snippets = entryContent.slice(0, 1500); 
      }
    }

    // 4. AI Feedback with Gemini 2.0 Flash
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        Analyze this codebase for "Cloud Fit" suitability.
        Detected Components: ${JSON.stringify(components)}
        
        Core Backend Code Snippet (if found):
        ${snippets}
        
        Suggest the best cloud provider for BOTH backend and frontend (Render, Fly.io, or GCP).
        Note: Frontend can often go to 'Render' (Static) or 'Vercel' (though we only support Render/Fly/GCP tools right now).
        
        Also, suggest a pricing plan based on complexity:
        - "Free": Simple single-component apps.
        - "Pro": Monorepos, high-traffic APIs, or production-grade apps.
        - "Enterprise": Multi-region, complex infrastructure, or extreme security needs.

        Return ONLY a JSON object in this format: 
        { 
          "isMonorepo": boolean,
          "suggestedPlan": "Free" | "Pro" | "Enterprise",
          "backend": { "language": "string", "suggestedProvider": "Render" | "Fly.io" | "GCP", "rationale": "string" },
          "frontend": { "suggestedProvider": "Render" | "Fly.io" | "GCP", "rationale": "string" } | null,
          "overallRationale": "summary explanation"
        }
      `;
      emit("Consulting AetherOS Brain for architectural insights...");

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (!jsonMatch) throw new Error("AI failed to return valid JSON");
      
      const aiResult = JSON.parse(jsonMatch[0]);
      await fs.remove(tempDir);
      return aiResult;

    } catch (aiError) {
      logger.warn('AI Repo Analysis failed or quota reached, using defaults', aiError.message);
      if (fs.existsSync(tempDir)) await fs.remove(tempDir);
      return {
        isMonorepo: components.length > 1,
        backend: { language: 'Unknown', suggestedProvider: 'Render', rationale: 'Defaulting due to AI unavailability.' },
        frontend: components.some(c => c.type === 'frontend') ? { suggestedProvider: 'Render', rationale: 'Defaulting FE.' } : null,
        overallRationale: 'Using defaults because AI analysis failed.'
      };
    }

  } catch (error) {
    logger.error('Repository analysis failed', error);
    if (fs.existsSync(tempDir)) await fs.remove(tempDir);
    throw error;
  }
};

module.exports = { analyzeRepo };
