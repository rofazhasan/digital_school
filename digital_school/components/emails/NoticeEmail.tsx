import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface NoticeEmailProps {
    title: string;
    description: string;
    postedBy: string;
    publishDate: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    institute?: InstituteData;
    baseUrl?: string;
}

export const NoticeEmail: React.FC<Readonly<NoticeEmailProps>> = ({
    title,
    description,
    postedBy,
    publishDate,
    priority = 'MEDIUM',
    institute = { name: 'Digital School' },
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
}) => {
    // Determine priority colors
    const priorityColor = priority === 'HIGH' ? '#ef4444' : priority === 'MEDIUM' ? '#f59e0b' : '#6366f1';
    const priorityLabel = priority === 'HIGH' ? 'URGENT NOTICE' : priority === 'MEDIUM' ? 'IMPORTANT UPDATE' : 'GENERAL ANNOUNCEMENT';
    const primaryColor = '#6366f1'; // Indigo 500

    // Mobile style tag
    const styleTag = `
        @media only screen and (max-width: 600px) {
            .mobile-padding { padding: 20px !important; }
            .mobile-title { fontSize: 22px !important; }
            .mobile-full { width: 100% !important; display: block !important; }
            .mobile-card { border-radius: 12px !important; }
        }
    `;

    return (
        <div style={{ backgroundColor: '#0f172a', padding: '40px 0', width: '100%', margin: '0' }}>
            <style dangerouslySetInnerHTML={{ __html: styleTag }} />

            <table align="center" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ maxWidth: '600px', backgroundColor: '#1e293b', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', borderCollapse: 'separate' }} className="mobile-card">
                <tbody>
                    {/* Banner Header */}
                    <tr>
                        <td align="center" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', padding: '48px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            {institute.logoUrl && (
                                <img src={institute.logoUrl} alt={institute.name} style={{ height: '48px', marginBottom: '24px', borderRadius: '12px', display: 'block' }} />
                            )}
                            <div style={{
                                display: 'inline-block',
                                backgroundColor: priorityColor,
                                color: '#ffffff',
                                padding: '6px 16px',
                                borderRadius: '100px',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.1em',
                                marginBottom: '20px',
                                textTransform: 'uppercase'
                            }}>
                                {priorityLabel}
                            </div>
                            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: '1.2' }} className="mobile-title">
                                Official Notice
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td className="mobile-padding" style={{ padding: '48px 40px' }}>
                            {/* Content Section */}
                            <div style={{ marginBottom: '40px' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', margin: '0 0 16px 0', lineHeight: '1.4' }}>
                                    {title}
                                </h2>

                                <table border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ marginBottom: '32px' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ verticalAlign: 'middle', width: 'auto' }}>
                                                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: '6px' }}>📅</span> {publishDate}
                                                    </span>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: '6px' }}>👤</span> {postedBy}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div style={{
                                    fontSize: '16px',
                                    color: '#cbd5e1',
                                    lineHeight: '1.8',
                                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                    padding: '32px',
                                    borderRadius: '20px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {description}
                                </div>
                            </div>

                            {/* CTA */}
                            <div style={{ textAlign: 'center' as const }}>
                                <a
                                    href={`${baseUrl}/dashboard`}
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: primaryColor,
                                        color: '#ffffff',
                                        padding: '18px 44px',
                                        borderRadius: '16px',
                                        textDecoration: 'none',
                                        fontWeight: '800',
                                        fontSize: '15px',
                                        letterSpacing: '0.025em',
                                        boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    View on Student Portal
                                </a>
                            </div>
                        </td>
                    </tr>

                    {/* Footer */}
                    <tr>
                        <td align="center" style={{ padding: '40px', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>
                                {institute.name}
                            </p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.6', maxWidth: '400px' }}>
                                This is an automated academic communication from the official portal.
                                Please check the dashboard for more details.
                            </p>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <p style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    © 2026 {institute.name} • SECURE COMMUNICATION
                </p>
            </div>
        </div>
    );
};

export default NoticeEmail;

