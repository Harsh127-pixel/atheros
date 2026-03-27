const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function testLatest() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
     console.log("Testing with gemini-2.0-flash...");
     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
     const result = await model.generateContent("Hello!");
     console.log("Success with gemini-2.0-flash!", result.response.text());
  } catch (e) {
     console.log("Failed with latest:", e.message);
  }
}

testLatest();
