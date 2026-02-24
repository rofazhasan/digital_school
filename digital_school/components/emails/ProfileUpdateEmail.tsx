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
}) => (
    <div style={{
        fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
        backgroundColor: '#070b14',
        padding: '60px 10px',
        color: '#f8fafc',
    }}>
        <div style={{
            maxWidth: '580px',
            margin: '0 auto',
            backgroundColor: '#111827',
            borderRadius: '40px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
                padding: '48px 40px',
                textAlign: 'center' as const,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '24px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <span style={{ fontSize: '40px' }}>🛡️</span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.03em' }}>
                    Profile Update
                </h1>
                <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '12px' }}>
                    Security Alert for {institute.name}
                </p>
            </div>

            <div style={{ padding: '48px 40px' }}>
                <p style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '32px', fontWeight: '600' }}>
                    Hello {firstName},
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#94a3b8', marginBottom: '32px' }}>
                    We received a request to change your registered {updateType} to <strong>{newValue}</strong>.
                    {updateType === 'email' ? ' To finalize this change, please confirm your new email address:' : ' This update is now pending administrative approval for security compliance.'}
                </p>

                {updateType === 'email' && verificationLink && (
                    <div style={{ textAlign: 'center' as const, marginBottom: '40px' }}>
                        <a
                            href={verificationLink}
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#4f46e5',
                                color: '#ffffff',
                                padding: '20px 48px',
                                borderRadius: '18px',
                                textDecoration: 'none',
                                fontWeight: '800',
                                fontSize: '17px',
                                boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                            }}
                        >
                            Confirm Email Change
                        </a>
                    </div>
                )}

                <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                        <strong>Not you?</strong> If you didn't request this change, please sign in and secure your account immediately or contact {institute.name} support.
                    </p>
                </div>
            </div>

            <div style={{
                padding: '48px 48px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                textAlign: 'center' as const,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>{institute.name}</p>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>
                    Protected by Digital School Security v4.0
                </p>
            </div>
        </div>
    </div>
);

export default ProfileUpdateEmail;
