import { NextRequest, NextResponse } from 'next/server';
import { encryptData, decryptData, isEncrypted } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, data, key } = body;

        if (action === 'decrypt') {
            const decrypted = decryptData(data, key);
            return NextResponse.json({ success: true, decrypted });
        }

        // Default action: encrypt
        const encrypted = encryptData(data, key);
        return NextResponse.json({
            success: true,
            encrypted,
            algorithm: 'AES-256-GCM (SHA-256 derived)',
            instructions: 'Paste this token into your Excel cell or JSON payload under any question field (e.g., questionText: "ENC:...") or wrap entire question object.'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Encryption service error' }, { status: 400 });
    }
}
