import { DocumentScanner } from 'capacitor-document-scanner';
import { Capacitor } from '@capacitor/core';

/**
 * World-class document scanner utility for teachers.
 * Allows digitizing hand-written student scripts with automatic edge detection.
 */
export const scanDocument = async () => {
    if (!Capacitor.isNativePlatform()) {
        console.warn('Document scanner is only available on native platforms');
        return null;
    }

    try {
        const { scannedImages } = await DocumentScanner.scanDocument();
        if (scannedImages && scannedImages.length > 0) {
            return scannedImages[0]; // Returns base64 or file path depending on plugin config
        }
        return null;
    } catch (error) {
        console.error('Scanning failed:', error);
        return null;
    }
};
