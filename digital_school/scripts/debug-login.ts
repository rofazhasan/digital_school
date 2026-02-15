import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'teacher1@school.com';
    const password = 'password123';

    console.log(`🔍 Checking user: ${email}`);

    const user = await prisma.user.findFirst({
        where: { email }
    });

    if (!user) {
        console.error('❌ User not found in database!');
        return;
    }

    console.log('✅ User found:', user.id, user.name, user.role);
    console.log('🔑 Stored Hash:', user.password);

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log('✅ Password verification SUCCEEDED');
    } else {
        console.error('❌ Password verification FAILED');

        // Hash it again to see what it should look like
        const newHash = await bcrypt.hash(password, 12);
        console.log('ℹ️ New Hash for same password:', newHash);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
