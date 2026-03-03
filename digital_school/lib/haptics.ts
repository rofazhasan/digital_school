import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export { ImpactStyle };
import { Capacitor } from '@capacitor/core';

export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.impact({ style });
        } catch (_e) {
            console.warn('Haptics not available:', _e);
        }
    }
};

export const triggerSuccessHaptic = async () => {
    if (Capacitor.isNativePlatform()) {
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (_e) { }
    }
};

export const triggerGradingHaptic = async (type: 'CORRECT' | 'WRONG' | 'REVIEW') => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        switch (type) {
            case 'CORRECT':
                await Haptics.notification({ type: NotificationType.Success });
                break;
            case 'WRONG':
                await Haptics.notification({ type: NotificationType.Error });
                break;
            case 'REVIEW':
                await Haptics.impact({ style: ImpactStyle.Heavy });
                break;
        }
    } catch (_e) { }
};
