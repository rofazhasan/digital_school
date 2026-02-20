import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const setupNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return;

    await LocalNotifications.createChannel({
        id: 'exams',
        name: 'Exams & Sessions',
        importance: 5,
        description: 'Notifications for upcoming exams and active sessions',
        sound: 'beep.wav',
        vibration: true,
    });
};

export const scheduleExamReminder = async (id: number, title: string, body: string, date: Date) => {
    if (!Capacitor.isNativePlatform()) return;

    await LocalNotifications.schedule({
        notifications: [
            {
                title,
                body,
                id,
                schedule: { at: date },
                channelId: 'exams',
                smallIcon: 'ic_stat_name',
                actionTypeId: '',
                extra: null,
            },
        ],
    });
};
