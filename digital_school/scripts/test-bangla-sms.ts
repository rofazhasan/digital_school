import { sendSMS } from '../lib/sms';

async function testBangla() {
    const targetNumber = '01794678595';
    const banglaMessage = 'আপনার পরীক্ষার ফলাফল প্রস্তুত। ডিজিটাল স্কুলে স্বাগতম।';

    console.log('--- Testing Bangla SMS ---');
    console.log('Message:', banglaMessage);

    const result = await sendSMS(targetNumber, banglaMessage);
    console.log('Result:', result);
}

testBangla().catch(console.error);
