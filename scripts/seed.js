/*
  Dev seed script: creates a demo user, workspace, membership,
  and a few tasks/notes if not present.
  Safe to re-run (uses upserts or presence checks).
*/
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.SEED_ALLOW_PROD) {
    console.error('Refusing to run seed in production. Set SEED_ALLOW_PROD=1 to override.');
    process.exit(1);
  }

  const email = 'demo@example.com';
  const name = 'Demo User';
  const password = 'Password1!';
  const email2 = 'alice@example.com';
  const name2 = 'Alice';

  console.log('Seeding: ensuring demo user exists...');
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { email: email.toLowerCase(), name, passwordHash },
    select: { id: true, email: true, name: true },
  });
  console.log('User:', user);

  console.log('Seeding: ensuring demo workspace exists...');
  const ws = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: { slug: 'demo-workspace', name: 'Demo Workspace', createdBy: user.id },
    select: { id: true, name: true, slug: true },
  });
  console.log('Workspace:', ws);

  console.log('Seeding: ensuring membership exists...');
  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: ws.id } },
    update: {},
    create: { userId: user.id, workspaceId: ws.id, role: 'Owner' },
  });

  console.log('Seeding: ensuring secondary user and membership...');
  const passwordHash2 = await hashPassword(password);
  const user2 = await prisma.user.upsert({
    where: { email: email2.toLowerCase() },
    update: {},
    create: { email: email2.toLowerCase(), name: name2, passwordHash: passwordHash2 },
    select: { id: true, email: true, name: true },
  });
  await prisma.membership.upsert({
    where: { userId_workspaceId: { userId: user2.id, workspaceId: ws.id } },
    update: {},
    create: { userId: user2.id, workspaceId: ws.id, role: 'Member' },
  });

  console.log('Seeding: tasks/notes...');
  const existingTasks = await prisma.task.count({ where: { workspaceId: ws.id } });
  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        { workspaceId: ws.id, title: 'Welcome to your workspace', description: 'This is your first task.', status: 'Todo', createdBy: user.id },
        { workspaceId: ws.id, title: 'Try creating a note', description: 'Notes support tags and markdown-like content.', status: 'InProgress', createdBy: user.id },
        { workspaceId: ws.id, title: 'Assign tasks to teammates', description: 'Pick someone responsible.', status: 'Todo', createdBy: user.id, assigneeId: user2.id },
        { workspaceId: ws.id, title: 'Mark something done', description: 'Celebrate small wins.', status: 'Done', createdBy: user.id, assigneeId: user.id },
      ],
    });
  }

  const existingNotes = await prisma.note.count({ where: { workspaceId: ws.id } });
  if (existingNotes === 0) {
    await prisma.note.create({
      data: {
        workspaceId: ws.id,
        title: 'Getting Started',
        body: 'Welcome! Use the left nav to explore tasks, notes, and members.',
        tags: ['welcome', 'guide'],
        createdBy: user.id,
      },
    });
    await prisma.note.create({
      data: {
        workspaceId: ws.id,
        title: 'Tips',
        body: 'Assign tasks, add due dates, and invite team members.',
        tags: ['tips'],
        createdBy: user.id,
      },
    });
  }

  console.log('Seed complete. Credentials for demo user:');
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log('Secondary user:');
  console.log(`  Email:    ${email2}`);
  console.log(`  Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
