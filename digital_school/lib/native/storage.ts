import { Preferences } from '@capacitor/preferences';

export const setStorageItem = async (key: string, value: string) => {
    await Preferences.set({ key, value });
};

export const getStorageItem = async (key: string) => {
    const { value } = await Preferences.get({ key });
    return value;
};

export const removeStorageItem = async (key: string) => {
    await Preferences.remove({ key });
};

export const clearStorage = async () => {
    await Preferences.clear();
};
