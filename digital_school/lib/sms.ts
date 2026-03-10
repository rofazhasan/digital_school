/**
 * SMS sending utility using SSL Wireless Bangladesh SMS Gateway.
 * Env vars needed: SMS_API_USER, SMS_API_PASS, SMS_SENDER_ID
 * Falls back gracefully if credentials not set.
 */

const SMS_URL = process.env.SMS_API_URL || 'https://sms.sslwireless.com/pushapi/dynamic/server.php';
const SMS_USER = process.env.SMS_API_USER || '';
const SMS_PASS = process.env.SMS_API_PASS || '';
const SMS_SID = process.env.SMS_SENDER_ID || 'DIGITALSCH';

export interface SMSResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Sends a single SMS via SSL Wireless BD gateway.
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
    if (!SMS_USER || !SMS_PASS) {
        console.warn('[SMS] SMS_API_USER or SMS_API_PASS not configured. Skipping SMS send.');
        return { success: false, error: 'SMS credentials not configured' };
    }

    // Normalize phone for BD gateway — must be 8801XXXXXXXXX format (13 digits)
    let phone = to.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '88' + phone;          // 01... → 8801...
    if (!phone.startsWith('880')) phone = '880' + phone;       // guard
    if (phone.length < 13) {
        return { success: false, error: `Invalid phone number: ${to}` };
    }

    const params = new URLSearchParams({
        apiUser: SMS_USER,
        apiPass: SMS_PASS,
        senderid: SMS_SID,
        mobiles: phone,
        sms: message,
        csmsid: `DS-${Date.now()}`,
    });

    try {
        console.log(`[SMS] Sending to ${phone}...`);
        const res = await fetch(`${SMS_URL}?${params.toString()}`, {
            method: 'GET',
            signal: AbortSignal.timeout(10000),
        });

        const text = await res.text();
        console.log(`[SMS] Gateway response: ${text}`);

        // SSL Wireless returns XML like: <SMSCOUNT>1</SMSCOUNT><SMSID>xxx</SMSID>
        const isOk = text.includes('<SMSID>') || text.includes('1700') || text.includes('success');
        if (isOk) {
            const match = text.match(/<SMSID>(.*?)<\/SMSID>/);
            return { success: true, messageId: match?.[1] };
        }

        // Error code scan
        if (text.includes('1000') || text.includes('Invalid')) {
            return { success: false, error: `SMS gateway error: ${text.substring(0, 200)}` };
        }

        // If status 200 but no match — treat as sent (some gateways return plain text)
        if (res.ok) {
            return { success: true, messageId: `ref-${Date.now()}` };
        }

        return { success: false, error: `HTTP ${res.status}: ${text.substring(0, 200)}` };
    } catch (err: any) {
        console.error('[SMS] Request failed:', err?.message);
        return { success: false, error: `Network error: ${err?.message}` };
    }
}

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
