import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic, ImpactStyle } from '@/lib/haptics';

export const checkBiometry = async () => {
    if (!Capacitor.isNativePlatform()) return { isAvailable: false };
    return await NativeBiometric.isAvailable();
};

export const performBiometricAuth = async (reason: string = 'Authenticate to access Examify') => {
    if (!Capacitor.isNativePlatform()) return true;

    const available = await NativeBiometric.isAvailable();
    if (!available.isAvailable) return true;

    try {
        await NativeBiometric.verifyIdentity({
            reason,
            title: 'Biometric Login',
            subtitle: 'Secure Access',
            description: 'Please authenticate to continue',
        });
        return true;
    } catch (error) {
        console.error('Biometric auth failed', error);
        return false;
    }
};
export const verifyAdminAction = async (actionName: string) => {
    if (!Capacitor.isNativePlatform()) return true;

    // We specifically want a very high importance prompt for admin actions
    const result = await performBiometricAuth(`Confirm identity to perform: ${actionName}`);
    if (!result) {
        triggerHaptic(ImpactStyle.Heavy);
    }
    return result;
};
