import React from 'react';
import { render } from '@react-email/render';
import { ExamResultEmail } from './components/emails/ExamResultEmail';
import fs from 'fs';

async function testEmail() {
    const html = await render(
        <ExamResultEmail
            studentName="Rafiu Hasan"
            examName="Final Examination 2026"
            results={[
                { subject: "Physics", marks: 85, totalMarks: 100, grade: "A+", mcqMarks: 25, sqMarks: 30, cqMarks: 30 },
                { subject: "Chemistry", marks: 78, totalMarks: 100, grade: "A", mcqMarks: 20, sqMarks: 28, cqMarks: 30 },
            ]}
            totalPercentage={81.5}
            finalGrade="A+"
            rank={3}
            hasAttachment={true}
            institute={{ name: "Digital School", address: "123 Education St, Dhaka" }}
            baseUrl="http://localhost:3000"
            remarks="Excellent performance. Keep it up!"
            semester="Fall 2026"
            section="Science A"
            examDate="December 15, 2026"
            examId="exam_123"
            studentId="stu_456"
        />
    );

    fs.writeFileSync('test-email.html', html);
    console.log('✅ Email rendered to test-email.html');
}

testEmail().catch(console.error);
