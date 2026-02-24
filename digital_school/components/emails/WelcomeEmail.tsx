import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface WelcomeEmailProps {
    firstName: string;
    institute?: InstituteData;
    baseUrl?: string;
    temporaryPassword?: string;
}

export const WelcomeEmail: React.FC<Readonly<WelcomeEmailProps>> = ({
    firstName,
    institute = { name: 'Digital School' },
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitalschool.netlify.app',
    temporaryPassword,
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
            {/* Header with Background */}
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                padding: '60px 40px',
                textAlign: 'center' as const,
                color: '#ffffff'
            }}>
                {institute.logoUrl && (
                    <img src={institute.logoUrl} alt={institute.name} style={{ height: '56px', marginBottom: '24px', filter: 'brightness(0) invert(1)' }} />
                )}
                <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                    Welcome onboard!
                </h1>
                <p style={{ fontSize: '18px', opacity: 0.8, marginTop: '12px' }}>
                    to {institute.name} Excellence Portal
                </p>
            </div>

            <div style={{ padding: '48px 40px' }}>
                <p style={{ fontSize: '18px', color: '#1e293b', lineHeight: '1.7', marginBottom: '32px' }}>
                    Hello **{firstName}**, we're thrilled to have you join our academic community. Your digital workspace is now ready for exploration.
                </p>

                {temporaryPassword && (
                    <div style={{ padding: '32px', backgroundColor: '#fefce8', borderRadius: '20px', marginBottom: '32px', border: '1px solid #fef08a', textAlign: 'center' as const }}>
                        <p style={{ margin: 0, fontWeight: '800', color: '#854d0e', fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                            Your Temporary Access
                        </p>
                        <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px dashed #facc15', display: 'inline-block', minWidth: '200px' }}>
                            <p style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#1e293b', letterSpacing: '0.1em' }}>
                                {temporaryPassword}
                            </p>
                        </div>
                        <p style={{ margin: '16px 0 0 0', fontSize: '13px', color: '#a16207' }}>
                            Please change this password immediately after your first login.
                        </p>
                    </div>
                )}

                <div style={{ padding: '32px', backgroundColor: '#f0f9ff', borderRadius: '20px', marginBottom: '32px', border: '1px solid #e0f2fe' }}>
                    <p style={{ margin: 0, fontWeight: '800', color: '#0369a1', fontSize: '16px', marginBottom: '16px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        Getting Started
                    </p>
                    <ul style={{ marginTop: '0', paddingLeft: '0', listStyle: 'none' }}>
                        {[
                            'Personalize your student profile',
                            'Access your interactive dashboard',
                            'Review upcoming exams and schedule'
                        ].map((item, idx) => (
                            <li key={idx} style={{ position: 'relative' as const, paddingLeft: '28px', marginBottom: '12px', fontSize: '15px', color: '#334155' }}>
                                <span style={{ position: 'absolute' as const, left: 0, color: '#38bdf8', fontWeight: 'bold' }}>✓</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ textAlign: 'center' as const }}>
                    <a
                        href={baseUrl}
                        style={{
                            display: 'inline-block',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '20px 48px',
                            borderRadius: '16px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '16px',
                            boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)'
                        }}
                    >
                        Enter your Dashboard
                    </a>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '40px',
                backgroundColor: '#f8fafc',
                textAlign: 'center' as const,
                borderTop: '1px solid #f1f5f9'
            }}>
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px 0' }}>
                    {institute.name}
                </p>
                {institute.address && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 4px 0' }}>
                        {institute.address}
                    </p>
                )}
                {institute.phone && (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>
                        {institute.phone}
                    </p>
                )}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                        &copy; 2026 {institute.name} Academic System. No further action is required.
                    </p>
                </div>
            </div>
        </div>
    </div>
);

export default WelcomeEmail;
