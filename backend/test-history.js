const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHistory() {
  try {
    const deployments = await prisma.deployment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 2
    });
    console.log("---- RECENT AETHEROS DEPLOYMENTS ----");
    deployments.forEach(d => {
      console.log(`[${d.status}] ${d.repoUrl}`);
      console.log(`Score: ${d.securityScore}% | Cloud: ${d.cloudProvider}`);
      console.log(`Reasoning: ${d.reasoning?.slice(0, 100)}...`);
      console.log('---------------------------------------');
    });
  } catch (e) {
    console.error("Failed to query db:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkHistory();
