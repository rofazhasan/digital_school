import { KeepAwake } from '@capacitor-community/keep-awake';
import { ScreenBrightness } from '@capacitor-community/screen-brightness';
import { Capacitor } from '@capacitor/core';

export const setKeepAwake = async (keepAwake: boolean) => {
    if (!Capacitor.isNativePlatform()) return;
    if (keepAwake) {
        await KeepAwake.keepAwake();
    } else {
        await KeepAwake.allowSleep();
    }
};

export const setBrightness = async (brightness: number) => {
    if (!Capacitor.isNativePlatform()) return;
    // brightness should be between 0 and 1
    await ScreenBrightness.setBrightness({ brightness });
};

export const getBrightness = async () => {
    if (!Capacitor.isNativePlatform()) return 1;
    const { brightness } = await ScreenBrightness.getBrightness();
    return brightness;
};
