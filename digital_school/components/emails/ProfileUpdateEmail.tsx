import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface ProfileUpdateEmailProps {
    firstName: string;
    updateType: 'email' | 'phone';
    newValue: string;
    verificationLink?: string;
    institute?: InstituteData;
}

export const ProfileUpdateEmail: React.FC<Readonly<ProfileUpdateEmailProps>> = ({
    firstName,
    updateType,
    newValue,
    verificationLink,
    institute = { name: 'Digital School' },
}) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return (
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
                        Confirm your {updateType} change
                    </h2>
                    <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '28px', marginBottom: '32px' }}>
                        Hello {firstName},<br /><br />
                        We received a request to change your {updateType} to <strong>{newValue}</strong>.
                        {updateType === 'email' ? ' To complete this change, please click the button below within the next 24 hours:' : ' This change is now awaiting administrator approval.'}
                    </p>

                    {updateType === 'email' && verificationLink && (
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <a
                                href={verificationLink}
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
                                Confirm Email Change
                            </a>
                        </div>
                    )}

                    <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '32px', textAlign: 'center' }}>
                        If you did not request this change, please secure your account immediately by changing your password.
                    </p>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '32px 40px',
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #edf2f7',
                    textAlign: 'center'
                }}>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                        {institute.name}
                    </p>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            &copy; 2026 {institute.name} Learning Management System.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileUpdateEmail;
