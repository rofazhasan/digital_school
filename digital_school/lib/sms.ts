/**
 * SMS sending utility using BulkSMSBD (http://bulksmsbd.net/api/smsapi).
 *
 * Required env vars:
 *   SMS_API_KEY    — your bulksmsbd.net API key (api_key param)
 *   SMS_API_URL    — the API endpoint URL (optional, defaults to bulksmsbd.net)
 *   SMS_SENDER_ID  — sender number/id e.g. 8809617614084
 *
 * API response code meanings:
 *   202   SMS Submitted Successfully
 * ... (skipping codes for brevity)
 */

const SMS_URL = process.env.SMS_API_URL || 'http://bulksmsbd.net/api/smsapi';
const SMS_KEY = process.env.SMS_API_KEY || '';
const SMS_SID = process.env.SMS_SENDER_ID || '8809617614084';

export interface SMSResult {
    success: boolean;
    code?: number | string;
    error?: string;
}

const SMS_CODE_MESSAGES: Record<number, string> = {
    202: 'SMS submitted successfully',
    1001: 'Invalid phone number',
    1002: 'Sender ID not correct or disabled',
    1003: 'Required fields missing',
    1005: 'Internal gateway error',
    1006: 'Balance validity not available',
    1007: 'Balance insufficient',
    1011: 'User ID not found',
    1012: 'Masking SMS must be sent in Bengali',
    1013: 'Sender ID has no valid gateway (by API key)',
    1014: 'Sender type name not found for this sender',
    1015: 'No valid gateway for sender ID',
    1016: 'Sender active price info not found',
    1017: 'Sender price info not found',
    1018: 'Owner account is disabled',
    1019: 'Sender type price is disabled for this account',
    1020: 'Parent account not found',
    1021: 'Parent active price not found',
    1031: 'Account not verified — contact administrator',
    1032: 'IP not whitelisted',
};

/**
 * Normalise Bangladeshi phone → international format for the gateway.
 * e.g. 01794678595 → 8801794678595
 */
function normaliseForGateway(phone: string): string {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) p = '88' + p;       // 01... → 8801...
    if (!p.startsWith('880')) p = '880' + p;
    return p;
}

/**
 * Send a single SMS via bulksmsbd.net.
 */
export async function sendSMS(to: string, message: string): Promise<SMSResult> {
    if (!SMS_KEY) {
        console.warn('[SMS] SMS_API_KEY not configured — skipping SMS.');
        return { success: false, error: 'SMS credentials not configured' };
    }

    const number = normaliseForGateway(to);

    const params = new URLSearchParams({
        api_key: SMS_KEY,
        senderid: SMS_SID,
        number,
        message,
    });

    try {
        console.log(`[SMS] Sending to ${number} via bulksmsbd.net …`);
        const res = await fetch(`${SMS_URL}?${params.toString()}`, {
            method: 'GET',
            signal: AbortSignal.timeout(12000),
        });

        const text = await res.text();
        console.log(`[SMS] Gateway raw response: ${text}`);

        // The gateway returns a numeric code (as JSON object or plain text)
        // Common shape: {"response_code":202,"error_message":"SMS Submit Successfully",…}
        let code: number | null = null;
        try {
            const json = JSON.parse(text);
            // Accept response_code, code, status (int) — all known gateway shapes
            code = Number(json.response_code ?? json.code ?? json.status ?? json.Code ?? null);
        } catch {
            // Plain text: just the number
            const m = text.trim().match(/^(\d+)/);
            if (m) code = Number(m[1]);
        }

        if (code === 202) {
            return { success: true, code: 202 };
        }

        const errMsg = code && SMS_CODE_MESSAGES[code]
            ? `[Code ${code}] ${SMS_CODE_MESSAGES[code]}`
            : `Gateway returned: ${text.substring(0, 200)}`;

        console.warn(`[SMS] Failed — ${errMsg}`);
        return { success: false, code: code ?? undefined, error: errMsg };

    } catch (err: any) {
        console.error('[SMS] Network error:', err?.message);
        return { success: false, error: `Network error: ${err?.message}` };
    }
}

/**
 * Build the OTP SMS text in the required format:
 *   "Your {BrandName} OTP is {otp}. Valid for 10 minutes."
 */
export function buildOtpMessage(otp: string, brandName: string = 'Digital School'): string {
    return `Your ${brandName} OTP is ${otp}. Valid for 10 minutes.`;
}

/**
 * Generate a secure 6-digit numeric OTP.
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
