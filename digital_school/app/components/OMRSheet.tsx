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

        {/* BODY */}
        <div className="flex-1 flex flex-row">

          {/* LEFT: 100 Questions Grid */}
          <div className="flex-[3] flex flex-row p-3 gap-3 border-r-[3px] border-black">
            <div className="flex-1">{renderMCQColumn(0, 25)}</div>
            <div className="w-[2px] bg-black/20 my-2"></div>
            <div className="flex-1">{renderMCQColumn(25, 50)}</div>
            <div className="w-[2px] bg-black/20 my-2"></div>
            <div className="flex-1">{renderMCQColumn(50, 75)}</div>
            <div className="w-[2px] bg-black/20 my-2"></div>
            <div className="flex-1">{renderMCQColumn(75, 100)}</div>
          </div>

          {/* RIGHT: Student Info Sidebar */}
          <div className="flex-[1.2] flex flex-col bg-gray-100/50 p-4 gap-6 items-center border-l border-white">

            {/* Set & ID Block */}
            <div className="w-full flex flex-col gap-4 bg-white p-3 rounded-lg border-2 border-black shadow-sm">
              <div className="flex flex-col items-center">
                <span className="text-xs font-black uppercase mb-1">Set Code</span>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 border-2 border-black flex items-center justify-center text-lg font-black bg-gray-50 shadow-inner rounded">{setName || 'A'}</div>
                  <div className="flex gap-1">
                    {mcqOptionLabels.slice(0, 4).map(l => (
                      <div key={l} className={`w-6 h-6 rounded-full border border-black flex items-center justify-center text-xs font-bold ${l === setName ? 'bg-black text-white' : 'bg-white'}`}>{l}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full h-[1px] bg-black/20"></div>

              <div className="flex flex-col items-center">
                <span className="text-xs font-black uppercase mb-1">Student ID</span>
                <div className="bg-white p-1 border border-black rounded shadow-sm">
                  <QRCode value={JSON.stringify(qrData)} size={90} /> /* Bigger QR */
                </div>
                {uniqueCode && <span className="text-[9px] font-mono mt-1 text-gray-500">{uniqueCode.slice(0, 8)}</span>}
              </div>
            </div>

            {/* Roll Number Block */}
            <div className="bg-white p-3 rounded-lg border-2 border-black shadow-sm w-full flex justify-center">
              {verticalField('ROLL NUMBER', rollDigits, 22)}
            </div>

            {/* Additional Fields / Signatures */}
            <div className="mt-auto w-full flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500">Student Signature</span>
                <div className="h-10 border-b-2 border-black bg-white"></div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase text-gray-500">Invigilator Signature</span>
                <div className="h-10 border-b-2 border-black bg-white"></div>
              </div>
            </div>

            {/* Instructions Footer */}
            <div className="text-[9px] text-center text-gray-500 leading-tight">
              <p>• Use Black Ballpoint Pen only.</p>
              <p>• Completely darken the bubble: ⬤</p>
              <p>• Do not fold this sheet.</p>
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