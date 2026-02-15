
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        // Simply try to connect and count users. If the table doesn't exist, it will throw a specific error, which also confirms connection.
        const count = await prisma.user.count();
        console.log(`Successfully connected! Found ${count} users.`);
    } catch (e) {
        console.error('Connection failed or query error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
