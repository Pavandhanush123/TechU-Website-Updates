import "./ensure-database-url.js";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Testing connection to Prisma database...');
  
  // Create a test user
  const newUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      passwordHash: 'hashedpassword',
    },
  });
  console.log('✅ Successfully created user:', newUser.email);

  // Fetch users
  const allUsers = await prisma.user.findMany();
  console.log(`✅ Connection active! Found ${allUsers.length} total user(s) in the database.`);
}

main()
  .catch((e) => {
    console.error('❌ Database connection failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Disconnected.');
  });
