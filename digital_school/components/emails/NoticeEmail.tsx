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
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitalschool.netlify.app',
}) => {
    const priorityColor = priority === 'HIGH' ? '#ef4444' : priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6';
    const priorityLabel = priority === 'HIGH' ? 'URGENT' : priority === 'MEDIUM' ? 'IMPORTANT' : 'ANNOUNCEMENT';

    return (
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
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                    padding: '40px',
                    textAlign: 'center' as const,
                    color: '#ffffff'
                }}>
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: priorityColor,
                        padding: '6px 16px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        marginBottom: '20px'
                    }}>
                        {priorityLabel}
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                        Official Notice Board
                    </h1>
                </div>

                <div style={{ padding: '48px 40px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                            {title}
                        </h2>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
                            <span>📅 {publishDate}</span>
                            <span>👤 {postedBy}</span>
                        </div>
                        <div style={{
                            fontSize: '16px',
                            color: '#334155',
                            lineHeight: '1.8',
                            backgroundColor: '#f8fafc',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid #f1f5f9'
                        }}>
                            {description}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center' as const }}>
                        <a
                            href={`${baseUrl}/dashboard`}
                            style={{
                                display: 'inline-block',
                                backgroundColor: '#0f172a',
                                color: '#ffffff',
                                padding: '18px 40px',
                                borderRadius: '16px',
                                textDecoration: 'none',
                                fontWeight: '700',
                                fontSize: '15px',
                                boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)'
                            }}
                        >
                            View on Student Portal
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
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                        This is an automated academic alert. Please do not reply directly to this email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NoticeEmail;
