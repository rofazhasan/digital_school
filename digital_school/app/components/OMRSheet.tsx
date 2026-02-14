// Professional OMR Overhaul
// - Standardized 18px Bubbles (Prevent Overlap)
// - Hairline Borders (Professional Look)
// - Strict Grid Layout (Geometric Calibration)

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
  bubbleSize = 20, // Calibrated for 4-col layout
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
  // Precise bubble size to guaranteed NO overlap in ~130px columns
  const answerBubbleSize = 18;

  // Render a single vertical digit column
  const verticalField = (label: string, digits: number, size = 18) => (
    <div className="flex flex-col items-center mx-1">
      <div className="text-[9px] font-bold mb-1 uppercase tracking-wider">{label}</div>
      {/* Box for hand-written entry */}
      <div className="flex flex-row gap-0.5 mb-1">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="border border-black bg-white flex items-center justify-center font-bold" style={{ width: size, height: size + 4, fontSize: size * 0.7 }}></div>
        ))}
      </div>
      {/* Digits Grid */}
      <div className="flex flex-row gap-0.5 p-0.5 bg-white border border-black rounded-sm">
        {Array.from({ length: digits }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-0.5">
            {DIGITS.map((d) => (
              <div
                key={d}
                className="rounded-full border border-black flex items-center justify-center text-[9px] font-bold hover:bg-black hover:text-white transition-colors"
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
      <div className="flex justify-between items-center border-b border-black bg-gray-100 px-1 py-0.5 mb-0.5">
        <div className="text-[9px] font-bold w-5 text-center">NO</div>
        <div className="flex-1 flex justify-around">
          {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, i) => (
            <div key={i} className="text-[9px] font-bold w-4 text-center">{l}</div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="flex-1 flex flex-col justify-between">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map((idx) => (
          <div key={idx} className={`flex items-center justify-between py-[1px] hover:bg-gray-50 ${idx % 5 === 4 ? 'border-b border-black/10' : ''}`}>
            <div className="text-[10px] font-bold w-5 text-center leading-none border-r border-black/20 mr-1">
              {toBengaliNumerals(idx + 1)}
            </div>
            <div className={`flex-1 flex justify-around ${mcqOptionsCount === 5 ? 'gap-0.5' : 'gap-1'}`}>
              {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, oidx) => (
                <div
                  key={oidx}
                  className="rounded-full border border-black flex items-center justify-center bg-white text-[9px] font-medium"
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
          <th className="py-0.5 w-6 border-r border-black/20">NO</th>
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
              <td className="text-[10px] font-bold py-[1px] border-r border-black/20">{toBengaliNumerals(idx + 1)}</td>
              {mcqOptionLabels.slice(0, 5).map((l, oidx) => (
                <td key={oidx} className="py-[0px]">
                  <div
                    className="w-[14px] h-[14px] border border-black rounded-sm flex items-center justify-center mx-auto bg-white"
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

  // Render AR (Assertion-Reason)
  const renderARColumn = (startIdx: number, endIdx: number, arQuestions: any[]) => {
    const bengaliLabels = ['১', '২', '৩', '৪', '৫'];
    return (
      <table className="w-full text-center border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100 border-b border-black text-[9px]">
            <th className="py-0.5 w-6 border-r border-black/20">NO</th>
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
                <td className="text-[10px] font-bold py-[1px] border-r border-black/20">{toBengaliNumerals(idx + 1)}</td>
                {bengaliLabels.map((l, oidx) => (
                  <td key={oidx} className="py-[0px]">
                    <div
                      className="w-[14px] h-[14px] border border-black rounded-full flex items-center justify-center mx-auto bg-white text-[8px] font-medium pb-[1px]"
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
                        <div key={d} className="w-2 h-2 border-[0.5px] border-black rounded-full text-[5px] flex items-center justify-center bg-white">{toBengaliNumerals(d)}</div>
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
        border: 'none',
        position: 'relative'
      }}>

      {/* --- CORNER MARKERS (Professional Hairline) --- */}
      <div className="absolute top-8 left-8 w-6 h-1 bg-black"></div>
      <div className="absolute top-8 left-8 w-1 h-6 bg-black"></div>
      <div className="absolute top-8 right-8 w-6 h-1 bg-black"></div>
      <div className="absolute top-8 right-8 w-1 h-6 bg-black"></div>
      <div className="absolute bottom-8 left-8 w-6 h-1 bg-black"></div>
      <div className="absolute bottom-8 left-8 w-1 h-6 bg-black"></div>
      <div className="absolute bottom-8 right-8 w-6 h-1 bg-black"></div>
      <div className="absolute bottom-8 right-8 w-1 h-6 bg-black"></div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="flex flex-col h-full mx-6 my-4 border-[1px] border-black rounded overflow-visible">

        {/* HEADER - Streamlined */}
        <header className="flex flex-row justify-between items-center px-4 py-3 border-b-[1px] border-black bg-white">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
            ) : (
              <div className="h-12 w-12 border border-black rounded-full flex items-center justify-center bg-white font-bold text-xl">DS</div>
            )}
            <div className="flex flex-col">
              <h1 className="text-lg font-bold uppercase tracking-wide leading-none mb-0.5">{instituteName}</h1>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-widest">OFFICIAL OMR SHEET</h2>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="text-xl font-bold uppercase tracking-tight">{examTitle}</div>
            <div className="flex gap-2 items-center">
              <span className="text-[10px] font-mono border border-gray-300 px-2 rounded bg-gray-50 text-gray-500">{uniqueCode ? `ID: ${uniqueCode.slice(0, 8)}` : ''}</span>
              <span className="px-2 py-0.5 border border-black font-bold text-xs uppercase">{toBengaliNumerals(examDate)}</span>
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="flex-1 flex flex-row items-stretch m-4 gap-4 overflow-visible">

          {/* LEFT: 100 Questions Grid - STRICT COLUMN WIDTHS */}
          <div className="flex-[3] flex flex-col gap-2">
            <div className="grid grid-cols-4 gap-x-2 gap-y-0 h-full">
              <div className="border border-black p-0.5 h-full rounded-sm">
                {renderMCQColumn(0, 25)}
              </div>
              <div className="border border-black p-0.5 h-full rounded-sm">
                {renderMCQColumn(25, 50)}
              </div>
              <div className="border border-black p-0.5 h-full rounded-sm">
                {renderMCQColumn(50, 75)}
              </div>
              <div className="border border-black p-0.5 h-full rounded-sm">
                {renderMCQColumn(75, 100)}
              </div>
            </div>

            {/* Special Sections */}
            <div className="grid grid-cols-3 gap-2">
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
          </div>

          {/* RIGHT: Student Info - FIXED WIDTH */}
          <div className="w-[200px] flex-shrink-0 flex flex-col gap-3 border border-black bg-white p-3 rounded-sm relative shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="text-center border-b border-black pb-1 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest">STUDENT DATA</span>
            </div>

            <div className="flex justify-center">
              {verticalField('ROLL NO', rollDigits, 18)}
            </div>

            <div className="border-t border-black my-1"></div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase">SET CODE</span>
              <div className="flex items-center gap-2 border border-black p-1 rounded-sm bg-gray-50 w-full justify-center">
                <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-sm rounded-sm">{setName || 'A'}</div>
                <div className="flex gap-1">
                  {mcqOptionLabels.slice(0, 4).map(l => (
                    <div key={l} className={`w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px] font-bold ${l === setName ? 'bg-black text-white' : 'bg-white'}`}>{l}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-black my-1"></div>

            <div className="flex flex-col items-center">
              <div className="border border-black p-1 rounded-sm">
                <QRCode value={JSON.stringify(qrData)} size={70} />
              </div>
              <span className="text-[7px] font-mono mt-0.5 text-gray-500">OFFICIAL USE ONLY</span>
            </div>

            <div className="border-t border-black my-1"></div>

            <div className="flex justify-center">
              {verticalField('SUBJECT', 3, 18)}
            </div>

            <div className="mt-auto space-y-3">
              <div>
                <div className="h-6 border-b border-black border-dashed"></div>
                <span className="text-[7px] uppercase font-bold text-gray-500 block text-right">Student Signature</span>
              </div>
              <div>
                <div className="h-6 border-b border-black border-dashed"></div>
                <span className="text-[7px] uppercase font-bold text-gray-500 block text-right">Invigilator Signature</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* --- TIMING TRACKS (Bottom) --- */}
      <div className="absolute bottom-1 left-0 right-0 h-3 flex justify-between px-12 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="w-1 h-full bg-black"></div>
        ))}
      </div>

    </div>
  );
};

export default OMRSheet;