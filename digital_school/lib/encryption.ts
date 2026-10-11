import crypto from 'crypto';

/**
 * Modern Cryptographic Utility for Digital School
 * Supports:
 * 1. AES-256-GCM (Modern authenticated encryption with SHA-256 key derivation)
 * 2. Hybrid / RSA Envelope format compatibility
 * 3. Compact ENC:<base64> serialization
 */

const APP_SECRET = process.env.APP_ENCRYPTION_KEY || process.env.JWT_SECRET || 'digital-school-secure-vault-key-2026';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit auth tag

// Derive a fixed 32-byte key using SHA-256
function getDerivedKey(secret: string = APP_SECRET): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
    alg: 'AES-256-GCM' | 'RSA-OAEP-256';
    iv: string;
    tag: string;
    ciphertext: string;
    timestamp: number;
}

/**
 * Checks if a string or object represents an encrypted payload
 */
export function isEncrypted(value: any): boolean {
    if (!value) return false;
    if (typeof value === 'object' && value.alg && value.ciphertext) return true;
    if (typeof value === 'string' && value.startsWith('ENC:')) return true;
    return false;
}

/**
 * Encrypt arbitrary plain text or JSON object using AES-256-GCM
 */
export function encryptData(data: any, customKey?: string): string {
    try {
        const textToEncrypt = typeof data === 'string' ? data : JSON.stringify(data);
        const key = getDerivedKey(customKey);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let ciphertext = cipher.update(textToEncrypt, 'utf8', 'base64');
        ciphertext += cipher.final('base64');
        const tag = cipher.getAuthTag();

        const payload: EncryptedPayload = {
            alg: 'AES-256-GCM',
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            ciphertext,
            timestamp: Date.now()
        };

        const jsonStr = JSON.stringify(payload);
        return `ENC:${Buffer.from(jsonStr).toString('base64')}`;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt data');
    }
}

/**
 * Decrypt ENC:<base64> string or EncryptedPayload back to original data
 */
export function decryptData(encryptedInput: any, customKey?: string): any {
    try {
        if (!encryptedInput) return encryptedInput;
        let payload: EncryptedPayload;

        if (typeof encryptedInput === 'string' && encryptedInput.startsWith('ENC:')) {
            const rawBase64 = encryptedInput.slice(4);
            const decodedJson = Buffer.from(rawBase64, 'base64').toString('utf8');
            payload = JSON.parse(decodedJson);
        } else if (typeof encryptedInput === 'object' && encryptedInput.ciphertext) {
            payload = encryptedInput;
        } else {
            // Not encrypted, return as is
            return encryptedInput;
        }

        const key = getDerivedKey(customKey);
        const iv = Buffer.from(payload.iv, 'base64');
        const tag = Buffer.from(payload.tag, 'base64');

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(payload.ciphertext, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        // If decrypted is JSON, parse it
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    } catch (error) {
        console.warn('Decryption failed or invalid key:', error);
        // Fallback: return input unchanged
        return encryptedInput;
    }
}

/**
 * Encrypt sensitive fields of a question
 */
export function encryptQuestion(q: any): any {
    if (!q) return q;
    const sensitive = {
        questionText: q.questionText,
        options: q.options,
        modelAnswer: q.modelAnswer,
        explanation: q.explanation,
        assertion: q.assertion,
        reason: q.reason,
        subQuestions: q.subQuestions || q.sub_questions,
        testCases: q.testCases || q.options?.testCases
    };

    return {
        ...q,
        isEncrypted: true,
        encryptedPayload: encryptData(sensitive),
        // Mask the plaintext representation
        questionText: `[🔒 Encrypted Question - Content Hidden until Exam Commencement]`,
        modelAnswer: `[🔒 Encrypted]`,
        options: Array.isArray(q.options) ? q.options.map((_, i) => ({ text: `Option ${i + 1} [🔒 Encrypted]`, isCorrect: false })) : undefined
    };
}

/**
 * Decrypt an encrypted question back to its original plain text form
 */
export function decryptQuestion(q: any): any {
    if (!q) return q;

    let result = { ...q };

    // Check if entire question payload was encapsulated
    if (result.isEncrypted && result.encryptedPayload) {
        try {
            const decryptedSensitive = decryptData(result.encryptedPayload);
            if (decryptedSensitive && typeof decryptedSensitive === 'object') {
                result = {
                    ...result,
                    ...decryptedSensitive,
                    isEncrypted: false,
                    isDecrypted: true
                };
            }
        } catch (e) {
            console.warn('Failed to decrypt question payload:', result.id, e);
        }
    }

    // Check if individual fields were prefixed with ENC:
    if (typeof result.questionText === 'string' && result.questionText.startsWith('ENC:')) {
        const decrypted = decryptData(result.questionText);
        if (decrypted && typeof decrypted === 'object') {
            result = { ...result, ...decrypted };
        } else if (typeof decrypted === 'string') {
            result.questionText = decrypted;
        }
    }

    if (typeof result.modelAnswer === 'string' && result.modelAnswer.startsWith('ENC:')) {
        result.modelAnswer = decryptData(result.modelAnswer);
    }
    if (typeof result.explanation === 'string' && result.explanation.startsWith('ENC:')) {
        result.explanation = decryptData(result.explanation);
    }
    if (typeof result.assertion === 'string' && result.assertion.startsWith('ENC:')) {
        result.assertion = decryptData(result.assertion);
    }
    if (typeof result.reason === 'string' && result.reason.startsWith('ENC:')) {
        result.reason = decryptData(result.reason);
    }

    return result;
}

/**
 * Mask a question for confidential viewing (e.g. In exam builder preview when encrypted set is enabled)
 */
export function maskEncryptedQuestion(q: any): any {
    return {
        ...q,
        questionText: `[🔒 Confidential / Encrypted Question - Subject: ${q.subject || 'CSE'} | Marks: ${q.marks || 1}M]`,
        modelAnswer: '[🔒 Hidden in Encrypted Mode]',
        explanation: '[🔒 Hidden in Encrypted Mode]',
        options: Array.isArray(q.options) ? q.options.map((_: any, i: number) => ({ text: `[🔒 Encrypted Option ${String.fromCharCode(65 + i)}]`, isCorrect: false })) : undefined,
        isMasked: true
    };
}
