
import fs from 'fs';

// Simple .env parser for standalone script
function loadEnv() {
    try {
        const content = fs.readFileSync('.env', 'utf8');
        content.split('\n').forEach(line => {
            const [key, ...value] = line.split('=');
            if (key && value.length) {
                process.env[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
            }
        });
    } catch (err) {
        console.error('Failed to load .env');
    }
}

loadEnv();

const SMS_URL = process.env.SMS_API_URL || 'http://bulksmsbd.net/api/smsapi';
const SMS_KEY = process.env.SMS_API_KEY || '';
const SMS_SID = process.env.SMS_SENDER_ID || '8809617614084';

async function sendSMS(to: string, message: string) {
    const params = new URLSearchParams({
        api_key: SMS_KEY,
        senderid: SMS_SID,
        number: to,
        message: message
    });

    try {
        const response = await fetch(`${SMS_URL}?${params.toString()}`);
        const data = await response.json();
        return { success: data.response_code === 202, data };
    } catch (err) {
        return { success: false, error: err };
    }
}

function buildOtpMessage(otp: string, brand: string) {
    return `Your ${brand} OTP is ${otp}. Valid for 10 minutes.`;
}

async function runTests() {
    const testPhone = '01794678595';
    const brand = 'Digital School';

    console.log(`\n🚀 Starting Multi-Flow SMS Tests for: ${testPhone}\n`);

    // 1. Signup / Verification Flow
    const signupOtp = '123456';
    const signupMsg = buildOtpMessage(signupOtp, brand);
    console.log(`[TEST 1] Signup Flow Message: "${signupMsg}"`);
    const res1 = await sendSMS(testPhone, signupMsg);
    console.log(`Result: ${res1.success ? '✅ SUCCESS' : '❌ FAILED'}`, JSON.stringify(res1.data));

    await new Promise(r => setTimeout(r, 1000));

    // 2. Forgot Password Flow
    const resetOtp = '654321';
    const resetMsg = buildOtpMessage(resetOtp, brand);
    console.log(`\n[TEST 2] Forgot Password Flow Message: "${resetMsg}"`);
    const res2 = await sendSMS(testPhone, resetMsg);
    console.log(`Result: ${res2.success ? '✅ SUCCESS' : '❌ FAILED'}`, JSON.stringify(res2.data));

    await new Promise(r => setTimeout(r, 1000));

    // 3. Phone Change Flow
    const changeOtp = '999888';
    const changeMsg = buildOtpMessage(changeOtp, brand);
    console.log(`\n[TEST 3] Phone Number Change Flow Message: "${changeMsg}"`);
    const res3 = await sendSMS(testPhone, changeMsg);
    console.log(`Result: ${res3.success ? '✅ SUCCESS' : '❌ FAILED'}`, JSON.stringify(res3.data));

    // 4. Result Notification (Manual Format)
    const resultMsg = `Dear Rofaz,\nMidterm Res:85/100 (85% A+)\nMCQ:40 Cor:20 Wro:5 CQ:45\nGood Luck! - ${brand}`;
    console.log(`\n[TEST 4] Result Notification Flow Message:\n"${resultMsg}"`);
    const res4 = await sendSMS(testPhone, resultMsg);
    console.log(`Result: ${res4.success ? '✅ SUCCESS' : '❌ FAILED'}`, JSON.stringify(res4.data));

    console.log(`\n✨ SMS Multi-Flow Tests Completed.\n`);
}

runTests();
