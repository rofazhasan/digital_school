import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { Capacitor } from '@capacitor/core';

export const speakText = async (text: string, lang: string = 'en-US') => {
    if (!Capacitor.isNativePlatform()) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
        return;
    }
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
    if (!Capacitor.isNativePlatform()) {
        window.speechSynthesis.cancel();
        return;
    }
    await TextToSpeech.stop();
};
