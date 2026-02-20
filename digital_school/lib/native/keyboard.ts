import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export const setupKeyboardManagement = () => {
    if (!Capacitor.isNativePlatform()) return;

    Keyboard.setResizeMode({ mode: KeyboardResize.Body });

    Keyboard.addListener('keyboardWillShow', info => {
        console.log('keyboard will show with height:', info.keyboardHeight);
        document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
        console.log('keyboard will hide');
        document.body.classList.remove('keyboard-open');
    });
};

export const hideKeyboard = async () => {
    if (!Capacitor.isNativePlatform()) return;
    await Keyboard.hide();
};
