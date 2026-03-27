const fs = require('fs-extra');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('./../utils/logger');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SECRETS_PATTERNS = [
  /AKIA[0-9A-Z]{16}/, // AWS Access Key
  /sk_live_[0-9a-zA-Z]{24}/, // Stripe Secret Key
  /AIza[0-9A-Za-z-_]{35}/, // Google API Key
  /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, // SendGrid API
  /ghp_[a-zA-Z0-9]{36}/, // GitHub Personal Access Token
  /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24}/, // Slack Webhook
  /\.env/i // Presence of .env files
];

const performSecurityAudit = async (projectPath, logEmitter = null, auditId = null) => {
  const emit = (message) => {
    if (logEmitter && auditId) {
      logEmitter.emit('log', { deploymentId: auditId, message: `[shield] ${message}` });
    }
  };

  emit("Initializing deep security scan...");
  const vulnerabilities = [];
  const files = await fs.readdir(projectPath);

  try {
    // 1. Secrets Detection (Regex)
    emit("Scanning for exposed credentials and .env files...");
    for (const file of files) {
      const filePath = path.join(projectPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile()) {
        const content = await fs.readFile(filePath, 'utf8');
        for (const pattern of SECRETS_PATTERNS) {
          if (pattern.test(content) || pattern.test(file)) {
            vulnerabilities.push({
              type: 'SECRET_EXPOSURE',
              severity: 'CRITICAL',
              detail: `Potential credential or .env file detected in ${file}`,
              file
            });
          }
        }
      }
    }

    // 2. Vulnerability Scan (AI)
    try {
      emit("Analyzing project manifest for dependency vulnerabilities...");
      const manifestFile = files.find(f => ['package.json', 'pom.xml', 'go.mod'].includes(f));
      if (manifestFile) {
        const manifestPath = path.join(projectPath, manifestFile);
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const prompt = `
          Scan this manifest file for outdated dependencies or known security vulnerabilities.
          Manifest File (${manifestFile}):
          ${manifestContent.slice(0, 3000)}
          
          Return ONLY a JSON array of vulnerabilities: 
          [ { "type": "string", "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL", "detail": "string", "package": "string" } ]
          If no vulnerabilities are found, return exactly [].
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\[.*\]/s);
        
        if (jsonMatch) {
           const aiVulnerabilities = JSON.parse(jsonMatch[0]);
           vulnerabilities.push(...aiVulnerabilities);
        }
      }
    } catch (aiError) {
      logger.warn('AI Security Scan failed or quota reached', aiError.message);
      vulnerabilities.push({
        type: 'SCAN_SKIPPED',
        severity: 'LOW',
        detail: 'AI vulnerability scan skipped due to system load or quota. Manual review recommended.',
        package: 'N/A'
      });
    }

    const score = Math.max(0, 100 - (vulnerabilities.length * 10));
    emit(`Security scan complete. Risk Score: ${score}/100. Found ${vulnerabilities.length} issues.`);
    return vulnerabilities;

  } catch (error) {
    logger.error('Security audit failed', error);
    throw error;
  }
};

module.exports = { performSecurityAudit };
