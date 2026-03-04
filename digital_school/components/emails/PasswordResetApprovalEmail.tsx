import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface PasswordResetApprovalEmailProps {
    userName: string;
    userIdentifier: string;
    institute?: InstituteData;
    baseUrl?: string;
}

export const PasswordResetApprovalEmail: React.FC<Readonly<PasswordResetApprovalEmailProps>> = ({
    userName,
    userIdentifier,
    institute = { name: 'Digital School' },
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}) => (
    <div style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        backgroundColor: '#f8fafc',
        padding: '60px 20px',
    }}>
        <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            border: '1px solid #eef2f6'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                padding: '40px',
                textAlign: 'center' as const,
                color: '#ffffff'
            }}>
                {institute.logoUrl && (
                    <img src={institute.logoUrl} alt={institute.name} style={{ height: '56px', marginBottom: '24px', filter: 'brightness(0) invert(1)' }} />
                )}
                <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                    Password Reset Approval
                </h1>
                <p style={{ fontSize: '16px', opacity: 0.8, marginTop: '12px' }}>
                    Manual Verification Required
                </p>
            </div>

            <div style={{ padding: '48px 40px' }}>
                <p style={{ fontSize: '18px', color: '#1e293b', lineHeight: '1.7', marginBottom: '32px' }}>
                    A user has requested a password reset, but SMS delivery failed or was unavailable. As per security policies, this request requires manual approval by an administrator.
                </p>

                <div style={{ padding: '32px', backgroundColor: '#f0f9ff', borderRadius: '20px', marginBottom: '32px', border: '1px solid #e0f2fe' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#0369a1', fontSize: '16px', marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        User Details
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Name:</td>
                                <td style={{ padding: '8px 0', fontSize: '14px', color: '#1e293b' }}>{userName}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 0', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Identifier:</td>
                                <td style={{ padding: '8px 0', fontSize: '14px', color: '#1e293b' }}>{userIdentifier}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{ textAlign: 'center' as const }}>
                    <a
                        href={`${baseUrl}/admin/users`}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#4338ca',
                            color: '#ffffff',
                            padding: '20px 48px',
                            borderRadius: '16px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '16px',
                            boxShadow: '0 10px 20px rgba(67, 56, 202, 0.2)'
                        }}
                    >
                        Approve in Admin Dashboard
                    </a>
                </div>
            </div>

            <div style={{
                padding: '40px',
                backgroundColor: '#f8fafc',
                textAlign: 'center' as const,
                borderTop: '1px solid #f1f5f9'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
                    {institute.name}
                </p>
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        &copy; 2026 {institute.name} Academic System.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default PasswordResetApprovalEmail;
