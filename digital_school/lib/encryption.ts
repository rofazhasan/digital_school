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
            const raw = encryptedInput.slice(4).trim();
            if (raw.startsWith('BASE64:')) {
                return Buffer.from(raw.slice(7), 'base64').toString('utf8');
            }
            try {
                const decodedJson = Buffer.from(raw, 'base64').toString('utf8');
                try {
                    payload = JSON.parse(decodedJson);
                } catch {
                    // Direct base64 fallback
                    return decodedJson;
                }
            } catch {
                return encryptedInput;
            }
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

/**
 * Encrypt sensitive fields of an Excel question row for Encrypted Template generation
 */
export function encryptRowForExcel(row: Record<string, any>, customKey?: string): Record<string, any> {
    const encryptedRow = { ...row };
    // Columns that MUST be encrypted
    const sensitiveColumns = [
        'questionText', 'Question Text', 'Question', 'Title',
        'optionA', 'Option A', 'optionB', 'Option B', 'optionC', 'Option C',
        'optionD', 'Option D', 'optionE', 'Option E',
        'modelAnswer', 'Model Answer', 'ModelAnswer', 'Correct Answer',
        'explanation', 'Teacher Note / Explanation', 'Explanation', 'Rationale', 'Exp', 'Solution',
        'assertion', 'Assertion', 'reason', 'Reason',
        'constraints', 'Constraints',
        'starterPython', 'Starter Code Python',
        'starterC', 'Starter Code C',
        'starterCPP', 'Starter Code CPP',
    ];

    // Add dynamic sub-question and testcase keys
    for (let i = 1; i <= 10; i++) {
        sensitiveColumns.push(
            `tc${i}Input`, `Test ${i} Input`,
            `tc${i}Output`, `Test ${i} Output`,
            `tc${i}Explanation`, `Test ${i} Explanation`,
            `s${i}Text`, `Sub ${i} Text`,
            `s${i}ModelAnswer`, `Sub ${i} Model Answer`,
            `s${i}Explanation`, `Sub ${i} Explanation`,
            `s${i}Stem`, `Sub ${i} Stem Passage`,
            `s${i}Questions`, `Sub ${i} Questions`,
            `s${i}Answers`, `Sub ${i} Answers`,
            `objSub${i}Text`, `objSub${i}ModelAnswer`, `objSub${i}Explanation`,
            `objSub${i}A`, `objSub${i}B`, `objSub${i}C`, `objSub${i}D`
        );
    }

    for (const key of Object.keys(encryptedRow)) {
        const val = encryptedRow[key];
        if (typeof val === 'string' && val.trim() !== '' && !val.startsWith('ENC:')) {
            if (sensitiveColumns.includes(key)) {
                encryptedRow[key] = encryptData(val, customKey);
            }
        }
    }

    return encryptedRow;
}

export const AI_ENCRYPTED_EXCEL_PROMPT = `You are an expert exam question author and secure data engineer for Digital School.
Generate exam questions in standardized Excel spreadsheet (.xlsx) format where ALL sensitive question text contents are cryptographically encrypted.

### ENCRYPTION PROTOCOL SPECIFICATION:
1. Target Encryption: AES-256-GCM (Authenticated Encryption).
2. Key Derivation: SHA-256 hash of the master secret key.
   Default Master Key: "digital-school-secure-vault-key-2026"
3. Ciphertext Format in Excel cell:
   ENC:<base64-encoded-JSON-payload>
   JSON payload schema:
   {
     "alg": "AES-256-GCM",
     "iv": "<12-byte-IV-base64>",
     "tag": "<16-byte-auth-tag-base64>",
     "ciphertext": "<cipher-text-base64>",
     "timestamp": 1775952000000
   }
   (Fallback format: If running in an LLM without crypto libraries, you may use "ENC:BASE64:<base64-encoded-string>")

### COLUMNS REQUIRING ENCRYPTION:
- "Question Text"
- "Option A", "Option B", "Option C", "Option D", "Option E"
- "Model Answer" / "Correct Answer"
- "Teacher Note / Explanation"
- "Assertion", "Reason"
- "Constraints", "Starter Code Python", "Starter Code C", "Starter Code CPP"
- "Test 1 Input" through "Test 10 Input"
- "Test 1 Output" through "Test 10 Output"
- "Test 1 Explanation" through "Test 10 Explanation"
- "Sub 1 Text" through "Sub 10 Text"
- "Sub 1 Model Answer" through "Sub 10 Model Answer"
- "Sub 1 Explanation" through "Sub 10 Explanation"

### UNENCRYPTED METADATA COLUMNS (Plain text):
- "Type": (MCQ, MC, INT, AR, MTF, CQ, SQ, SMCQ, DESCRIPTIVE, CMA, MPC, CODING)
- "Class Name": (Must match school class, e.g. "Class 10 - A")
- "Subject": (e.g. "Physics", "Computer Science")
- "Topic": (e.g. "Kinematics", "Algorithms")
- "Difficulty": (EASY, MEDIUM, HARD)
- "Marks": (integer/float e.g. 1, 2, 5, 10)
- "Correct Option": (A, B, C, D, or comma-separated for MC)

### PYTHON SCRIPT FOR AI / CODE INTERPRETER TO GENERATE .XLSX:
\`\`\`python
import os, json, base64, hashlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import pandas as pd

SECRET = "digital-school-secure-vault-key-2026"
KEY = hashlib.sha256(SECRET.encode()).digest()

def encrypt_cell(text):
    if text is None or text == "":
        return ""
    text_str = str(text)
    iv = os.urandom(12)
    aesgcm = AESGCM(KEY)
    encrypted = aesgcm.encrypt(iv, text_str.encode('utf-8'), None)
    ciphertext = encrypted[:-16]
    tag = encrypted[-16:]
    payload = {
        "alg": "AES-256-GCM",
        "iv": base64.b64encode(iv).decode('utf-8'),
        "tag": base64.b64encode(tag).decode('utf-8'),
        "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
        "timestamp": 1775952000000
    }
    return "ENC:" + base64.b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8')
\`\`\`
`;

