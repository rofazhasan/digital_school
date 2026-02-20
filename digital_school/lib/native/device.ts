import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export const getDeviceInfo = async () => {
    if (!Capacitor.isNativePlatform()) {
        return {
            model: 'Web Browser',
            platform: 'web',
            operatingSystem: 'unknown',
            osVersion: 'unknown',
            manufacturer: 'unknown',
            isVirtual: false,
        };
    }

    const info = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    const id = await Device.getId();

    return {
        ...info,
        ...batteryInfo,
        deviceId: id.identifier
    };
};

export const getBatteryLevel = async () => {
    if (!Capacitor.isNativePlatform()) return 1;
    const info = await Device.getBatteryInfo();
    return info.batteryLevel ?? 1;
};
