require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  console.log("Testing Key:", process.env.GEMINI_API_KEY);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hello!");
    console.log("v1 Success:", result.response.text());
  } catch (e) {
    console.error("v1 Failed:", e.message);
  }
}

test();
