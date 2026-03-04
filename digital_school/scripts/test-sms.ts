/**
 * Test script for bulksmsbd.net API
 */
import { sendSMS, getSMSBalance } from '../lib/sms';

async function test() {
    console.log('--- SMS SERVICE TEST ---');

    // 1. Test Balance
    console.log('\nChecking balance...');
    const balance = await getSMSBalance();
    console.log('Balance Result:', JSON.stringify(balance, null, 2));

    // 2. Test SMS (Optional: Comment out if you don't want to spend credits)
    /*
    console.log('\nSending test SMS...');
    const result = await sendSMS('8801700000000', 'Digital School: Test SMS via bulksmsbd.net');
    console.log('Send Result:', JSON.stringify(result, null, 2));
    */

    console.log('\n--- TEST COMPLETE ---');
}

test().catch(console.error);
