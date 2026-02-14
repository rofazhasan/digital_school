// Legal Paper OMR Layout (Top-Down)
// Legal Paper OMR Layout (Top-Down)
// - Full Width Question Grid
// - Horizontal Student Info Band
// - Optimized for Legal/A4 Vertical Space

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
  bubbleSize = 24, // Restored to 24px (Large)
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
  // Large bubbles enabled by full width
  const answerBubbleSize = 22;

  // Render a vertical digit column (for horizontal arrangement)
  const verticalField = (label: string, digits: number, size = 20) => (
    <div className="flex flex-col items-center mx-2">
      <div className="text-[10px] font-bold mb-1 uppercase tracking-wider">{label}</div>
      <div className="flex flex-row gap-1 mb-1">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="border border-black bg-white flex items-center justify-center font-bold" style={{ width: size, height: size + 6, fontSize: size * 0.7 }}></div>
        ))}
      </div>
      <div className="flex flex-row gap-1 p-1 bg-white border border-black rounded-sm">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            {DIGITS.map((d) => (
              <div
                key={d}
                className="rounded-full border border-black flex items-center justify-center text-[10px] font-bold hover:bg-black hover:text-white transition-colors"
                style={{ width: size - 2, height: size - 2 }}
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
      <div className="flex justify-between items-center border-b border-black bg-black text-white px-2 py-1 mb-1 rounded-t-sm">
        <div className="text-[10px] font-bold w-6 text-center">NO</div>
        <div className="flex-1 flex justify-around">
          {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, i) => (
            <div key={i} className="text-[10px] font-bold w-5 text-center">{l}</div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 flex flex-col justify-between">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map((idx) => (
          <div key={idx} className={`flex items - center justify - between py - [1px] hover: bg - gray - 50 ${idx % 5 === 4 ? 'border-b border-black/10' : ''} `}>
            <div className="text-[12px] font-bold w-6 text-center leading-none border-r border-black/20 mr-1">
              {toBengaliNumerals(idx + 1)}
            </div>
            <div className={`flex - 1 flex justify - around ${mcqOptionsCount === 5 ? 'gap-0.5' : 'gap-1'} `}>
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

  // Render MC (Multiple Correct) questions
  const renderMCColumn = (startIdx: number, endIdx: number, mcQuestions: { q: string; options: string[] }[]) => (
    <table className="w-full text-center border-collapse table-fixed">
      <thead>
        <tr className="bg-gray-100 border-b border-black text-[9px]">
          <th className="py-0.5 w-8 border-r border-black/20">NO</th>
          {mcqOptionLabels.slice(0, 5).map((l, i) => (
            <th key={i} className="py-0.5">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= mcQuestions.length) return null;
          return (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="text-[11px] font-bold py-[1px] border-r border-black/20">{toBengaliNumerals(idx + 1)}</td>
              {mcqOptionLabels.slice(0, 5).map((l, oidx) => (
                <td key={oidx} className="py-[0px]">
                  <div
                    className="w-[16px] h-[16px] border border-black rounded-sm flex items-center justify-center mx-auto bg-white"
                    aria-label={`MC ${idx + 1} option ${l} `}
                  ></div>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Render AR (Assertion-Reason)
  const renderARColumn = (startIdx: number, endIdx: number, arQuestions: any[]) => {
    const bengaliLabels = ['১', '২', '৩', '৪', '৫'];
    return (
      <table className="w-full text-center border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100 border-b border-black text-[9px]">
            <th className="py-0.5 w-8 border-r border-black/20">NO</th>
            {bengaliLabels.map((l, i) => (
              <th key={i} className="py-0.5">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
            if (idx >= arQuestions.length) return null;
            return (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="text-[11px] font-bold py-[1px] border-r border-black/20">{toBengaliNumerals(idx + 1)}</td>
                {bengaliLabels.map((l, oidx) => (
                  <td key={oidx} className="py-[0px]">
                    <div
                      className="w-[16px] h-[16px] border border-black rounded-full flex items-center justify-center mx-auto bg-white text-[9px] font-medium pb-[1px]"
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

  // Render MTF (Match the Following)
  const renderMTFSection = (mtfQuestions: any[]) => (
    <div className="mt-2 space-y-2">
      {mtfQuestions.map((q, qIndex) => (
        <div key={qIndex} className="border border-black p-1 rounded-sm relative bg-white overflow-hidden">
          <div className="text-[9px] font-bold uppercase mb-1 border-b border-black pb-0.5 flex justify-between items-center bg-gray-50 -mx-1 px-1">
            <span>MTF {toBengaliNumerals(qIndex + 1)}</span>
            <span className="opacity-50 text-[6px]">MATRIX</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-black/30 text-[8px] w-6">#</th>
                {q.rightColumn.map((rc: any) => (
                  <th key={rc.id} className="border-b border-black/30 text-[9px] font-bold">{rc.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.leftColumn.map((lc: any) => (
                <tr key={lc.id}>
                  <td className="border-b border-black/10 text-[9px] font-bold py-[1px]">{lc.id}</td>
                  {q.rightColumn.map((rc: any) => (
                    <td key={rc.id} className="border-b border-black/10 py-[1px] text-center">
                      <div className="w-3.5 h-3.5 rounded-full border border-black mx-auto hover:bg-black transition-colors duration-200"></div>
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
        <tr className="bg-gray-100 border-b border-black text-[9px]">
          <th className="py-0.5 w-6 border-r border-black/20">NO</th>
          <th className="py-0.5">INT VALUE</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= intQuestions.length) return null;
          return (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="text-[10px] font-bold py-[1px] border-r border-black/20">{toBengaliNumerals(idx + 1)}</td>
              <td className="py-[1px] flex justify-center gap-1">
                {[1, 2, 3].map(pos => (
                  <div key={pos} className="flex flex-col gap-[1px] bg-gray-50 p-[1px] border border-black rounded-[1px]">
                    <div className="w-full h-2 bg-white border border-black flex items-center justify-center text-[6px] mb-[1px]"></div>
                    <div className="grid grid-cols-2 gap-[1px]">
                      {DIGITS.map(d => (
                        <div key={d} className="w-2.5 h-2.5 border-[0.5px] border-black rounded-full text-[6px] flex items-center justify-center bg-white">{toBengaliNumerals(d)}</div>
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
    <div className="w-full h-full flex flex-col pt-6 px-8 bg-white relative print:m-0 print:p-0"
      style={{
        fontFamily,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        border: 'none',
        position: 'relative'
      }}>

      {/* --- CORNER MARKERS --- */}
      <div className="absolute top-6 left-6 w-8 h-1 bg-black"></div>
      <div className="absolute top-6 left-6 w-1 h-8 bg-black"></div>
      <div className="absolute top-6 right-6 w-8 h-1 bg-black"></div>
      <div className="absolute top-6 right-6 w-1 h-8 bg-black"></div>
      <div className="absolute bottom-8 left-6 w-8 h-1 bg-black"></div>
      <div className="absolute bottom-8 left-6 w-1 h-8 bg-black"></div>
      <div className="absolute bottom-8 right-6 w-8 h-1 bg-black"></div>
      <div className="absolute bottom-8 right-6 w-1 h-8 bg-black"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="flex flex-col h-full mx-2 my-2 mb-8 border-[2px] border-black rounded-sm overflow-visible">

        {/* HEADER - Top Down 1/3 */}
        <header className="flex flex-col border-b-[2px] border-black bg-white">
          <div className="flex justify-between items-center p-3 pb-1">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain" />
              ) : (
                <div className="h-14 w-14 border border-black rounded-full flex items-center justify-center bg-gray-50 font-bold text-2xl">DS</div>
              )}
              <div>
                <h1 className="text-xl font-black uppercase tracking-wide leading-none">{instituteName}</h1>
                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em] mt-0.5">OMR ANSWER SHEET</h2>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xl font-black uppercase">{examTitle}</div>
              <span className="px-2 py-0.5 border border-black font-bold text-xs uppercase mt-1">{toBengaliNumerals(examDate)}</span>
            </div>
          </div>

          {/* INSTRUCTIONS + SET CODE Middle Band */}
          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-t border-black">
            <div className="text-[9px] font-medium leading-tight max-w-[40%]">
              <p>• Use Black Ballpoint Pen only.</p>
              <p>• Completely darken the bubble: ⬤</p>
              <p>• Do not fold or crush this sheet.</p>
            </div>

            {/* CENTER SET CODE BOX */}
            <div className="flex flex-col items-center border-[2px] border-black p-1 bg-white rounded shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest mb-1">SET CODE: {setName || 'A'}</span>
              <div className="flex gap-1.5">
                {mcqOptionLabels.slice(0, 4).map(l => (
                  <div key={l} className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[9px] font-black ${l === setName ? 'bg-black text-white' : 'bg-white'}`}>{l}</div>
                ))}
              </div>
            </div>

            {/* QR */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] font-bold">Secured ID</p>
                <p className="text-[9px] font-mono">{uniqueCode?.slice(0, 8)}</p>
              </div>
              <div className="border border-black p-1 bg-white">
                <QRCode value={JSON.stringify(qrData)} size={55} />
              </div>
            </div>
          </div>
        </header>

        {/* MIDDLE BAND: STUDENT INFO (Horizontal) */}
        <div className="flex flex-row justify-between items-stretch p-3 border-b-[2px] border-black bg-white gap-4">
          {/* Section 1: Roll No */}
          <div className="flex-1 border border-black p-2 rounded-sm bg-gray-50/50 flex justify-center">
            {verticalField('ROLL NO / রোল নম্বর', rollDigits, 20)}
          </div>

          {/* Section 2: Registration No (Placeholder) or Subject Code */}
          <div className="flex-1 border border-black p-2 rounded-sm bg-gray-50/50 flex justify-center">
            {verticalField('REGISTRATION NO', rollDigits, 20)}
          </div>

          {/* Section 3: Signatures */}
          <div className="w-[180px] flex flex-col justify-between py-2">
            <div className="border border-black p-2 h-[45%] bg-white rounded-sm relative">
              <span className="absolute bottom-1 right-2 text-[8px] font-bold uppercase text-gray-500">Student's Signature</span>
            </div>
            <div className="border border-black p-2 h-[45%] bg-white rounded-sm relative">
              <span className="absolute bottom-1 right-2 text-[8px] font-bold uppercase text-gray-500">Invigilator's Signature</span>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: QUESTION GRID (Full Width) */}
        <div className="flex-1 p-3 bg-white">
          <div className="grid grid-cols-4 gap-4 h-full">
            {/* Column 1 */}
            <div className="border border-black/50 p-1 h-full rounded-sm">
              {renderMCQColumn(0, 25)}
            </div>
            {/* Column 2 */}
            <div className="border border-black/50 p-1 h-full rounded-sm">
              {renderMCQColumn(25, 50)}
            </div>
            {/* Column 3 */}
            <div className="border border-black/50 p-1 h-full rounded-sm">
              {/* Mix regular MCQs and Special Types if needed */}
              {/* For now assuming std 100 questions flow, can inject types */}
              {renderMCQColumn(50, 75)}
            </div>
            {/* Column 4 */}
            <div className="border border-black/50 p-1 h-full rounded-sm">
              {renderMCQColumn(75, 100)}
            </div>
          </div>
          {/* Special Sections - Re-integrate as needed, perhaps below the main grid or in a separate area */}
          {/* For now, commenting out the previous special sections layout */}
          {/*
            <div className="grid grid-cols-3 gap-2 mt-4">
              {questions.mc && questions.mc.length > 0 && (
                <div className="border border-black p-1 rounded-sm bg-gray-50">
                  <div className="text-[9px] font-bold uppercase mb-1 border-b border-black px-1">MC (Multiple Correct)</div>
                  {renderMCColumn(0, 10, questions.mc)}
                </div>
              )}
              {questions.ar && questions.ar.length > 0 && (
                <div className="border border-black p-1 rounded-sm bg-gray-50">
                  <div className="text-[9px] font-bold uppercase mb-1 border-b border-black px-1">Assertion (AR)</div>
                  {renderARColumn(0, 10, questions.ar)}
                </div>
              )}
              {questions.int && questions.int.length > 0 && (
                <div className="border border-black p-1 rounded-sm bg-gray-50">
                  <div className="text-[9px] font-bold uppercase mb-1 border-b border-black px-1">Integer (INT)</div>
                  {renderINTColumn(0, 10, questions.int)}
                </div>
              )}
            </div>
            {questions.mtf && questions.mtf.length > 0 && renderMTFSection(questions.mtf)}
           */}
        </div>

      </div>

      {/* --- TIMING TRACKS (Bottom) --- */}
      <div className="absolute bottom-1 left-0 right-0 h-3 flex justify-between px-12 pointer-events-none">
        {Array.from({ length: 45 }).map((_, i) => (
          <div key={i} className="w-[3px] h-full bg-black"></div>
        ))}
      </div>

    </div>
  );
};

export default OMRSheet;