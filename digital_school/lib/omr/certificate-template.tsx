/**
 * OMR Marksheet PDF Template — Phase 3-C
 *
 * A fully styled @react-pdf/renderer document.
 * Generates an A4 portrait marksheet with:
 *   - Institute header
 *   - Student details table
 *   - Score summary (marks, percentage, grade)
 *   - Question-wise MCQ result grid
 *   - QR verification footer
 */

import React from 'react';
import {
  Document, Page, View, Text, StyleSheet, Svg, Path, G, Rect, Line,
} from '@react-pdf/renderer';

// ─── Styles ────────────────────────────────────────────────────────────────────

const COLOR = {
  primary:    '#5b21b6',
  secondary:  '#7c3aed',
  accent:     '#a78bfa',
  bg:         '#f8f7ff',
  white:      '#ffffff',
  textDark:   '#1e1b4b',
  textMid:    '#4b5563',
  textLight:  '#9ca3af',
  correct:    '#059669',
  wrong:      '#dc2626',
  blank:      '#9ca3af',
  border:     '#e5e7eb',
  headerBg:   '#5b21b6',
};

const styles = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    backgroundColor: COLOR.bg,
    padding:         28,
    fontSize:        9,
    color:           COLOR.textDark,
  },

  // ── Header ──
  header: {
    backgroundColor: COLOR.headerBg,
    borderRadius:    8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom:    14,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  headerLeft: { flex: 1 },
  instituteName: {
    fontSize:     16,
    fontFamily:   'Helvetica-Bold',
    color:        COLOR.white,
    letterSpacing: 0.5,
  },
  docTitle: {
    fontSize:  9,
    color:     COLOR.accent,
    marginTop: 3,
  },
  scanIdText: {
    fontSize: 7,
    color:    COLOR.accent,
    marginTop: 2,
    opacity:  0.7,
  },

  // ── Info grid ──
  infoRow: {
    flexDirection: 'row',
    gap:           8,
    marginBottom:  8,
  },
  infoBox: {
    flex:            1,
    backgroundColor: COLOR.white,
    borderRadius:    6,
    padding:         10,
    borderWidth:     1,
    borderColor:     COLOR.border,
  },
  infoLabel: { fontSize: 7, color: COLOR.textLight, marginBottom: 3 },
  infoValue: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLOR.textDark },

  // ── Score card ──
  scoreCard: {
    backgroundColor: COLOR.primary,
    borderRadius:    8,
    padding:         14,
    marginBottom:    10,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  scoreMainLabel:  { fontSize: 8,  color: COLOR.accent },
  scoreMainValue:  { fontSize: 28, fontFamily: 'Helvetica-Bold', color: COLOR.white },
  scoreDivider:    { width: 1, height: 40, backgroundColor: COLOR.accent, opacity: 0.3 },
  scoreSmallBlock: { alignItems: 'center' },
  scoreSmallLabel: { fontSize: 7,  color: COLOR.accent, marginBottom: 3 },
  scoreSmallValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: COLOR.white },

  // ── MCQ grid ──
  sectionTitle: {
    fontSize:    8,
    fontFamily:  'Helvetica-Bold',
    color:       COLOR.textMid,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mcqGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           3,
    marginBottom:  12,
  },
  mcqCell: {
    width:          48,
    borderRadius:   4,
    padding:        4,
    borderWidth:    1,
    alignItems:     'center',
  },
  mcqCellCorrect: { backgroundColor: '#ecfdf5', borderColor: '#6ee7b7' },
  mcqCellWrong:   { backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  mcqCellBlank:   { backgroundColor: COLOR.white, borderColor: COLOR.border },
  mcqQNum:        { fontSize: 6, color: COLOR.textLight, marginBottom: 1 },
  mcqAnswer:      { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  mcqAnswerCorrect: { color: COLOR.correct },
  mcqAnswerWrong:   { color: COLOR.wrong },
  mcqAnswerBlank:   { color: COLOR.blank },

  // ── Footer ──
  footer: {
    marginTop:     'auto',
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLOR.border,
    paddingTop:    10,
  },
  footerText:  { fontSize: 7, color: COLOR.textLight },
  footerBold:  { fontSize: 7, color: COLOR.textMid, fontFamily: 'Helvetica-Bold' },
  verifyUrl:   { fontSize: 6, color: COLOR.primary, marginTop: 2 },

  // ── Signature ──
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 6,
  },
  sigBox: { alignItems: 'center', width: 100 },
  sigLine: { width: 90, height: 1, backgroundColor: COLOR.border, marginBottom: 4 },
  sigLabel: { fontSize: 7, color: COLOR.textLight },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OMRMarksheetProps {
  instituteName:   string;
  studentName:     string;
  studentRoll:     string;
  studentReg:      string;
  studentClass:    string;
  examName:        string;
  examDate:        string;
  detectedSet:     string;
  totalScore:      number;
  maxScore:        number;
  percentage:      number;
  grade:           string;
  answers: Array<{
    questionNo:     number;
    selectedOption: string | null;
    correctOption:  string | null;
    isCorrect:      boolean | null;
    marksObtained:  number;
    status:         string;
  }>;
  scanId:          string;
  verificationUrl: string;
  scanDate:        string;
}

// ─── Document Component ───────────────────────────────────────────────────────

export function OMRMarksheetDocument(props: OMRMarksheetProps) {
  const {
    instituteName, studentName, studentRoll, studentReg, studentClass,
    examName, examDate, detectedSet, totalScore, maxScore, percentage,
    grade, answers, scanId, verificationUrl, scanDate,
  } = props;

  const correct = answers.filter((a) => a.isCorrect === true).length;
  const wrong   = answers.filter((a) => a.isCorrect === false && a.selectedOption).length;
  const blank   = answers.filter((a) => !a.selectedOption).length;

  return (
    <Document
      title={`OMR Marksheet — ${studentName} — ${examName}`}
      author={instituteName}
      creator="Rofaz Academy OMR Engine V2"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.instituteName}>{instituteName}</Text>
            <Text style={styles.docTitle}>OMR ANSWER SHEET — OFFICIAL RESULT</Text>
            <Text style={styles.scanIdText}>Scan ID: {scanId}</Text>
          </View>
          <Text style={{ color: COLOR.accent, fontSize: 20, fontFamily: 'Helvetica-Bold' }}>
            {grade}
          </Text>
        </View>

        {/* ── Student Info ── */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Student Name</Text>
            <Text style={styles.infoValue}>{studentName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Roll Number</Text>
            <Text style={styles.infoValue}>{studentRoll || '—'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Registration No.</Text>
            <Text style={styles.infoValue}>{studentReg || '—'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Class</Text>
            <Text style={styles.infoValue}>{studentClass || '—'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Exam Name</Text>
            <Text style={styles.infoValue}>{examName}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Date / Set</Text>
            <Text style={styles.infoValue}>{examDate}{detectedSet ? ` · Set ${detectedSet}` : ''}</Text>
          </View>
        </View>

        {/* ── Score Card ── */}
        <View style={styles.scoreCard}>
          <View>
            <Text style={styles.scoreMainLabel}>TOTAL MARKS</Text>
            <Text style={styles.scoreMainValue}>{totalScore.toFixed(2)}</Text>
            <Text style={{ color: COLOR.accent, fontSize: 8 }}>out of {maxScore}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreSmallBlock}>
            <Text style={styles.scoreSmallLabel}>PERCENTAGE</Text>
            <Text style={styles.scoreSmallValue}>{percentage.toFixed(1)}%</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreSmallBlock}>
            <Text style={styles.scoreSmallLabel}>CORRECT</Text>
            <Text style={{ ...styles.scoreSmallValue, color: '#6ee7b7' }}>{correct}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreSmallBlock}>
            <Text style={styles.scoreSmallLabel}>WRONG</Text>
            <Text style={{ ...styles.scoreSmallValue, color: '#fca5a5' }}>{wrong}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreSmallBlock}>
            <Text style={styles.scoreSmallLabel}>BLANK</Text>
            <Text style={{ ...styles.scoreSmallValue, color: '#9ca3af' }}>{blank}</Text>
          </View>
        </View>

        {/* ── MCQ Grid ── */}
        <Text style={styles.sectionTitle}>Question-wise Result</Text>
        <View style={styles.mcqGrid}>
          {answers.map((ans) => {
            const isCorrect = ans.isCorrect === true;
            const isWrong   = !ans.selectedOption ? false : ans.isCorrect === false;
            const isBlank   = !ans.selectedOption;

            return (
              <View
                key={ans.questionNo}
                style={[
                  styles.mcqCell,
                  isCorrect ? styles.mcqCellCorrect : isWrong ? styles.mcqCellWrong : styles.mcqCellBlank,
                ]}
              >
                <Text style={styles.mcqQNum}>Q{ans.questionNo}</Text>
                <Text style={[
                  styles.mcqAnswer,
                  isCorrect ? styles.mcqAnswerCorrect : isWrong ? styles.mcqAnswerWrong : styles.mcqAnswerBlank,
                ]}>
                  {isBlank ? '—' : ans.selectedOption || '—'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Signatures ── */}
        <View style={styles.sigRow}>
          {['Student Signature', 'Invigilator Signature', "Principal's Signature"].map((label) => (
            <View key={label} style={styles.sigBox}>
              <View style={styles.sigLine} />
              <Text style={styles.sigLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerBold}>Rofaz Academy — OMR Engine V2</Text>
            <Text style={styles.footerText}>Scanned on {scanDate} · This is an official computer-generated marksheet.</Text>
            <Text style={styles.verifyUrl}>Verify online: {verificationUrl}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.footerText}>Generated by Rofaz Academy OMR Intelligence</Text>
            <Text style={styles.footerText}>rofazacademy.dev</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
