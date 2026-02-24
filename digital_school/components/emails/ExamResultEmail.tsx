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
    // New realistic metadata
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
    const isAplus = finalGrade === 'A+';

    return (
        <div style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            backgroundColor: '#f4f7fa',
            padding: '40px 10px',
        }}>
            <div style={{
                maxWidth: '680px',
                margin: '0 auto',
                backgroundColor: '#ffffff',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e2e8f0'
            }}>
                {/* Top Accent Bar */}
                <div style={{ height: '8px', background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}></div>

                {/* Header Section */}
                <div style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                    padding: '56px 48px',
                    color: '#ffffff',
                    position: 'relative' as const
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ textAlign: 'left' as const }}>
                            {institute.logoUrl && (
                                <img src={institute.logoUrl} alt={institute.name} style={{ height: '44px', marginBottom: '20px', filter: 'brightness(0) invert(1)' }} />
                            )}
                            <h1 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-0.04em', lineHeight: '1' }}>
                                Academic Report
                            </h1>
                            <p style={{ fontSize: '15px', fontWeight: '500', opacity: 0.7, textTransform: 'uppercase' as const, letterSpacing: '2px' }}>
                                {institute.name} • {semester}
                            </p>
                        </div>
                        {isAplus && (
                            <div style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                padding: '12px 20px',
                                borderRadius: '100px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>🏆</span>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#38bdf8', letterSpacing: '0.5px' }}>TOP ACHIEVER</span>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '48px', display: 'flex', gap: '20px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                            <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const }}>Aggregate</p>
                            <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#38bdf8' }}>{totalPercentage}%</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                            <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const }}>Final Grade</p>
                            <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#4ade80' }}>{finalGrade}</p>
                        </div>
                        {rank && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', flex: 1, textAlign: 'center' as const }}>
                                <p style={{ fontSize: '11px', opacity: 0.5, margin: '0 0 8px 0', fontWeight: '700', textTransform: 'uppercase' as const }}>Class Rank</p>
                                <p style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#fbbf24' }}>#{rank}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ padding: '48px 48px 0 48px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '24px', backgroundColor: '#f8fafc', borderRadius: '24px', border: '1px solid #edf2f7' }}>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Student Name</p>
                            <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700', margin: 0 }}>{studentName}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Examination</p>
                            <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700', margin: 0 }}>{examName}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Section/Group</p>
                            <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700', margin: 0 }}>{section}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Issue Date</p>
                            <p style={{ fontSize: '16px', color: '#1e293b', fontWeight: '700', margin: 0 }}>{examDate}</p>
                        </div>
                    </div>
                </div>

                {/* Detailed Results Table */}
                <div style={{ padding: '48px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ width: '4px', height: '18px', backgroundColor: '#2563eb', borderRadius: '2px' }}></span>
                        Performance Breakdown
                    </h3>

                    <div style={{ border: '1px solid #f1f5f9', borderRadius: '20px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left' as const, padding: '20px 24px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' as const }}>Subject</th>
                                    <th style={{ textAlign: 'center' as const, padding: '20px 24px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' as const }}>Visualization</th>
                                    <th style={{ textAlign: 'right' as const, padding: '20px 24px', color: '#64748b', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' as const }}>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, idx) => {
                                    const percentage = (res.marks / res.totalMarks) * 100;
                                    return (
                                        <tr key={idx} style={{ borderTop: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '24px', verticalAlign: 'middle' }}>
                                                <p style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px', margin: 0 }}>{res.subject}</p>
                                                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>Score: {res.marks}/{res.totalMarks}</p>
                                            </td>
                                            <td style={{ padding: '24px', verticalAlign: 'middle' }}>
                                                <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: percentage >= 80 ? '#10b981' : percentage >= 40 ? '#3b82f6' : '#ef4444', borderRadius: '4px' }}></div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '24px', textAlign: 'right' as const, verticalAlign: 'middle' }}>
                                                <span style={{
                                                    backgroundColor: res.grade.includes('A') ? '#ecfdf5' : '#f8fafc',
                                                    color: res.grade.includes('A') ? '#059669' : '#1e293b',
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    fontWeight: '900',
                                                    fontSize: '14px',
                                                    border: res.grade.includes('A') ? '1px solid #d1fae5' : '1px solid #e2e8f0'
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

                    {hasAttachment && (
                        <div style={{
                            marginTop: '40px',
                            padding: '24px',
                            backgroundColor: '#eff6ff',
                            borderRadius: '24px',
                            border: '1px solid #dbeafe',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px'
                        }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: '#3b82f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '24px', color: 'white' }}>📄</span>
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '15px', color: '#1e40af', fontWeight: '700' }}>Evaluated Script Available</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#60a5fa' }}>Your detailed answer sheet and teacher feedback is attached.</p>
                            </div>
                        </div>
                    )}

                    {remarks && (
                        <div style={{
                            marginTop: '32px',
                            padding: '32px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '24px',
                            borderLeft: '4px solid #0f172a'
                        }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: '12px' }}>
                                Teacher's Remarks
                            </p>
                            <p style={{ margin: 0, fontSize: '15px', color: '#334155', fontStyle: 'italic', lineHeight: '1.6' }}>
                                "{remarks}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Authentication Signature Section */}
                <div style={{ padding: '0 48px 48px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center' as const }}>
                        <div style={{ width: '140px', borderBottom: '1px solid #cbd5e1', marginBottom: '12px' }}></div>
                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Exam Controller</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>{institute.name}</p>
                    </div>
                    <div style={{ textAlign: 'center' as const }}>
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/e/e8/Signature_of_Abraham_Lincoln.svg"
                            alt="Principal Signature"
                            style={{ width: '120px', height: '40px', marginBottom: '8px', opacity: 0.8 }}
                        />
                        <p style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Principal Signature</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Certified Academic Document</p>
                    </div>
                </div>

                {/* Professional Footer */}
                <div style={{
                    padding: '40px 48px',
                    backgroundColor: '#f8fafc',
                    textAlign: 'center' as const,
                    borderTop: '1px solid #f1f5f9'
                }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
                        {institute.name}
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.6' }}>
                        {institute.address}<br />
                        Support: {institute.phone} • Official Report ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                    </p>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
                        <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, textTransform: 'uppercase' as const, letterSpacing: '0.2em' }}>
                            Digital School Excellence Portfolio • Secure Electronic Transmission
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamResultEmail;
