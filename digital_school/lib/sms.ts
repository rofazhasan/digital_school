/**
 * SMS service client for bulksmsbd.net
 */

const API_KEY = process.env.BULKSMSBD_API_KEY;
const SENDER_ID = process.env.BULKSMSBD_SENDER_ID;
const BASE_URL = process.env.BULKSMSBD_BASE_URL || 'http://bulksmsbd.net/api';

if (!API_KEY || !SENDER_ID) {
    console.warn('⚠️ BULKSMSBD_API_KEY or BULKSMSBD_SENDER_ID is missing from environment variables. SMS service will not work correctly.');
}

export interface SMSRunResponse {
    success: boolean;
    message?: string;
    code?: number;
}

/**
 * Send a text message to a receiver
 * @param number Receiver phone number (e.g. 88017XXXXXXXX)
 * @param message The SMS body
 */
export async function sendSMS(number: string, message: string): Promise<SMSRunResponse> {
    try {
        console.log(`[SMS] Sending SMS to ${number}...`);

        // Ensure number is in correct format (adding 88 prefix if missing for BD numbers)
        let formattedNumber = number.trim();
        if (formattedNumber.startsWith('01') && formattedNumber.length === 11) {
            formattedNumber = '88' + formattedNumber;
        }

        // Detect if the message contains non-ASCII characters (Unicode/Bangla)
        // GSM 7-bit alphabet covers most English characters.
        // If anything is outside that, we use type=unicode.
        const isUnicode = /[^\x00-\x7F]/.test(message);
        const type = isUnicode ? 'unicode' : 'text';

        const url = `${BASE_URL}/smsapi?api_key=${API_KEY}&type=${type}&number=${encodeURIComponent(formattedNumber)}&senderid=${SENDER_ID}&message=${encodeURIComponent(message)}`;

        const response = await fetch(url, { method: 'GET' });
        const data = await response.json();

        // 202 is success code for this API
        if (data.response_code === 202) {
            console.log(`[SMS] SMS sent successfully to ${formattedNumber}`);
            return { success: true, message: data.success_message, code: data.response_code };
        } else {
            console.warn(`[SMS] Failed to send SMS to ${formattedNumber}. Code: ${data.response_code}`);
            return { success: false, message: data.error_message || 'Unknown error', code: data.response_code };
        }
    } catch (error) {
        console.error('[SMS] Error sending SMS:', error);
        return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Get current credit balance
 */
export async function getSMSBalance(): Promise<any> {
    try {
        const url = `${BASE_URL}/getBalanceApi?api_key=${API_KEY}`;
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('[SMS] Error fetching balance:', error);
        return null;
    }
}
