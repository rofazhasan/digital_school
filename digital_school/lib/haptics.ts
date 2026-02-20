import { Haptics, ImpactStyle } from '@capacitor/haptics';

export { ImpactStyle };
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            console.warn('Haptics not available:', e);
        }
    }
};

export const triggerSuccessHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.notification({ type: 'SUCCESS' as any });
        } catch (e) { }
    }
};

export const triggerGradingHaptic = async (type: 'CORRECT' | 'WRONG' | 'REVIEW') => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        switch (type) {
            case 'CORRECT':
                await Haptics.notification({ type: 'SUCCESS' as any });
                break;
            case 'WRONG':
                await Haptics.notification({ type: 'ERROR' as any });
                break;
            case 'REVIEW':
                await Haptics.impact({ style: ImpactStyle.Heavy });
                break;
        }
    } catch (e) { }
};
