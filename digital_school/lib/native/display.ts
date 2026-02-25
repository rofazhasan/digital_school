import { Capacitor } from '@capacitor/core';

export const setKeepAwake = async (keepAwake: boolean) => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;

    const { KeepAwake } = await import('@capacitor-community/keep-awake');
    if (keepAwake) {
        await KeepAwake.keepAwake();
    } else {
        await KeepAwake.allowSleep();
    }
};

export const setBrightness = async (brightness: number) => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) return;
    // brightness should be between 0 and 1
    const { ScreenBrightness } = await import('@capacitor-community/screen-brightness');
    await ScreenBrightness.setBrightness({ brightness });
};

export const getBrightness = async () => {
    if (typeof window === 'undefined') return 1;
    if (!Capacitor.isNativePlatform()) return 1;
    const { ScreenBrightness } = await import('@capacitor-community/screen-brightness');
    const { brightness } = await ScreenBrightness.getBrightness();
    return brightness;
};
