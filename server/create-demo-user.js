const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createDemoUser() {
  try {
    const email = 'demo@example.com';
    const existing = await prisma.users.findUnique({ where: { email } });

    if (existing) {
      console.log('✅ Demo user already exists:', email);
      return;
    }

    const passwordHash = await bcrypt.hash('Demo123!', 10);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: 'Demo User',
        email,
        passwordHash,
        role: 'user',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Demo user created:', user.email);
  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUser();
