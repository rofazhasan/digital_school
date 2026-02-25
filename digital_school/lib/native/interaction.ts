import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const nativeShare = async (title: string, text: string, url: string) => {
    if (!Capacitor.isNativePlatform()) {
        if (typeof navigator !== 'undefined' && navigator.share) {
            await navigator.share({ title, text, url });
        } else {
            toast.info('Sharing not supported on this browser.');
        }
        return;
    }
    const { Share } = await import('@capacitor/share');
    await Share.share({ title, text, url, dialogTitle: 'Share Examify' });
};

export const copyToClipboard = async (text: string) => {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    toast.success('Copied to clipboard');
};

export const nativeConfirm = async (title: string, message: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
        if (typeof window !== 'undefined') {
            return window.confirm(message);
        }
        return false;
    }
    const { Dialog } = await import('@capacitor/dialog');
    const { value } = await Dialog.confirm({ title, message });
    return value;
};

export const openUrl = async (url: string) => {
    if (!Capacitor.isNativePlatform()) {
        if (typeof window !== 'undefined') {
            window.open(url, '_blank');
        }
        return;
    }
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
};
