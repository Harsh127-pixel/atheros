const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function testLatest() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
     console.log("Testing with gemini-1.5-flash-latest...");
     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
     const result = await model.generateContent("Hello!");
     console.log("Success with gemini-1.5-flash-latest!", result.response.text());
  } catch (e) {
     console.log("Failed with latest:", e.message);
  }
}

testLatest();
