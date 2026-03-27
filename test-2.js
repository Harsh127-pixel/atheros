require('dotenv').config({ path: './backend/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test2() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello!");
    console.log("Success with 2.0-flash!", result.response.text());
  } catch (e) {
    console.error("2.0-flash Failed:", e.message);
  }
}

test2();
