import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

// Create a singleton transporter for Gmail SMTP
let transporter: any = null;

function getTransporter() {
    if (!transporter) {
        const user = process.env.GMAIL_USER;
        const pass = process.env.GMAIL_APP_PASSWORD;

        if (!user || !pass) {
            console.warn('⚠️ GMAIL_USER or GMAIL_APP_PASSWORD not defined. Email sending will fail.');
        }

        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user,
                pass,
            },
        });
    }
    return transporter;
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
 * Standardized function to send emails using Gmail SMTP (via Nodemailer).
 * Replaces Resend for better reliability and free arbitrary recipient support.
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
        const mailer = getTransporter();

        // Render the React component to HTML
        const html = await render(react as React.ReactElement);

        const info = await mailer.sendMail({
            from,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
            replyTo,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                path: att.path
            }))
        });

        console.log('[EMAIL] Email sent successfully via Gmail:', info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('[EMAIL] Unexpected SMTP Error:', error);
        return { success: false, error };
    }
}
