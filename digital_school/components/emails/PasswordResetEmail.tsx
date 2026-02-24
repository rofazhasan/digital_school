import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface PasswordResetEmailProps {
    firstName: string;
    resetLink: string;
    institute?: InstituteData;
}

export const PasswordResetEmail: React.FC<Readonly<PasswordResetEmailProps>> = ({
    firstName,
    resetLink,
    institute = { name: 'Digital School' },
}) => (
    <div style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: '#f8fafc',
        padding: '60px 20px',
    }}>
        <div style={{
            maxWidth: '560px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            border: '1px solid #eef2f6'
        }}>
            <div style={{ padding: '48px' }}>
                <div style={{ marginBottom: '40px', textAlign: 'center' as const }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '20px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <span style={{ fontSize: '32px' }}>🔒</span>
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.025em' }}>
                        Password Reset Request
                    </h1>
                    <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px' }}>
                        Secure access for {institute.name}
                    </p>
                </div>

                <p style={{ fontSize: '16px', lineHeight: '1.7', color: '#475569', marginBottom: '32px' }}>
                    Hello {firstName},<br /><br />
                    We received a request to reset the password for your account at **{institute.name}**. To choose a new password and regain access, click the button below:
                </p>

                <a
                    href={resetLink}
                    style={{
                        display: 'block',
                        backgroundColor: '#1e293b',
                        color: '#ffffff',
                        padding: '18px',
                        borderRadius: '14px',
                        textDecoration: 'none',
                        fontWeight: '700',
                        fontSize: '16px',
                        textAlign: 'center',
                        marginBottom: '32px',
                        boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)'
                    }}
                >
                    Reset My Password
                </a>

                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: 0, textAlign: 'center' as const }}>
                    If you didn't request a password reset, you can safely ignore this email. Your current password will remain unchanged.
                </p>

                <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '13px', color: '#abb5c4', margin: 0, marginBottom: '8px' }}>
                        Trouble with the button? Copy and paste this URL:
                    </p>
                    <div style={{
                        backgroundColor: '#f8fafc',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        wordBreak: 'break-all' as const
                    }}>
                        <p style={{ fontSize: '12px', color: '#2563eb', margin: 0 }}>
                            {resetLink}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '32px 48px',
                backgroundColor: '#f8fafc',
                textAlign: 'center' as const,
                borderTop: '1px solid #f1f5f9'
            }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#334155', margin: '0 0 4px 0' }}>
                    {institute.name}
                </p>
                {institute.address && (
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px 0' }}>
                        {institute.address}
                    </p>
                )}
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    &copy; 2026 {institute.name}
                </p>
            </div>
        </div>
    </div>
);

export default PasswordResetEmail;
