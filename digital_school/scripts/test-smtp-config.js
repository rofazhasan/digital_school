const nodemailer = require('nodemailer');

async function testConfig() {
    console.log('Verifying Nodemailer + Brevo Config...');

    // This just mimics the logic in lib/email.ts
    const host = 'smtp-relay.brevo.com';
    const port = 587;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: false, // for port 587
        auth: {
            user: 'test-user', // dummy
            pass: 'test-pass'  // dummy
        }
    });

    console.log('✅ Transporter initialized successfully with Brevo defaults.');
    console.log(`Target Host: ${host}:${port}`);
}

testConfig().catch(console.error);
