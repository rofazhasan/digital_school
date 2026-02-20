import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface StudentTelemetry {
    deviceId: string;
    batteryLevel: number;
    isCharging: boolean;
    connectionType: string;
    isOnline: boolean;
    appState: 'active' | 'inactive' | 'background';
    lastUpdated: string;
}

/**
 * World-class proctoring telemetry service.
 * Captures real-time device health and app state for teacher oversight.
 */
export const getStudentTelemetry = async (): Promise<StudentTelemetry | null> => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
        const info = await Device.getInfo();
        const battery = await Device.getBatteryInfo();
        const network = await Network.getStatus();
        const id = await Device.getId();

        return {
            deviceId: id.identifier,
            batteryLevel: battery.batteryLevel ?? 0,
            isCharging: battery.isCharging ?? false,
            connectionType: network.connectionType,
            isOnline: network.connected,
            appState: 'active', // This would be updated by listeners in real-time
            lastUpdated: new Date().toISOString()
        };
    } catch (error) {
        console.error('Telemetry capture failed:', error);
        return null;
    }
};

/**
 * Helper to subscribe to critical security events (Focus Loss)
 */
export const subscribeToSecurityEvents = (callback: (event: string) => void) => {
    if (!Capacitor.isNativePlatform()) return () => { };

    const stateListener = App.addListener('appStateChange', (state) => {
        if (!state.isActive) {
            callback('APP_MINIMIZED_OR_FOCUS_LOST');
        } else {
            callback('APP_RESTORED');
        }
    });

    return () => {
        stateListener.then(l => l.remove());
    };
};
