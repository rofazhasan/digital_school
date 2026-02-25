import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const nativeShare = async (title: string, text: string, url: string) => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) {
        if (navigator.share) {
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
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) {
        await navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
        return;
    }
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    toast.success('Copied to clipboard');
};

export const nativeConfirm = async (title: string, message: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!Capacitor.isNativePlatform()) {
        return window.confirm(message);
    }
    const { Dialog } = await import('@capacitor/dialog');
    const { value } = await Dialog.confirm({ title, message });
    return value;
};

export const openUrl = async (url: string) => {
    if (typeof window === 'undefined') return;
    if (!Capacitor.isNativePlatform()) {
        window.open(url, '_blank');
        return;
    }
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
};
