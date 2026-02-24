import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface VerificationEmailProps {
    firstName: string;
    verificationCode: string;
    expiryMinutes?: number;
    institute?: InstituteData;
    baseUrl?: string;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({
    firstName,
    verificationCode,
    expiryMinutes = 10,
    institute = { name: 'Digital School' },
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitalschool.netlify.app',
}) => (
    <div style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: '#f9fafb',
        padding: '48px 16px',
    }}>
        <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 50px rgba(0,0,0,0.08)',
            border: '1px solid #edf2f7'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '32px',
                textAlign: 'center'
            }}>
                {institute.logoUrl && (
                    <img src={institute.logoUrl} alt={institute.name} style={{ height: '48px', marginBottom: '16px' }} />
                )}
                <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.025em' }}>
                    {institute.name}
                </h1>
            </div>

            {/* Body */}
            <div style={{ padding: '48px 40px' }}>
                <h2 style={{ fontSize: '24px', color: '#111827', fontWeight: '700', marginBottom: '16px', letterSpacing: '-0.025em' }}>
                    Verify your identity
                </h2>
                <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '28px', marginBottom: '32px' }}>
                    Hello {firstName},<br /><br />
                    Welcome to **{institute.name}**. To complete your registration and secure your account, please use the verification code below:
                </p>

                <div style={{
                    backgroundColor: '#f3f4f6',
                    borderRadius: '12px',
                    padding: '32px',
                    textAlign: 'center',
                    marginBottom: '32px',
                    border: '2px solid #e5e7eb'
                }}>
                    <span style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        letterSpacing: '10px',
                        color: '#2563eb',
                        fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                    }}>
                        {verificationCode}
                    </span>
                </div>

                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px', textAlign: 'center' }}>
                    This code is valid for <strong>{expiryMinutes} minutes</strong>. For your security, please do not share this code with anyone.
                </p>

                <div style={{ textAlign: 'center' }}>
                    <a
                        href={`${baseUrl}/verify?code=${verificationCode}`}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            padding: '16px 40px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '16px',
                            display: 'inline-block',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Verify Email Address
                    </a>
                </div>
            </div>

            {/* Professional Footer */}
            <div style={{
                padding: '32px 40px',
                backgroundColor: '#f8fafc',
                borderTop: '1px solid #edf2f7',
                textAlign: 'center'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                    {institute.name}
                </p>
                {institute.address && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>
                        {institute.address}
                    </p>
                )}
                {institute.phone && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                        Phone: {institute.phone}
                    </p>
                )}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        &copy; 2026 {institute.name} Learning Management System.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default VerificationEmail;
