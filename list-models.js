const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
     // There's no robust listModels in SDK easily but we can try to find valid names
     console.log("Testing with gemini-pro...");
     const model = genAI.getGenerativeModel({ model: "gemini-pro" });
     const result = await model.generateContent("Test");
     console.log("Success with gemini-pro!");
  } catch (e) {
     console.log("Failed with gemini-pro:", e.message);
  }
}

listModels();
