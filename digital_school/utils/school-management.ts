import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Generate a unique hash for QR code verification
 * @param data - Data to hash (invoice ID, receipt ID, etc.)
 * @param secret - Secret key for hashing
 * @returns SHA256 hash string
 */
export function generateQRHash(data: string, secret?: string): string {
    const secretKey = secret || process.env.QR_SECRET_KEY || 'digital-school-secret-2026';
    const timestamp = Date.now().toString();
    const combined = `${data}-${timestamp}-${secretKey}`;

    return crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');
}

/**
 * Generate QR code as Data URL
 * @param data - Data to encode in QR
 * @returns Promise<string> - Data URL of QR code image
 */
export async function generateQRCode(data: string): Promise<string> {
    try {
        return await QRCode.toDataURL(data, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 200,
            margin: 1,
        });
    } catch (error) {
        console.error('QR Code generation error:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Generate verification URL for documents
 * @param qrHash - Unique hash for verification
 * @param baseUrl - Base URL of the application
 * @returns Full verification URL
 */
export function generateVerificationUrl(qrHash: string, baseUrl?: string): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}/verify/${qrHash}`;
}

/**
 * Generate sequential invoice number
 * Format: INV-YYYY-NNNNN (e.g., INV-2026-00001)
 * @param lastInvoiceNumber - Last invoice number used
 * @returns Next invoice number
 */
export function generateInvoiceNumber(lastInvoiceNumber?: string): string {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;

    if (!lastInvoiceNumber || !lastInvoiceNumber.startsWith(prefix)) {
        // First invoice of the year
        return `${prefix}00001`;
    }

    // Extract sequence number and increment
    const sequencePart = lastInvoiceNumber.split('-')[2];
    const nextSequence = (parseInt(sequencePart) + 1).toString().padStart(5, '0');

    return `${prefix}${nextSequence}`;
}

/**
 * Generate sequential receipt number
 * Format: RCP-YYYY-NNNNN (e.g., RCP-2026-00001)
 * @param lastReceiptNumber - Last receipt number used
 * @returns Next receipt number
 */
export function generateReceiptNumber(lastReceiptNumber?: string): string {
    const currentYear = new Date().getFullYear();
    const prefix = `RCP-${currentYear}-`;

    if (!lastReceiptNumber || !lastReceiptNumber.startsWith(prefix)) {
        // First receipt of the year
        return `${prefix}00001`;
    }

    // Extract sequence number and increment
    const sequencePart = lastReceiptNumber.split('-')[2];
    const nextSequence = (parseInt(sequencePart) + 1).toString().padStart(5, '0');

    return `${prefix}${nextSequence}`;
}

/**
 * Generate sequential application number
 * Format: APP-YYYY-NNNNN (e.g., APP-2026-00001)
 * @param lastApplicationNumber - Last application number used
 * @returns Next application number
 */
export function generateApplicationNumber(lastApplicationNumber?: string): string {
    const currentYear = new Date().getFullYear();
    const prefix = `APP-${currentYear}-`;

    if (!lastApplicationNumber || !lastApplicationNumber.startsWith(prefix)) {
        // First application of the year
        return `${prefix}00001`;
    }

    // Extract sequence number and increment
    const sequencePart = lastApplicationNumber.split('-')[2];
    const nextSequence = (parseInt(sequencePart) + 1).toString().padStart(5, '0');

    return `${prefix}${nextSequence}`;
}

/**
 * Calculate late fee based on days overdue
 * @param dueDate - Due date of invoice
 * @param totalAmount - Total invoice amount
 * @param lateFeePercentage - Late fee percentage per month (default: 2%)
 * @returns Late fee amount
 */
export function calculateLateFee(
    dueDate: Date,
    totalAmount: number,
    lateFeePercentage: number = 2
): number {
    const today = new Date();
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= 0) {
        return 0;
    }

    // Calculate monthly late fee
    const monthsOverdue = Math.ceil(daysOverdue / 30);
    const lateFee = (totalAmount * lateFeePercentage / 100) * monthsOverdue;

    return Math.round(lateFee * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate discount amount
 * @param amount - Original amount
 * @param discountPercentage - Discount percentage
 * @returns Discount amount
 */
export function calculateDiscount(amount: number, discountPercentage: number): number {
    return Math.round((amount * discountPercentage / 100) * 100) / 100;
}

/**
 * Format currency for display
 * @param amount - Amount to format
 * @param currency - Currency code (default: BDT)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'BDT'): string {
    return new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}
