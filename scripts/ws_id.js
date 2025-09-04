const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workspace.findUnique({ where: { slug: process.argv[2] || 'demo-workspace' } });
  if (!ws) {
    console.log('not found');
  } else {
    console.log(ws.id);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

