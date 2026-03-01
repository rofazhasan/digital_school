import { sendEmail } from '../lib/email';
import React from 'react';

async function testBrevo() {
    console.log('Testing Brevo SMTP Configuration...');

    // Using a simple host check if credentials aren't provided
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Skipping actual send: SMTP_USER or SMTP_PASS not set in environment.');
        console.log('Transporter would be initialized with:');
        console.log(`Host: ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}`);
        console.log(`Port: ${process.env.SMTP_PORT || 587}`);
        return;
    }

    const result = await sendEmail({
        to: 'mdrofazhasanrafiu@gmail.com',
        subject: 'Brevo SMTP Live Test - Digital School',
        react: React.createElement('div', { style: { fontFamily: 'sans-serif', padding: '20px' } }, [
            React.createElement('h1', { key: 'h1', style: { color: '#0070f3' } }, 'Brevo SMTP Is Live!'),
            React.createElement('p', { key: 'p' }, 'Hello Rafiu,'),
            React.createElement('p', { key: 'p2' }, 'This email confirms that your Digital School system is now correctly configured with Brevo SMTP.'),
            React.createElement('p', { key: 'p3' }, 'Sender: Rofaz Academy'),
            React.createElement('p', { key: 'p4', style: { marginTop: '20px', fontSize: '12px', color: '#666' } }, 'Sent via Digital School Automated Verification Script')
        ])
    });

    if (result.success) {
        console.log('✅ Test email initiated successfully.');
    } else {
        console.error('❌ Test email failed:', result.error);
    }
}

testBrevo().catch(console.error);
