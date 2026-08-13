import React from 'react';
import ReactDOMServer from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { SAMPLE_9_TYPE_EXAM } from './test-complete-exam-lifecycle';
import QuestionPaper from '../app/components/QuestionPaper';
import AnswerQuestionPaper from '../app/components/Answer_QuestionPaper';

async function generateSnapshots() {
  console.log("=== GENERATING PRINT & ANSWER KEY PDF HTML SNAPSHOTS ===");

  const examInfo = {
    schoolName: SAMPLE_9_TYPE_EXAM.schoolName,
    schoolAddress: SAMPLE_9_TYPE_EXAM.schoolAddress,
    title: SAMPLE_9_TYPE_EXAM.title,
    subject: SAMPLE_9_TYPE_EXAM.subject,
    class: SAMPLE_9_TYPE_EXAM.class,
    date: SAMPLE_9_TYPE_EXAM.date,
    duration: SAMPLE_9_TYPE_EXAM.duration,
    totalMarks: SAMPLE_9_TYPE_EXAM.totalMarks,
    set: SAMPLE_9_TYPE_EXAM.set,
  };

  const questionsPayload = {
    mcq: SAMPLE_9_TYPE_EXAM.questions.mcq as any,
    mc: SAMPLE_9_TYPE_EXAM.questions.mc as any,
    int: SAMPLE_9_TYPE_EXAM.questions.int as any,
    ar: SAMPLE_9_TYPE_EXAM.questions.ar as any,
    mtf: SAMPLE_9_TYPE_EXAM.questions.mtf as any,
    cq: [],
    sq: [],
    descriptive: [],
    smcq: SAMPLE_9_TYPE_EXAM.questions.smcq,
    cma: SAMPLE_9_TYPE_EXAM.questions.cma,
    mpc: SAMPLE_9_TYPE_EXAM.questions.mpc,
    dr: SAMPLE_9_TYPE_EXAM.questions.dr,
  };

  // 1. Render Question Paper
  const qpElement = React.createElement(QuestionPaper, {
    examInfo,
    questions: questionsPayload,
    qrData: { examId: SAMPLE_9_TYPE_EXAM.id },
    language: 'en'
  });

  const qpHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Question Paper - 9 Types Audit</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-8">
  ${ReactDOMServer.renderToString(qpElement)}
</body>
</html>`;

  // 2. Render Answer Key Paper
  const aqpElement = React.createElement(AnswerQuestionPaper, {
    examInfo,
    questions: questionsPayload,
    qrData: { examId: SAMPLE_9_TYPE_EXAM.id },
    language: 'en'
  });

  const aqpHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Answer Key Paper - 9 Types Audit</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-8">
  ${ReactDOMServer.renderToString(aqpElement)}
</body>
</html>`;

  const artifactDir = "/Users/md.rofazhasanrafiu/.gemini/antigravity-ide/brain/fad3a53b-971b-46f7-b5b1-51237333b217";
  fs.writeFileSync(path.join(artifactDir, "print_question_paper_9types.html"), qpHtml);
  fs.writeFileSync(path.join(artifactDir, "print_answer_key_9types.html"), aqpHtml);

  console.log("✅ Successfully saved print_question_paper_9types.html & print_answer_key_9types.html to artifact directory!");
}

generateSnapshots().catch(err => {
  console.error("Error generating snapshots:", err);
  process.exit(1);
});
