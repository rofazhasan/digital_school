import { sendEmail } from './email';
import { sendSMS } from './sms';
import React from 'react';

interface NotificationUser {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
}

interface OTPOptions {
    user: NotificationUser;
    otp: string;
    brandName?: string;
    emailComponent: React.ReactElement | React.ReactNode;
}

/**
 * Unified notification service to handle Email -> SMS -> Fallback logic.
 */
export async function sendOTPNotification({
    user,
    otp,
    brandName = 'Digital School',
    emailComponent
}: OTPOptions) {
    console.log(`[Notification] Processing notification for user ${user.name}`);

    // 1. If user has an email, try email first (Professional and Free/Included)
    if (user.email) {
        console.log(`[Notification] Sending OTP via Email to ${user.email}`);
        const emailResult = await sendEmail({
            to: user.email,
            subject: `Your ${brandName} OTP`,
            react: emailComponent as any,
        });

        if (emailResult.success) {
            return { success: true, method: 'email' };
        }
        console.warn(`[Notification] Email failed for ${user.email}, falling back to SMS if available.`);
    }

    // 2. If email failed OR no email, try SMS
    if (user.phone) {
        const { buildOtpMessage } = await import('./sms');
        const smsMessage = buildOtpMessage(otp, brandName);
        console.log(`[Notification] Sending OTP via SMS to ${user.phone}`);

        const smsResult = await sendSMS(user.phone, smsMessage);

        if (smsResult.success) {
            return { success: true, method: 'sms' };
        }
        console.warn(`[Notification] SMS failed for ${user.phone}.`);
    }

    // 3. Fallback logic: If both failed or unavailable
    console.error(`[Notification] All delivery methods failed for user ${user.id}`);
    return {
        success: false,
        message: 'Unable to deliver notification. Please contact support or use fallback approval service.'
    };
}

/**
 * Send general notice or result notification
 */
export async function sendGeneralNotification({
    user,
    message,
    subject,
    emailComponent
}: {
    user: NotificationUser;
    message: string;
    subject: string;
    emailComponent: React.ReactElement | React.ReactNode;
}) {
    // 1. Try Email
    if (user.email) {
        const emailResult = await sendEmail({
            to: user.email,
            subject: subject,
            react: emailComponent as any,
        });

        if (emailResult.success) return { success: true, method: 'email' };
    }

    // 2. Try SMS
    if (user.phone) {
        const smsResult = await sendSMS(user.phone, message);
        if (smsResult.success) return { success: true, method: 'sms' };
    }

    return { success: false };
}
