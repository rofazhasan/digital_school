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
    cqMarks?: number;
    sqMarks?: number;
    mcqMarks?: number;
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
    examId?: string;
    studentId?: string;
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
    semester = '2026 Academic Session',
    section = 'A',
    examDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    examId,
    studentId,
    remarks
}) => {
    // Determine status colors
    const primaryColor = '#6366f1'; // Indigo 500
    const successColor = '#10b981'; // Emerald 500
    const warningColor = '#f59e0b'; // Amber 500
    const dangerColor = '#ef4444'; // Red 500

    const scoreColor = totalPercentage >= 80 ? successColor : totalPercentage >= 40 ? primaryColor : dangerColor;
    const scriptUrl = (examId && studentId)
        ? `${baseUrl}/exams/evaluations/${examId}/print/${studentId}`
        : `${baseUrl}/student/results`;

    // Inline simple CSS for clients that support it
    const styleTag = `
        @media only screen and (max-width: 600px) {
            .mobile-full { width: 100% !important; display: block !important; }
            .mobile-hide { display: none !important; }
            .mobile-center { text-align: center !important; }
            .mobile-padding { padding: 10px !important; }
            .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 20px !important; }
        }
    `;

    return (
        <div style={{ backgroundColor: '#0f172a', padding: '20px 0', width: '100%', margin: '0' }}>
            <style dangerouslySetInnerHTML={{ __html: styleTag }} />
            {/* Main Wrapper Table */}
            <table align="center" border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ maxWidth: '600px', backgroundColor: '#1e293b', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', borderCollapse: 'separate' }}>
                <tbody>
                    {/* Visual Header / Banner */}
                    <tr>
                        <td align="center" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '40px 20px' }}>
                            {institute.logoUrl && (
                                <img src={institute.logoUrl} alt={institute.name} style={{ height: '48px', marginBottom: '20px', borderRadius: '12px', display: 'block' }} />
                            )}
                            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.025em', color: '#ffffff' }}>Result Released</h1>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                {examName} • {semester}
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style={{ padding: '30px 20px' }}>
                            {/* Main Stats Table */}
                            <table border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                                <tbody>
                                    <tr>
                                        <td align="center" style={{ padding: '20px 10px', width: '33%' }}>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Score</p>
                                            <p style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: scoreColor }}>{totalPercentage}%</p>
                                        </td>
                                        <td style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></td>
                                        <td align="center" style={{ padding: '20px 10px', width: '33%' }}>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Grade</p>
                                            <p style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: successColor }}>{finalGrade}</p>
                                        </td>
                                        {rank && (
                                            <>
                                                <td style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></td>
                                                <td align="center" style={{ padding: '20px 10px', width: '33%' }}>
                                                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 4px 0', fontWeight: '700', textTransform: 'uppercase' }}>Rank</p>
                                                    <p style={{ fontSize: '24px', fontWeight: '900', margin: 0, color: warningColor }}>#{rank}</p>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                </tbody>
                            </table>

                            {/* Student Information Section */}
                            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: '#f1f5f9' }}>Student Information</h2>
                            <table border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ marginBottom: '30px' }}>
                                <tbody>
                                    <tr>
                                        {/* Using separate table cells for info cards to handle stacking better */}
                                        <td className="mobile-stack" style={{ width: '48%', paddingRight: '2%', verticalAlign: 'top' }}>
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', margin: '0 0 4px 0' }}>Name</p>
                                                <p style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', margin: 0 }}>{studentName}</p>
                                            </div>
                                        </td>
                                        <td className="mobile-stack" style={{ width: '48%', paddingLeft: '2%', verticalAlign: 'top' }}>
                                            <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px', margin: '0 0 4px 0' }}>Date</p>
                                                <p style={{ fontSize: '14px', color: '#f8fafc', fontWeight: '600', margin: 0 }}>{examDate}</p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Performance Breakdown Section */}
                            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0', color: '#f1f5f9' }}>Performance Breakdown</h2>
                            {results.map((res, idx) => (
                                <table key={idx} border={0} cellPadding={0} cellSpacing={0} width="100%" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '0 0 16px 0' }}>
                                                <table border={0} cellPadding={0} cellSpacing={0} width="100%">
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ verticalAlign: 'top' }}>
                                                                <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>{res.subject}</h3>
                                                                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Grade: {res.grade}</p>
                                                            </td>
                                                            <td align="right" style={{ verticalAlign: 'top' }}>
                                                                <span style={{ fontSize: '20px', fontWeight: '900', color: scoreColor }}>{res.marks}</span>
                                                                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>/ {res.totalMarks}</span>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                        {(res.mcqMarks !== undefined || res.cqMarks !== undefined || res.sqMarks !== undefined) && (
                                            <tr>
                                                <td style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                                                    <table border={0} cellPadding={0} cellSpacing={0} width="100%">
                                                        <tbody>
                                                            <tr>
                                                                {res.mcqMarks !== undefined && (
                                                                    <td style={{ width: '31%', padding: '0 1%' }}>
                                                                        <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '12px', textAlign: 'center' }}>
                                                                            <p style={{ fontSize: '8px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 2px 0' }}>MCQ</p>
                                                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', margin: 0 }}>{res.mcqMarks}</p>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                {res.sqMarks !== undefined && (
                                                                    <td style={{ width: '31%', padding: '0 1%' }}>
                                                                        <div style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', padding: '8px', borderRadius: '12px', textAlign: 'center' }}>
                                                                            <p style={{ fontSize: '8px', color: '#a855f7', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 2px 0' }}>SQ</p>
                                                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#a855f7', margin: 0 }}>{res.sqMarks}</p>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                {res.cqMarks !== undefined && (
                                                                    <td style={{ width: '31%', padding: '0 1%' }}>
                                                                        <div style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', padding: '8px', borderRadius: '12px', textAlign: 'center' }}>
                                                                            <p style={{ fontSize: '8px', color: '#ec4899', fontWeight: '800', textTransform: 'uppercase', margin: '0 0 2px 0' }}>CQ</p>
                                                                            <p style={{ fontSize: '13px', fontWeight: '700', color: '#ec4899', margin: 0 }}>{res.cqMarks}</p>
                                                                        </div>
                                                                    </td>
                                                                )}
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ))}

                            {remarks && (
                                <div style={{ padding: '20px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', borderLeft: `4px solid ${warningColor}`, marginBottom: '30px' }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '800', color: warningColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Instructor Remarks</p>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#d1d5db', lineHeight: '1.6', fontStyle: 'italic' }}>"{remarks}"</p>
                                </div>
                            )}

                            {hasAttachment && (
                                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '2px dashed rgba(255,255,255,0.1)' }}>
                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px 0' }}>Your detailed answer script is attached as a PDF.</p>
                                    <a href={scriptUrl} style={{ display: 'inline-block', backgroundColor: primaryColor, color: '#ffffff', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', textDecoration: 'none' }}>
                                        View Detailed Script
                                    </a>
                                </div>
                            )}
                        </td>
                    </tr>

                    {/* Footer Row */}
                    <tr>
                        <td align="center" style={{ padding: '30px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', margin: '0 0 4px 0' }}>{institute.name}</p>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                                {institute.address}<br />
                                This is an automated academic report.
                            </p>
                            <table align="center" border={0} cellPadding={0} cellSpacing={0}>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0 10px' }}><span style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Privacy Policy</span></td>
                                        <td style={{ padding: '0 10px' }}><span style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Terms of Service</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.2em' }}>© 2026 DIGITAL SCHOOL • SECURE DOCUMENT</p>
            </div>
        </div>
    );
};

export default ExamResultEmail;
