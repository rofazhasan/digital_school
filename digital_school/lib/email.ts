import nodemailer, { Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import React from 'react';

// Create a singleton transporter for Brevo SMTP
let transporter: Transporter | null = null;

function getTransporter() {
    if (!transporter) {
        // Brevo SMTP Defaults
        const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
        const port = Number(process.env.SMTP_PORT) || 587;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (!user || !pass) {
            console.warn('⚠️ Brevo SMTP credentials (SMTP_USER/SMTP_PASS) not defined. Email sending will fail.');
        }

        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
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
 * Standardized function to send emails using Brevo SMTP.
 * Reliable and supports high daily limits.
 */
export async function sendEmail({
    to,
    subject,
    react,
    from = process.env.EMAIL_FROM || 'Digital School <onboarding@resend.dev>',
    replyTo,
    attachments,
}: SendEmailProps) {
    try {
        const mailer = getTransporter();

        // Render the React component to HTML
        const html = await render(react as React.ReactElement);

        console.log(`[EMAIL] Attempting to send email via Brevo to ${to} with ${attachments?.length || 0} attachments.`);

        const info = await mailer.sendMail({
            from,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
            replyTo,
            attachments: attachments?.map(att => {
                const attachment: { filename: string; content?: Buffer | string; path?: string } = { filename: att.filename };
                if (att.content) {
                    attachment.content = att.content; // Can be Buffer or string
                }
                if (att.path) attachment.path = att.path;
                return attachment;
            })
        });

        console.log('[EMAIL] Email sent successfully via Brevo:', info.messageId);
        return { success: true, data: info };
    } catch (error) {
        console.error('[EMAIL] Brevo SMTP Error:', error);
        return { success: false, error };
    }
}
