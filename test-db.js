const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDB() {
  try {
    console.log("Attempting to connect to Neon...");
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log("Database connection SUCCESS:", result);
  } catch (e) {
    console.error("Database connection FAILED:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDB();
