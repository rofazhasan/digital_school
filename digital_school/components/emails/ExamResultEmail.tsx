import * as React from 'react';

interface InstituteData {
    name: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
}

interface ResultItem {
    subject: string;
    marks: number;
    totalMarks: number;
    grade: string;
}

interface ExamResultEmailProps {
    studentName: string;
    examName: string;
    results: ResultItem[];
    totalPercentage: number;
    finalGrade: string;
    rank?: number;
    hasAttachment?: boolean;
    institute?: InstituteData;
    baseUrl?: string;
    remarks?: string;
    semester?: string;
    section?: string;
    examDate?: string;
}

export const ExamResultEmail: React.FC<Readonly<ExamResultEmailProps>> = ({
    studentName,
    examName,
    results,
    totalPercentage,
    finalGrade,
    rank,
    hasAttachment = true,
    institute = { name: 'Digital School' },
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digitalschool.netlify.app',
    semester = 'Spring 2026',
    section = 'A',
    examDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    remarks
}) => {
    const isExcellent = totalPercentage >= 80;

    return (
        <div style={{
            fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
            backgroundColor: '#070b14',
            padding: '40px 10px',
            color: '#f8fafc',
        }}>
            <div style={{
                maxWidth: '680px',
                margin: '0 auto',
                backgroundColor: '#111827',
                borderRadius: '40px',
                overflow: 'hidden',
                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #312e81 100%)',
                    padding: '56px 48px',
                    color: '#ffffff',
                    position: 'relative' as const,
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ marginBottom: '32px' }}>
                        {institute.logoUrl && (
                            <img src={institute.logoUrl} alt={institute.name} style={{ height: '40px', marginBottom: '24px', opacity: 0.8 }} />
                        )}
                        <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.04em', lineHeight: '1' }}>
                            Academic Report
                        </h1>
                        <p style={{ fontSize: '15px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '2px' }}>
                            {institute.name} • {semester}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Score</p>
                            <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#38bdf8' }}>{totalPercentage}%</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Grade</p>
                            <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#4ade80' }}>{finalGrade}</p>
                        </div>
                        {rank && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Rank</p>
                                <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#fbbf24' }}>#{rank}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ padding: '40px 48px' }}>
                    <div style={{
                        padding: '24px',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexWrap: 'wrap' as const,
                        gap: '24px'
                    }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <p style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Student</p>
                            <p style={{ fontSize: '16px', color: '#f8fafc', fontWeight: '700', margin: 0 }}>{studentName}</p>
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <p style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Examination</p>
                            <p style={{ fontSize: '16px', color: '#f8fafc', fontWeight: '700', margin: 0 }}>{examName}</p>
                        </div>
                        <div style={{ flex: '1 1 100px' }}>
                            <p style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Section</p>
                            <p style={{ fontSize: '16px', color: '#f8fafc', fontWeight: '700', margin: 0 }}>{section}</p>
                        </div>
                        <div style={{ flex: '1 1 100px' }}>
                            <p style={{ fontSize: '11px', color: '#475569', fontWeight: '800', textTransform: 'uppercase' as const, marginBottom: '6px' }}>Date</p>
                            <p style={{ fontSize: '16px', color: '#f8fafc', fontWeight: '700', margin: 0 }}>{examDate}</p>
                        </div>
                    </div>
                </div>

                {/* Table Breakdown */}
                <div style={{ padding: '0 48px 48px 48px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f1f5f9', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        Performance Analysis
                    </h3>

                    <div style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ textAlign: 'left' as const, padding: '20px 24px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' as const }}>Subject</th>
                                    <th style={{ textAlign: 'center' as const, padding: '20px 24px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' as const }}>Progress</th>
                                    <th style={{ textAlign: 'right' as const, padding: '20px 24px', color: '#64748b', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' as const }}>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, idx) => {
                                    const percentage = (res.marks / res.totalMarks) * 100;
                                    const color = percentage >= 80 ? '#10b981' : percentage >= 40 ? '#3b82f6' : '#ef4444';
                                    return (
                                        <tr key={idx} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '24px' }}>
                                                <p style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '15px', margin: 0 }}>{res.subject}</p>
                                                <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0 0' }}>{res.marks} / {res.totalMarks}</p>
                                            </td>
                                            <td style={{ padding: '24px', verticalAlign: 'middle' }}>
                                                <div style={{ width: '120px', height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', margin: '0 auto', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: color, borderRadius: '4px shadow-glow' }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '24px', textAlign: 'right' as const }}>
                                                <span style={{
                                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                                    color: color,
                                                    padding: '8px 16px',
                                                    borderRadius: '14px',
                                                    fontWeight: '900',
                                                    fontSize: '14px',
                                                    border: `1px solid ${color}20`
                                                }}>
                                                    {res.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {remarks && (
                        <div style={{
                            marginTop: '40px',
                            padding: '32px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            borderRadius: '28px',
                            borderLeft: '4px solid #4f46e5',
                            fontStyle: 'italic'
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '12px' }}>
                                Official Remarks
                            </p>
                            <p style={{ margin: 0, fontSize: '16px', color: '#94a3b8', lineHeight: '1.6' }}>
                                "{remarks}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '48px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    textAlign: 'center' as const,
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', margin: '0 0 6px 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                        {institute.name}
                    </p>
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 32px 0', lineHeight: '1.6' }}>
                        {institute.address}<br />
                        Confidential Academic Report • Digital School Portfolio
                    </p>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '32px' }}>
                        <p style={{ fontSize: '10px', color: '#334155', textTransform: 'uppercase' as const, letterSpacing: '0.2em' }}>
                            SECURE ELECTRONIC DOCUMENT • VERIFIED BY DIGITAL SCHOOL v4.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamResultEmail;
