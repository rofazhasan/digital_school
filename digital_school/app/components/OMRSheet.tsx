// World Class OMR Redesign
// - Bigger Bubbles (24px)
// - Maximum Page Utilization
// - Crystal Clear Spacing

import React from "react";
import QRCode from "react-qr-code";
import { toBengaliNumerals } from "@/utils/numeralConverter";

interface OMRSheetProps {
  questions: {
    mcq: { q: string; options: string[] }[];
    mc?: { q: string; options: string[] }[];
    int?: { q: string }[];
    ar?: any[];
    cq?: any[];
    sq?: any[];
    mtf?: any[];
  };
  qrData: any;
  rollDigits?: number;
  bubbleSize?: number;
  fontFamily?: string;
  extraFields?: Array<{ label: string; width?: number }>;
  mcqOptionLabels?: string[];
  mcqOptionsCount?: number;
  setName?: string;
  logoUrl?: string;
  instituteName?: string;
  examTitle?: string;
  examDate?: string;
  subjectName?: string;
  uniqueCode?: string;
}

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
const DIGITS = Array.from({ length: 10 }, (_, i) => i);

const OMRSheet: React.FC<OMRSheetProps> = ({
  questions,
  qrData,
  rollDigits = 6,
  bubbleSize = 24, // Increased default
  fontFamily = 'Noto Serif Bengali, serif',
  extraFields = [],
  mcqOptionLabels = MCQ_LABELS,
  mcqOptionsCount = 4,
  setName,
  logoUrl,
  instituteName = 'শিক্ষা প্রতিষ্ঠান',
  examTitle = 'পরীক্ষার নাম',
  examDate = 'তারিখ',
  subjectName = 'বিষয়',
  uniqueCode,
}) => {
  const totalQuestions = 100;
  // Large, easy-to-mark bubbles
  const answerBubbleSize = 22;

  // Render a single vertical digit column
  const verticalField = (label: string, digits: number, size = 20) => (
    <div className="flex flex-col items-center mx-1">
      <div className="text-[10px] font-black mb-1.5 uppercase tracking-tighter">{label}</div>
      {/* Box for hand-written entry */}
      <div className="flex flex-row gap-1 mb-1.5">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="border-2 border-black bg-white flex items-center justify-center font-black" style={{ width: size, height: size + 6, fontSize: size * 0.8 }}></div>
        ))}
      </div>
      {/* Digits Grid */}
      <div className="flex flex-row gap-1 p-1 bg-white border-2 border-black rounded-md">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            {DIGITS.map((d) => (
              <div
                key={d}
                className="rounded-full border border-black flex items-center justify-center text-[10px] font-black hover:bg-black hover:text-white transition-colors"
                style={{ width: size - 4, height: size - 4 }}
              >{toBengaliNumerals(d)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Render a single column of 25 questions
  const renderMCQColumn = (startIdx: number, endIdx: number) => (
    <div className="flex flex-col w-full h-full">
      {/* Column Header */}
      <div className="flex justify-between items-center bg-black text-white px-1 py-0.5 mb-1 rounded-sm">
        <div className="text-[10px] font-black w-6 text-center">NO</div>
        <div className="flex-1 flex justify-around">
          {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, i) => (
            <div key={i} className="text-[10px] font-black w-5 text-center">{l}</div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 flex flex-col justify-between">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map((idx) => (
          <div key={idx} className="flex items-center justify-between py-[1px] hover:bg-gray-50 rounded-sm">
            <div className="text-[12px] font-black w-6 text-center leading-none border-r-2 border-black/10 mr-1">
              {toBengaliNumerals(idx + 1)}
            </div>
            <div className={`flex-1 flex justify-around ${mcqOptionsCount === 5 ? 'gap-0.5' : 'gap-1'}`}>
              {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, oidx) => (
                <div
                  key={oidx}
                  className="rounded-full border-[1.5px] border-black flex items-center justify-center bg-white text-[10px] font-bold"
                  style={{ width: answerBubbleSize, height: answerBubbleSize }}
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render MC (Multiple Correct) questions - each question has checkboxes for all options
  const renderMCColumn = (startIdx: number, endIdx: number, mcQuestions: { q: string; options: string[] }[]) => (
    <table className="w-full text-center border-collapse table-fixed">
      <thead>
        <tr className="bg-gray-800 text-white font-black text-[10px]">
          <th className="py-0.5 w-8">প্রশ্ন</th>
          {mcqOptionLabels.slice(0, 5).map((l, i) => (
            <th key={i} className="py-0.5">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= mcQuestions.length) return null;
          return (
            <tr key={idx} className="hover:bg-gray-100">
              <td className="text-[11px] font-black py-[1px] border-r border-black/20 leading-none">{toBengaliNumerals(idx + 1)}</td>
              {mcqOptionLabels.slice(0, 5).map((l, oidx) => (
                <td key={oidx} className="py-[0px]">
                  <div
                    className="w-[15px] h-[15px] border-[1.5px] border-black rounded-sm flex items-center justify-center mx-auto bg-white"
                    aria-label={`MC ${idx + 1} option ${l}`}
                  ></div>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Render AR (Assertion-Reason) - usually 5 options
  const renderARColumn = (startIdx: number, endIdx: number, arQuestions: any[]) => {
    const labels = ['1', '2', '3', '4', '5']; // Kept as Arabic numerals for AR usually, but can change if requested
    const bengaliLabels = ['১', '২', '৩', '৪', '৫'];
    return (
      <table className="w-full text-center border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-800 text-white font-black text-[10px]">
            <th className="py-0.5 w-8">প্রশ্ন</th>
            {bengaliLabels.map((l, i) => (
              <th key={i} className="py-0.5">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
            if (idx >= arQuestions.length) return null;
            return (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="text-[11px] font-black py-[1px] border-r border-black/20 leading-none">{toBengaliNumerals(idx + 1)}</td>
                {bengaliLabels.map((l, oidx) => (
                  <td key={oidx} className="py-[0px]">
                    <div
                      className="w-[15px] h-[15px] border-[1.5px] border-black rounded-full flex items-center justify-center mx-auto bg-white text-[8px] font-black pb-[1px]"
                    >{l}</div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  // Render MTF (Match the Following) Grid
  const renderMTFSection = (mtfQuestions: any[]) => (
    <div className="mt-2 space-y-2">
      {mtfQuestions.map((q, qIndex) => (
        <div key={qIndex} className="border border-black p-1 rounded relative bg-white overflow-hidden">
          <div className="text-[9px] font-black uppercase mb-1 border-b border-black pb-0.5 flex justify-between items-center bg-gray-100 -mx-1 px-1">
            <span>MTF প্রশ্ন {toBengaliNumerals(qIndex + 1)}</span>
            <span className="opacity-50 text-[6px]">MATRIX</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-black/30 text-[8px] w-6">#</th>
                {q.rightColumn.map((rc: any) => (
                  <th key={rc.id} className="border-b border-black/30 text-[10px] font-black">{rc.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.leftColumn.map((lc: any) => (
                <tr key={lc.id}>
                  <td className="border-b border-black/10 text-[10px] font-black py-[1px]">{lc.id}</td>
                  {q.rightColumn.map((rc: any) => (
                    <td key={rc.id} className="border-b border-black/10 py-[1px] text-center">
                      <div className="w-3 h-3 rounded-full border border-black mx-auto hover:bg-black transition-colors duration-200"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  // Render INT (Integer) Column
  const renderINTColumn = (startIdx: number, endIdx: number, intQuestions: any[]) => (
    <table className="w-full text-center border-collapse table-fixed">
      <thead>
        <tr className="bg-gray-800 text-white font-black text-[10px]">
          <th className="py-0.5 w-8">প্রশ্ন</th>
          <th className="py-0.5">উত্তর (পূর্ণসংখ্যা)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= intQuestions.length) return null;
          return (
            <tr key={idx} className="hover:bg-gray-100">
              <td className="text-[11px] font-black py-[1px] border-r border-black/20 leading-none">{toBengaliNumerals(idx + 1)}</td>
              <td className="py-[1px] flex justify-center gap-1">
                {[1, 2, 3].map(pos => (
                  <div key={pos} className="flex flex-col gap-[1px] bg-gray-100 p-[1px] border border-black rounded-[2px]">
                    <div className="w-full h-2.5 bg-white border border-black flex items-center justify-center text-[7px] font-black mb-[1px]">▢</div>
                    <div className="grid grid-cols-2 gap-[1px]">
                      {DIGITS.map(d => (
                        <div key={d} className="w-2.5 h-2.5 border-[0.5px] border-black rounded-full text-[6px] font-black flex items-center justify-center bg-white pb-[1px]">{toBengaliNumerals(d)}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="w-full h-full flex flex-col p-8 bg-white relative print:m-0 print:p-0"
      style={{
        fontFamily,
        width: '8.27in',
        height: '11.69in',
        maxWidth: '8.27in',
        maxHeight: '11.69in',
        boxSizing: 'border-box',
        border: 'none',   // Print CSS handles margins usually, but we want clean edges
        position: 'relative'
      }}>

      {/* --- CORNER MARKERS (Standard OMR) --- */}
      <div className="absolute top-6 left-6 w-8 h-2 bg-black"></div>
      <div className="absolute top-6 left-6 w-2 h-8 bg-black"></div>

      <div className="absolute top-6 right-6 w-8 h-2 bg-black"></div>
      <div className="absolute top-6 right-6 w-2 h-8 bg-black"></div>

      <div className="absolute bottom-6 left-6 w-8 h-2 bg-black"></div>
      <div className="absolute bottom-6 left-6 w-2 h-8 bg-black"></div>

      <div className="absolute bottom-6 right-6 w-8 h-2 bg-black"></div>
      <div className="absolute bottom-6 right-6 w-2 h-8 bg-black"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="flex flex-col h-full mx-6 my-4 border-[3px] border-black rounded-lg overflow-hidden">

        {/* HEADER */}
        <header className="flex flex-row justify-between items-center p-4 border-b-[3px] border-black bg-gray-50">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
            ) : (
              <div className="h-16 w-16 border-2 border-black rounded-full flex items-center justify-center bg-white font-black text-2xl">DS</div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl font-black uppercase tracking-wide leading-none mb-1">{instituteName}</h1>
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">OMR ANSWER SHEET</h2>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl font-black uppercase">{examTitle}</div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-black text-white font-bold text-xs rounded uppercase">{subjectName}</span>
              <span className="px-3 py-1 border-2 border-black font-bold text-xs rounded uppercase">{toBengaliNumerals(examDate)}</span>
            </div>
          </div>
        </header>

        {/* Main Container - Adjusted Spacing */}
        <div className="flex-1 flex flex-row items-stretch mx-10 my-4 gap-4 overflow-visible">

          {/* Left Section: Answer Grid - OPTIMIZED SPACING - Tight grid */}
          <div className="flex-[3] flex flex-col gap-2">
            {/* Main 100 Q Grid - Tighter gaps */}
            <div className="grid grid-cols-4 gap-x-1 gap-y-0 border-4 border-double border-black p-1 bg-white rounded-lg shadow-sm h-full">
              <div className="border-r-2 border-black pr-1 h-full">
                {renderMCQColumn(0, 25)}
              </div>
              <div className="border-r-2 border-black pr-1 h-full">
                {renderMCQColumn(25, 50)}
              </div>
              <div className="border-r-2 border-black pr-1 h-full">
                {renderMCQColumn(50, 75)}
              </div>
              <div className="pl-0 h-full">
                {renderMCQColumn(75, 100)}
              </div>
            </div>

            {/* Special Type Questions */}
            <div className="grid grid-cols-3 gap-2">
              {questions.mc && questions.mc.length > 0 && (
                <div className="border-2 border-black p-1 rounded bg-gray-50">
                  <div className="text-[9px] font-black uppercase mb-1 border-b border-black px-1">Multiple Correct (MC)</div>
                  {renderMCColumn(0, 10, questions.mc)}
                </div>
              )}
              {questions.ar && questions.ar.length > 0 && (
                <div className="border-2 border-black p-1 rounded bg-gray-50">
                  <div className="text-[9px] font-black uppercase mb-1 border-b border-black px-1">Assertion-Reason (AR)</div>
                  {renderARColumn(0, 10, questions.ar)}
                </div>
              )}
              {questions.int && questions.int.length > 0 && (
                <div className="border-2 border-black p-1 rounded bg-gray-50">
                  <div className="text-[9px] font-black uppercase mb-1 border-b border-black px-1">Integer Type (INT)</div>
                  {renderINTColumn(0, 10, questions.int)}
                </div>
              )}
            </div>

            {questions.mtf && questions.mtf.length > 0 && (
              <div className="border-2 border-black p-2 rounded bg-white">
                <div className="text-[9px] font-black uppercase mb-1 border-b border-black">Match The Following (MTF)</div>
                {renderMTFSection(questions.mtf)}
              </div>
            )}
          </div>

          {/* Right Section: Student Data - FIXED VISIBILITY */}
          <div className="flex-[1.2] min-w-[220px] flex flex-col gap-4 border-4 border-double border-black bg-gray-50 p-3 rounded-lg relative overflow-visible shadow-sm">
            {/* Subtle Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-45 overflow-hidden">
              <span className="text-3xl font-black">CONFIDENTIAL</span>
            </div>

            <div className="flex flex-col items-center pt-2 w-full">
              {verticalField('রোল নম্বর', rollDigits, 22)} {/* Reverted to original verticalField call, assuming the new one was a typo or not fully provided */}
            </div>

            <div className="w-full border-t-2 border-black border-dashed opacity-50"></div>

            <div className="flex flex-row justify-center gap-4 items-start w-full">
              <div className="flex flex-col items-center">
                <div className="text-[10px] font-black mb-1 uppercase tracking-wider">SET CODE</div>
                <div className="p-1 border-2 border-black bg-white rounded flex flex-col items-center gap-1 shadow-sm">
                  <div className="w-8 h-8 border-2 border-black mb-1 bg-black text-white flex items-center justify-center text-[14px] font-black rounded">{setName || 'A'}</div>
                  {mcqOptionLabels.slice(0, 4).map((l) => (
                    <div key={l} className={`w-5 h-5 border border-black rounded-full flex items-center justify-center text-[10px] font-black transition-colors duration-200 pb-[1px] ${setName === l ? 'bg-black text-white' : 'bg-white hover:bg-black hover:text-white'}`}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="bg-white p-1 border-2 border-black rounded shadow-sm">
                  <QRCode value={JSON.stringify(qrData)} size={80} />
                </div>
                <span className="text-[8px] font-mono mt-1 opacity-50 uppercase tracking-widest">Secured QR</span>
              </div>
            </div>

            <div className="w-full border-t-2 border-black border-dashed opacity-50"></div>

            <div className="flex flex-col items-center w-full">
              {verticalField('বিষয় কোড', 3, 22)} {/* Reverted to original verticalField call */}
            </div>

            <div className="mt-auto space-y-4 w-full">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Student's Signature / শিক্ষার্থীর স্বাক্ষর</span>
                <div className="h-10 border-b-2 border-black border-dashed bg-white"></div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Invigilator's Signature / পরিদর্শকের স্বাক্ষর</span>
                <div className="h-10 border-b-2 border-black border-dashed bg-white"></div>
              </div>
            </div>

            {/* Instructions Block */}
            <div className="mt-4 p-2 border-2 border-black bg-white text-[8px] leading-tight rounded shadow-sm">
              <div className="font-black text-center mb-1 border-b border-black pb-0.5 tracking-wider">INSTRUCTIONS</div>
              <ul className="space-y-1 font-bold">
                <li className="flex items-start gap-1">
                  <span className="text-black">•</span>
                  <span>Use Black Ballpoint Pen only.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-black">•</span>
                  <span>Fill the bubble completely: ⬤</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-black">•</span>
                  <span>Do not fold or crush this sheet.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* --- TIMING TRACKS (Bottom) --- */}
      <div className="absolute bottom-1 left-0 right-0 h-4 flex justify-between px-16 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1.5 h-full bg-black"></div>
        ))}
      </div>

    </div>
  );
};

export default OMRSheet;