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
        fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
            {/* Gradient Header */}
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
                    <span style={{ fontSize: '40px' }}>🔐</span>
                </div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    margin: 0,
                    letterSpacing: '-0.03em',
                    lineHeight: '1.2'
                }}>
                    Account Security
                </h1>
                <p style={{
                    fontSize: '16px',
                    color: '#94a3b8',
                    marginTop: '12px',
                    fontWeight: '500'
                }}>
                    Secure access for {institute.name}
                </p>
            </div>

            <div style={{ padding: '48px 40px' }}>
                <p style={{
                    fontSize: '18px',
                    lineHeight: '1.6',
                    color: '#e2e8f0',
                    marginBottom: '32px',
                    fontWeight: '500'
                }}>
                    Hello {firstName},
                </p>
                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.8',
                    color: '#94a3b8',
                    marginBottom: '40px'
                }}>
                    We received a request to securely reset your password. Your data security is our top priority. Please use the button below to establish your new credentials:
                </p>

                <div style={{ textAlign: 'center' as const, marginBottom: '40px' }}>
                    <a
                        href={resetLink}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#4f46e5',
                            color: '#ffffff',
                            padding: '20px 48px',
                            borderRadius: '18px',
                            textDecoration: 'none',
                            fontWeight: '800',
                            fontSize: '17px',
                            textAlign: 'center',
                            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)',
                            letterSpacing: '-0.01em'
                        }}
                    >
                        Securely Reset Password
                    </a>
                </div>

                <div style={{
                    padding: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '40px'
                }}>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: 0 }}>
                        <strong style={{ color: '#e2e8f0' }}>Didn't request this?</strong> If you didn't initiate this request, you can safely ignore this email. Your account remains fully protected.
                    </p>
                </div>

                <div style={{ borderTop: '1px dotted rgba(255, 255, 255, 0.1)', paddingTop: '32px' }}>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0, marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        Direct URL Link
                    </p>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        wordBreak: 'break-all' as const
                    }}>
                        <p style={{ fontSize: '13px', color: '#3b82f6', margin: 0, opacity: 0.8 }}>
                            {resetLink}
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Footer */}
            <div style={{
                padding: '48px 40px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                textAlign: 'center' as const,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                {institute.logoUrl && (
                    <img src={institute.logoUrl} alt={institute.name} style={{ height: '32px', marginBottom: '24px', opacity: 0.6 }} />
                )}
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '0.05em' }}>
                    {institute.name}
                </p>
                {institute.address && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0', lineHeight: '1.5' }}>
                        {institute.address}
                    </p>
                )}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <p style={{ fontSize: '11px', color: '#334155', textTransform: 'uppercase' as const, letterSpacing: '0.2em' }}>
                        &copy; 2026 Digital School Excellence • Secure Transmission
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default PasswordResetEmail;
