"use client";

import React, { useMemo, useState } from 'react';
import { X, Printer, Award, FileSpreadsheet, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import type { StudentScoreCard } from '@/lib/omr/types';
import { toBengaliNumerals } from '@/utils/numeralConverter';

interface MeritListModalProps {
  open: boolean;
  onClose: () => void;
  scoreCards: StudentScoreCard[];
  examTitle: string;
  instituteName?: string;
  passThresholdPct?: number;
}

function getBangladeshGrade(pct: number): { letter: string; gpa: number; passed: boolean } {
  if (pct >= 80) return { letter: 'A+', gpa: 5.0, passed: true };
  if (pct >= 70) return { letter: 'A', gpa: 4.0, passed: true };
  if (pct >= 60) return { letter: 'A-', gpa: 3.5, passed: true };
  if (pct >= 50) return { letter: 'B', gpa: 3.0, passed: true };
  if (pct >= 40) return { letter: 'C', gpa: 2.0, passed: true };
  if (pct >= 33) return { letter: 'D', gpa: 1.0, passed: true };
  return { letter: 'F', gpa: 0.0, passed: false };
}

export function MeritListModal({
  open,
  onClose,
  scoreCards,
  examTitle,
  instituteName = 'ডিজিটাল স্কুল ওএমআর মূল্যায়ন বোর্ড',
  passThresholdPct = 33,
}: MeritListModalProps) {
  const [exportingXlsx, setExportingXlsx] = useState(false);

  const rankedRows = useMemo(() => {
    const sorted = [...scoreCards].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
      return a.incorrectCount - b.incorrectCount;
    });

    let lastScore: number | null = null;
    let currentRank = 0;
    return sorted.map((card, idx) => {
      if (lastScore === null || card.totalScore !== lastScore) {
        currentRank = idx + 1;
        lastScore = card.totalScore;
      }
      const grade = getBangladeshGrade(card.percentage);
      const passed = card.percentage >= passThresholdPct;
      return {
        rank: currentRank,
        card,
        grade: passed ? grade.letter : 'F',
        gpa: passed ? grade.gpa : 0.0,
        passed,
      };
    });
  }, [scoreCards, passThresholdPct]);

  const stats = useMemo(() => {
    if (rankedRows.length === 0) {
      return { total: 0, passed: 0, failed: 0, passRate: 0, highest: 0, average: 0, aPlus: 0 };
    }
    const passed = rankedRows.filter((r) => r.passed).length;
    const aPlus = rankedRows.filter((r) => r.grade === 'A+').length;
    const sum = rankedRows.reduce((acc, r) => acc + r.card.totalScore, 0);
    return {
      total: rankedRows.length,
      passed,
      failed: rankedRows.length - passed,
      passRate: (passed / rankedRows.length) * 100,
      highest: rankedRows[0]?.card.totalScore || 0,
      average: sum / rankedRows.length,
      aPlus,
    };
  }, [rankedRows]);

  if (!open) return null;

  const handlePrintMeritList = () => {
    const printEl = document.getElementById('omr-merit-list-print-root');
    if (!printEl) return;
    const win = window.open('', '_blank', 'width=960,height=1120');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Merit List — ${examTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: system-ui, -apple-system, 'Hind Siliguri', sans-serif; color: #0f172a; margin: 0; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .header h1 { margin: 0; font-size: 18px; }
            .header p { margin: 3px 0 0; font-size: 12px; color: #475569; }
            .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
            .stat { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; text-align: center; }
            .stat .lbl { font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 700; }
            .stat .val { font-size: 14px; font-weight: 800; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { background: #0f172a; color: #fff; padding: 6px; text-align: left; font-weight: 700; }
            td { border-bottom: 1px solid #e2e8f0; padding: 5px 6px; }
            tr:nth-child(even) { background: #f8fafc; }
            .pass { color: #047857; font-weight: 700; }
            .fail { color: #be123c; font-weight: 700; }
            .num { text-align: right; font-variant-numeric: tabular-nums; }
            .center { text-align: center; }
            .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #475569; }
            .sig { border-top: 1px solid #64748b; padding-top: 4px; width: 180px; text-align: center; }
          </style>
        </head>
        <body>
          ${printEl.innerHTML}
        </body>
      </html>`);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 250);
  };

  const handleExportStyledExcel = async () => {
    setExportingXlsx(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Digital School OMR v3';
      wb.created = new Date();

      // Sheet 1: Official Merit List
      const ws = wb.addWorksheet('Merit List', { views: [{ state: 'frozen', ySplit: 4 }] });
      ws.mergeCells('A1:L1');
      ws.getCell('A1').value = `${instituteName} — মেধা তালিকা (Merit List)`;
      ws.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF0F172A' } };
      ws.getCell('A1').alignment = { horizontal: 'center' };

      ws.mergeCells('A2:L2');
      ws.getCell('A2').value = `Exam: ${examTitle} | Total: ${stats.total} | Passed: ${stats.passed} (${stats.passRate.toFixed(1)}%) | Highest: ${stats.highest.toFixed(2)} | Avg: ${stats.average.toFixed(2)}`;
      ws.getCell('A2').font = { size: 10, color: { argb: 'FF475569' } };
      ws.getCell('A2').alignment = { horizontal: 'center' };

      const headers = [
        'Merit Rank',
        'Roll Number',
        'Registration No',
        'Student Name',
        'Set',
        'Correct',
        'Wrong',
        'Blank',
        'Obtained Score',
        'Max Score',
        'Percentage (%)',
        'Grade / GPA',
        'Status',
      ];
      const headerRow = ws.getRow(4);
      headerRow.values = headers;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 24;

      rankedRows.forEach((row) => {
        const r = ws.addRow([
          row.rank,
          row.card.rollNumber,
          row.card.registrationNo || '',
          row.card.studentName || '',
          row.card.examSet || 'A',
          row.card.correctCount,
          row.card.incorrectCount,
          row.card.unmarkedCount,
          Number(row.card.totalScore.toFixed(2)),
          row.card.maxScore,
          Number(row.card.percentage.toFixed(2)),
          `${row.grade} (${row.gpa.toFixed(2)})`,
          row.passed ? 'PASS' : 'FAIL',
        ]);
        const statusCell = r.getCell(13);
        statusCell.font = { bold: true, color: { argb: row.passed ? 'FF047857' : 'FFBE123C' } };
        if (!row.passed) {
          r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
        } else if (row.rank <= 3) {
          r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
        }
      });

      ws.columns = [
        { width: 12 },
        { width: 15 },
        { width: 18 },
        { width: 24 },
        { width: 8 },
        { width: 10 },
        { width: 10 },
        { width: 10 },
        { width: 15 },
        { width: 11 },
        { width: 15 },
        { width: 14 },
        { width: 10 },
      ];

      // Sheet 2: Item-by-Item Question Matrix
      const allQKeys = Array.from(
        new Set(rankedRows.flatMap((r) => Object.keys(r.card.questionVerdicts || {})))
      ).sort((a, b) => parseInt(a.replace(/\D/g, '') || '0', 10) - parseInt(b.replace(/\D/g, '') || '0', 10));

      if (allQKeys.length > 0) {
        const ws2 = wb.addWorksheet('Question Matrix', { views: [{ state: 'frozen', xSplit: 3, ySplit: 1 }] });
        const qHeaders = ['Rank', 'Roll', 'Set', ...allQKeys.map((q) => q.toUpperCase())];
        const qHeaderRow = ws2.addRow(qHeaders);
        qHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        qHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };

        rankedRows.forEach((row) => {
          const vals = [
            row.rank,
            row.card.rollNumber,
            row.card.examSet || 'A',
            ...allQKeys.map((q) => {
              const v = row.card.questionVerdicts?.[q];
              if (!v || !v.studentAnswer) return '-';
              return v.verdict === 'correct' ? `${v.studentAnswer} ✓` : `${v.studentAnswer} ✗`;
            }),
          ];
          ws2.addRow(vals);
        });
      }

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Merit_List_${examTitle.replace(/[^a-zA-Z0-9\u0980-\u09FF_-]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Excel এক্সপোর্ট করতে সমস্যা হয়েছে।');
    } finally {
      setExportingXlsx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">অফিশিয়াল মেধা তালিকা (Class Merit List)</h3>
              <p className="text-[11px] text-slate-400">
                {examTitle} • মোট {toBengaliNumerals(stats.total)} জন পরীক্ষার্থী
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportStyledExcel}
              disabled={exportingXlsx || rankedRows.length === 0}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {exportingXlsx ? 'তৈরি হচ্ছে...' : 'Excel (.xlsx)'}
            </button>
            <button
              type="button"
              onClick={handlePrintMeritList}
              disabled={rankedRows.length === 0}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> প্রিন্ট / PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable White A4 Preview Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950">
          <div id="omr-merit-list-print-root" className="bg-white text-slate-900 rounded-xl p-6 shadow-xl max-w-[820px] mx-auto">
            <div className="header text-center border-b-2 border-slate-900 pb-3 mb-4">
              <h1 className="text-lg font-extrabold text-slate-900">{instituteName}</h1>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                মেধা তালিকা (Official Merit List) — {examTitle}
              </p>
            </div>

            {/* Summary KPI Strip */}
            <div className="stats grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="stat border border-slate-200 rounded-lg p-2 text-center">
                <div className="lbl text-[10px] font-bold text-slate-500 uppercase">মোট পরীক্ষার্থী</div>
                <div className="val text-base font-extrabold text-slate-900">{toBengaliNumerals(stats.total)}</div>
              </div>
              <div className="stat border border-emerald-200 bg-emerald-50 rounded-lg p-2 text-center">
                <div className="lbl text-[10px] font-bold text-emerald-700 uppercase">পাসের হার</div>
                <div className="val text-base font-extrabold text-emerald-700">{stats.passRate.toFixed(1)}%</div>
              </div>
              <div className="stat border border-indigo-200 bg-indigo-50 rounded-lg p-2 text-center">
                <div className="lbl text-[10px] font-bold text-indigo-700 uppercase">সর্বোচ্চ নম্বর</div>
                <div className="val text-base font-extrabold text-indigo-700">{stats.highest.toFixed(2)}</div>
              </div>
              <div className="stat border border-slate-200 rounded-lg p-2 text-center">
                <div className="lbl text-[10px] font-bold text-slate-500 uppercase">গড় নম্বর</div>
                <div className="val text-base font-extrabold text-slate-800">{stats.average.toFixed(2)}</div>
              </div>
              <div className="stat border border-amber-200 bg-amber-50 rounded-lg p-2 text-center">
                <div className="lbl text-[10px] font-bold text-amber-700 uppercase">A+ প্রাপ্ত</div>
                <div className="val text-base font-extrabold text-amber-700">{toBengaliNumerals(stats.aPlus)}</div>
              </div>
            </div>

            {/* Ranked Table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-2 text-center">মেধাক্রম</th>
                  <th className="p-2 text-left">রোল নম্বর</th>
                  <th className="p-2 text-left">নাম</th>
                  <th className="p-2 text-center">সেট</th>
                  <th className="p-2 text-right">সঠিক</th>
                  <th className="p-2 text-right">ভুল</th>
                  <th className="p-2 text-right">প্রাপ্ত নম্বর</th>
                  <th className="p-2 text-right">শতকরা</th>
                  <th className="p-2 text-center">গ্রেড (GPA)</th>
                  <th className="p-2 text-center">ফলাফল</th>
                </tr>
              </thead>
              <tbody>
                {rankedRows.map((row) => (
                  <tr
                    key={row.card.sheetId}
                    className={`border-b border-slate-200 ${
                      !row.passed ? 'bg-rose-50/70' : row.rank <= 3 ? 'bg-emerald-50/70' : 'even:bg-slate-50'
                    }`}
                  >
                    <td className="p-2 text-center font-extrabold">
                      {row.rank <= 3 ? (
                        <span className="inline-flex items-center gap-0.5 text-amber-700">
                          <Award className="w-3.5 h-3.5" /> #{row.rank}
                        </span>
                      ) : (
                        `#${row.rank}`
                      )}
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-900">{row.card.rollNumber}</td>
                    <td className="p-2 text-slate-700">{row.card.studentName || '—'}</td>
                    <td className="p-2 text-center font-bold">{row.card.examSet || 'A'}</td>
                    <td className="p-2 text-right text-emerald-700 font-semibold">{row.card.correctCount}</td>
                    <td className="p-2 text-right text-rose-700 font-semibold">{row.card.incorrectCount}</td>
                    <td className="p-2 text-right font-extrabold text-slate-900">
                      {row.card.totalScore.toFixed(2)} / {row.card.maxScore}
                    </td>
                    <td className="p-2 text-right font-semibold">{row.card.percentage.toFixed(1)}%</td>
                    <td className="p-2 text-center font-bold">
                      {row.grade} ({row.gpa.toFixed(2)})
                    </td>
                    <td className="p-2 text-center">
                      {row.passed ? (
                        <span className="pass inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="fail inline-flex items-center gap-0.5 text-rose-700 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="footer mt-8 flex items-center justify-between text-[11px] text-slate-500">
              <div>প্রকাশের তারিখ: {new Date().toLocaleDateString('bn-BD')}</div>
              <div className="sig border-t border-slate-400 pt-1 w-44 text-center">পরীক্ষা নিয়ন্ত্রকের স্বাক্ষর</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
