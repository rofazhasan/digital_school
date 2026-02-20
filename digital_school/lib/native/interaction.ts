import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Dialog } from '@capacitor/dialog';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

export const nativeShare = async (title: string, text: string, url: string) => {
    if (!Capacitor.isNativePlatform()) {
        if (navigator.share) {
            await navigator.share({ title, text, url });
        } else {
            toast.info('Sharing not supported on this browser.');
        }
        return;
    }
    await Share.share({ title, text, url, dialogTitle: 'Share Examify' });
};

export const copyToClipboard = async (text: string) => {
    await Clipboard.write({ string: text });
    toast.success('Copied to clipboard');
};

export const nativeConfirm = async (title: string, message: string): Promise<boolean> => {
    if (!Capacitor.isNativePlatform()) {
        return window.confirm(message);
    }
    const { value } = await Dialog.confirm({ title, message });
    return value;
};

export const openUrl = async (url: string) => {
    if (!Capacitor.isNativePlatform()) {
        window.open(url, '_blank');
        return;
    }
    await Browser.open({ url });
};
