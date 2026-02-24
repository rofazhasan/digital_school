import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResendClient() {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not defined in environment variables');
        }
        resendClient = new Resend(apiKey);
    }
    return resendClient;
}

interface SendEmailProps {
    to: string | string[];
    subject: string;
    react: React.ReactElement | React.ReactNode;
    from?: string;
    replyTo?: string;
    attachments?: {
        filename: string;
        content?: Buffer | string;
        path?: string;
    }[];
}

/**
 * Standardized function to send emails using Resend.
 * Uses environment variables for configuration.
 */
export async function sendEmail({
    to,
    subject,
    react,
    from = process.env.EMAIL_FROM || 'onboarding@resend.dev',
    replyTo,
    attachments,
}: SendEmailProps) {
    try {
        const resend = getResendClient();
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            react: react as React.ReactElement,
            replyTo,
            attachments,
        });

        if (error) {
            console.error('Resend Email Error:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Unexpected Email Error:', error);
        return { success: false, error };
    }
}
