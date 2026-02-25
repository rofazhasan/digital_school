import { Capacitor } from '@capacitor/core';

export const speakText = async (text: string, lang: string = 'en-US') => {
    if (typeof window === 'undefined') return;

    if (!Capacitor.isNativePlatform()) {
        if (window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        }
        return;
    }

    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    await TextToSpeech.speak({
        text,
        lang,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
    });
};

export const stopSpeech = async () => {
    if (typeof window === 'undefined') return;

    if (!Capacitor.isNativePlatform()) {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        return;
    }

    const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
    await TextToSpeech.stop();
};
