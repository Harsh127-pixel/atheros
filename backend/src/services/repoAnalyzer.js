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
  const common = ['server.js', 'index.js', 'main.go', 'app.py', 'main.py', 'index.ts', 'server.ts'];
  const found = files.find(f => common.includes(f));
  return found || 'Not detected';
};

const analyzeRepo = async (repoUrl) => {
  const tempDir = temp.mkdirSync('aetheros-scan');
  const git = simpleGit();

  try {
    logger.info(`Scanning repository: ${repoUrl}`);
    
    // 1. Clone to temp directory
    await git.clone(repoUrl, tempDir, ['--depth', '1']);
    
    // 2. Read file names
    const files = await fs.readdir(tempDir);
    const language = detectLanguage(files);
    const entryPoint = findEntryPoint(files, language);

    // 3. Read snippets for AI context
    let snippets = '';
    if (entryPoint !== 'Not detected') {
      const entryContent = await fs.readFile(path.join(tempDir, entryPoint), 'utf8');
      snippets = entryContent.slice(0, 1500); // Take first 1500 characters
    }

    // 4. AI Feedback with Gemini 1.5 Flash
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Analyze this codebase for "Cloud Fit" suitability.
      Files found: ${files.join(', ')}
      Primary Language Detection: ${language}
      Entry Point: ${entryPoint}
      
      Core Code Snippet:
      ${snippets}
      
      Suggest the best cloud provider between 'GCP', 'Render', and 'Fly.io'.
      Return ONLY a JSON object in this format: 
      { "language": "string", "suggestedProvider": "GCP" | "Render" | "Fly.io", "rationale": "one sentence explanation" }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Cleanup
    await fs.remove(tempDir);

    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error("AI failed to return valid JSON");
    
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    logger.error('Repository analysis failed', error);
    if (fs.existsSync(tempDir)) await fs.remove(tempDir);
    throw error;
  }
};

module.exports = { analyzeRepo };
