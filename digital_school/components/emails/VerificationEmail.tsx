import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface VerificationEmailProps {
    firstName: string;
    verificationLink: string;
    institute?: InstituteData;
}

export const VerificationEmail: React.FC<Readonly<VerificationEmailProps>> = ({
    firstName,
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
                    <span style={{ fontSize: '40px' }}>👋</span>
                </div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.03em' }}>
                    Verify Your Account
                </h1>
                <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '12px' }}>
                    Welcome to the {institute.name} community.
                </p>
            </div>

            <div style={{ padding: '48px 40px' }}>
                <p style={{ fontSize: '18px', color: '#e2e8f0', marginBottom: '32px', fontWeight: '600' }}>
                    Hello {firstName},
                </p>
                <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#94a3b8', marginBottom: '40px' }}>
                    We're excited to have you join us at **{institute.name}**. To get started and access your academic dashboard, please verify your email address below:
                </p>

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
                        Activate My Account
                    </a>
                </div>

                <div style={{ padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                        This activation link will expire in 24 hours. If you didn't create an account with {institute.name}, you can safely ignore this invitation.
                    </p>
                </div>
            </div>

            <div style={{
                padding: '48px 40px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                textAlign: 'center' as const,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0' }}>{institute.name}</p>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{institute.address}</p>
            </div>
        </div>
    </div>
);

export default VerificationEmail;
