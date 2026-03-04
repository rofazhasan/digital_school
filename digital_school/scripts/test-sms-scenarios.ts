/**
 * LIVE TEST SCRIPT for SMS Scenarios
 * Number: 01794678595
 * Institute: Rofaz Academy
 */
import { sendSMS } from '../lib/sms';

const TARGET_NUMBER = '01794678595';
const INST_NAME = 'Rofaz Academy';
const STUDENT_NAME = 'Rofaz';

async function runTests() {
    console.log(`🚀 Starting Live SMS Tests for ${TARGET_NUMBER} at ${INST_NAME}...\n`);

    // 1. Signup Scenario (Verification OTP)
    console.log('--- [1/3] Testing Signup OTP SMS ---');
    const otp = '654321';
    const signupMsg = `Your ${INST_NAME} OTP is ${otp}`;
    const signupRes = await sendSMS(TARGET_NUMBER, signupMsg);
    console.log('Signup OTP SMS Result:', signupRes, '\n');

    // 2. Forgot Password Scenario (OTP Format)
    console.log('--- [2/3] Testing Forgot Password SMS (OTP Format) ---');
    const token = '123456';
    const forgotMsg = `Your ${INST_NAME} OTP is ${token}`;
    const forgotRes = await sendSMS(TARGET_NUMBER, forgotMsg);
    console.log('Forgot Password SMS Result:', forgotRes, '\n');

    // 3. Exam Result Scenario (Ultra-Dense 1-Part Format)
    console.log('--- [3/3] Testing Ultra-Dense Exam Result SMS ---');
    const examName = 'Math';
    const totalMarks = 100;
    const finalScore = 88;
    const grade = 'A+';
    const rank = 1;
    const correct = 40;
    const wrong = 5;
    const deduction = 1.2;
    const mcqMarks = 38.8;
    const cqMarks = 49.2;

    // Mock Keys (Dense string)
    const mockAns = 'ABCDABCDABCDABCDABCDABCDA'; // 25 keys
    const header = `Dear ${STUDENT_NAME}\n${examName} Res:${finalScore}/${totalMarks} (88% ${grade}) Rnk:${rank}`;
    const analytics = `\nMCQ:${mcqMarks} C:${correct} W:${wrong} Ded:${deduction} CQ:${cqMarks}`;
    const keysStr = `\nKeys:${mockAns}`;

    const resultMsg = `${header}${analytics}${keysStr}\nSuccess! - ${INST_NAME}`;

    console.log(`Message Length: ${resultMsg.length} chars (Target < 160)`);
    const resultRes = await sendSMS(TARGET_NUMBER, resultMsg);
    console.log('Exam Result SMS Result:', resultRes);
    console.log('Exam Result SMS Result:', resultRes);
    console.log('\n--- ALL TESTS COMPLETE ---');
}

runTests().catch(err => {
    console.error('Test Execution Failed:', err);
});
