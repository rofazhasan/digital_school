import { CapacitorNfc } from '@capgo/capacitor-nfc';
export { CapacitorNfc };
import type { NfcTag } from '@capgo/capacitor-nfc';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';

/**
 * World-class NFC student verification utility.
 * Allows teachers to scan student ID cards for instant attendance and hall check-in.
 */
export const startNfcScanner = async (onTagScanned: (tag: NfcTag) => void) => {
    if (!Capacitor.isNativePlatform()) {
        console.warn('NFC is only available on native platforms');
        return;
    }

    try {
        await CapacitorNfc.addListener('nfcEvent', (event) => {
            triggerHaptic(ImpactStyle.Medium);
            onTagScanned(event.tag);
        });

        await CapacitorNfc.startScanning();
        console.log('NFC scanning started');
    } catch (error) {
        console.error('NFC scanning failed to start:', error);
    }
};

export const stopNfcScanner = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        await CapacitorNfc.stopScanning();
    } catch (error) {
        console.error('NFC scanning failed to stop:', error);
    }
};

/**
 * Checks if NFC is enabled on the device.
 */
export const isNfcAvailable = async () => {
    if (!Capacitor.isNativePlatform()) return false;
    try {
        const { status } = await CapacitorNfc.getStatus();
        return status === 'NFC_OK';
    } catch {
        return false;
    }
};
