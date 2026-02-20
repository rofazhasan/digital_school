import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const setupNetworkMonitoring = () => {
    if (!Capacitor.isNativePlatform()) return;

    Network.addListener('networkStatusChange', (status) => {
        if (!status.connected) {
            toast.error('Connection Lost', {
                description: 'You are currently offline. Exam timers will pause until connection is restored.',
                duration: Infinity,
                id: 'network-offline',
            });
        } else {
            toast.dismiss('network-offline');
            toast.success('Connection Restored', {
                description: 'You are back online.',
                duration: 3000,
            });
        }
    });
};

export const getNetworkStatus = async () => {
    if (!Capacitor.isNativePlatform()) return { connected: true, connectionType: 'wifi' };
    return await Network.getStatus();
};
