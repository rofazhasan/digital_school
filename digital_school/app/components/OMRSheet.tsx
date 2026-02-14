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
  rollDigits?: number; // default 6
  bubbleSize?: number; // px, default 18
  fontFamily?: string; // default 'Noto Serif Bengali, serif'
  extraFields?: Array<{ label: string; width?: number }>;
  mcqOptionLabels?: string[]; // default ['ক','খ','গ','ঘ']
  mcqOptionsCount?: number; // default 4
  setName?: string; // set name for display
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
  bubbleSize = 18, // for roll/set/reg/subject
  fontFamily = 'Noto Serif Bengali, serif',
  extraFields = [],
  mcqOptionLabels = MCQ_LABELS,
  mcqOptionsCount = 4, // Default to 4 options
  setName,
  logoUrl,
  instituteName = 'শিক্ষা প্রতিষ্ঠান',
  examTitle = 'পরীক্ষার নাম',
  examDate = 'তারিখ',
  subjectName = 'বিষয়',
  uniqueCode,
}) => {
  // Always 100 questions, split into four columns
  const totalQuestions = 100;

  // Reduced bubble size for the answer grid to prevent overlap
  // Previous was 24, now 18-20 range feels better for packing
  const answerBubbleSize = 20;

  // Vertical field helper with box, box and bubble same width
  const verticalField = (label: string, digits: number, fontClass: string = 'omr-bubble-font', width = 1, colClass = '', size = bubbleSize) => (
    <div className={`flex flex-col items-center mx-0.5 ${colClass}`} style={{ minWidth: width * (size + 6) }}>
      <div className="text-[10px] font-black mb-1 p-0.5 bg-black text-white w-full text-center uppercase tracking-tighter">{label}</div>
      {/* Box for hand-written entry, same width as bubble */}
      <div className="flex flex-row gap-1 mb-1">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="border-2 border-black bg-white flex items-center justify-center font-black" style={{ width: size, height: size + 4, fontSize: size * 0.8 }}></div>
        ))}
      </div>
      <div className="flex flex-row gap-1 p-1 bg-white border-2 border-black rounded">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-0.5">
            {DIGITS.map((d) => (
              <div
                key={d}
                className="w-4 h-4 border border-black rounded-full flex items-center justify-center text-[10px] font-black hover:bg-black hover:text-white pb-[1px]"
                aria-label={`${label} digit ${idx + 1} option ${d}`}
              >{toBengaliNumerals(d)}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Render a single column of 25 questions
  const renderMCQColumn = (startIdx: number, endIdx: number) => (
    <table className="w-full text-center border-collapse table-fixed">
      <thead>
        <tr className="bg-black text-white">
          <th className="text-[10px] font-black py-0.5 w-8">প্রশ্ন</th>
          {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, i) => (
            <th key={i} className="text-[10px] font-black py-0.5">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => (
          <tr key={idx} className="hover:bg-gray-50">
            <td className="text-[11px] font-black py-[1px] border-r border-black/20 leading-none">{toBengaliNumerals(idx + 1)}</td>
            {mcqOptionLabels.slice(0, mcqOptionsCount).map((l, oidx) => (
              <td key={oidx} className="py-[0px]">
                <div
                  className="w-[17px] h-[17px] border-[1.5px] border-black rounded-full flex items-center justify-center mx-auto bg-white text-[9px] font-black pb-[1px]"
                  aria-label={`MCQ ${idx + 1} option ${l}`}
                >{l}</div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
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
    <div className="w-full h-full flex flex-col items-stretch p-0 gap-0 bg-white relative print:m-0" style={{ fontFamily, border: '2px solid #000', maxWidth: '8.27in', minHeight: '11.69in', pageBreakInside: 'avoid', breakInside: 'avoid' }}>

      {/* Precision Timing Tracks (Visible for Scanning) */}
      <div className="absolute left-1 top-0 bottom-0 w-3 flex flex-col justify-around py-12 z-20 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="w-3 h-1.5 bg-black my-1"></div>
        ))}
      </div>
      <div className="absolute right-1 top-0 bottom-0 w-3 flex flex-col justify-around py-12 z-20 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="w-3 h-1.5 bg-black my-1"></div>
        ))}
      </div>

      {/* Reduced Size L-Stones (Moved slightly inwards) */}
      {/* Top-Left */}
      <div className="absolute left-6 top-6 z-30">
        <div className="w-8 h-2 bg-black"></div>
        <div className="w-2 h-6 bg-black"></div>
      </div>
      {/* Top-Right */}
      <div className="absolute right-6 top-6 flex flex-col items-end z-30">
        <div className="w-8 h-2 bg-black"></div>
        <div className="w-2 h-6 bg-black"></div>
      </div>
      {/* Bottom-Left */}
      <div className="absolute left-6 bottom-6 flex flex-col items-start z-30">
        <div className="w-2 h-6 bg-black"></div>
        <div className="w-8 h-2 bg-black"></div>
      </div>
      {/* Bottom-Right */}
      <div className="absolute right-6 bottom-6 flex flex-col items-end z-30">
        <div className="w-2 h-6 bg-black"></div>
        <div className="w-8 h-2 bg-black"></div>
      </div>

      {/* Header Area */}
      <div className="w-full flex flex-row items-center justify-between px-14 pt-8 pb-3 border-b-2 border-black bg-white">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black text-black uppercase tracking-widest">{instituteName}</span>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter">OMR ANSWER SHEET</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1">
          <span className="text-xl font-black text-black uppercase">{examTitle}</span>
          <div className="flex gap-4 mt-1">
            <span className="text-[11px] bg-black text-white px-3 py-0.5 font-bold uppercase">{subjectName}</span>
            <span className="text-[11px] border-2 border-black px-3 py-0.5 font-bold uppercase">{toBengaliNumerals(examDate)}</span>
          </div>
        </div>

        <div className="flex flex-col items-end border-l-2 border-black pl-3 gap-2">
          {uniqueCode && (
            <div className="text-[10px] font-mono border border-gray-400 px-2 rounded bg-gray-50 text-gray-500">
              ID: {uniqueCode}
            </div>
          )}
          <div className="text-[12px] font-black bg-gray-100 px-3 py-1 border border-black">SET: {setName || 'NULL'}</div>
        </div>
      </div>

      {/* Main Container - Adjusted Spacing */}
      <div className="flex-1 flex flex-row items-stretch mx-10 my-4 gap-4">

        {/* Left Section: Answer Grid - OPTIMIZED SPACING - Tight grid */}
        <div className="flex-[5] flex flex-col gap-2">
          {/* Main 100 Q Grid - Tighter gaps */}
          <div className="grid grid-cols-4 gap-x-1.5 gap-y-0 border-4 border-black p-1 bg-white rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] h-full">
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

        {/* Right Section: Student Data */}
        <div className="flex-[2] flex flex-col gap-4 border-4 border-black bg-gray-50 p-3 rounded relative overflow-hidden">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-45">
            <span className="text-3xl font-black">CONFIDENTIAL</span>
          </div>

          <div className="flex flex-col items-center pt-2">
            {verticalField('রোল নম্বর', rollDigits, 'Noto Serif Bengali, serif', rollDigits, 'bg-white border p-1 rounded shadow-sm', 12)}
          </div>

          <div className="w-full border-t border-black border-dashed opacity-50"></div>

          <div className="flex flex-row justify-center gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-black mb-1">সেট কোড</div>
              <div className="p-1 border bg-white rounded flex flex-col items-center gap-1 shadow-sm">
                <div className="w-6 h-6 border-2 border-black mb-1 bg-gray-100 flex items-center justify-center text-[12px] font-bold">▢</div>
                {mcqOptionLabels.slice(0, 4).map((l) => (
                  <div key={l} className="w-5 h-5 border border-black rounded-full flex items-center justify-center text-[10px] font-black hover:bg-black hover:text-white cursor-pointer transition-colors duration-200 pb-[1px]">
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="bg-white p-1 border border-black rounded shadow-sm">
                <QRCode value={JSON.stringify(qrData)} size={64} />
              </div>
              <span className="text-[8px] font-mono mt-1 opacity-50 uppercase tracking-widest">Secured QR</span>
            </div>
          </div>

          <div className="w-full border-t border-black border-dashed opacity-50"></div>

          <div className="flex flex-col items-center">
            {verticalField('বিষয় কোড', 3, 'Noto Serif Bengali, serif', 3, 'bg-white border p-1 rounded shadow-sm', 12)}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-gray-500">Student's Signature / শিক্ষার্থীর স্বাক্ষর</span>
              <div className="h-10 border-2 border-black bg-white rounded shadow-inner"></div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-gray-500">Invigilator's Signature / পরিদর্শকের স্বাক্ষর</span>
              <div className="h-10 border-2 border-black bg-white rounded shadow-inner"></div>
            </div>
          </div>

          {/* Instructions Block */}
          <div className="mt-4 p-2 border border-black bg-white text-[9px] leading-tight rounded shadow-sm">
            <div className="font-black text-center mb-1 border-b border-black pb-0.5">INSTRUCTIONS / নিয়মাবলি</div>
            <ul className="space-y-1 font-bold">
              <li className="flex items-start gap-1">
                <span className="text-blue-500">•</span>
                <span>কালো কালির বলপয়েন্ট কলম ব্যবহার করুন।</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-red-500">•</span>
                <span>বৃত্তটি সম্পূর্ণ ভরাট করুন: ⬤</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-red-500">•</span>
                <span>একাধিক বৃত্ত ভরাট করা নিষেধ।</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-gray-500">•</span>
                <span>Do not fold or crush this sheet.</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Bottom Timing Tracks (Visible) */}
      <div className="absolute bottom-1 left-0 right-0 h-3 flex flex-row justify-around px-16 z-20 pointer-events-none">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="w-1.5 h-3 bg-black"></div>
        ))}
      </div>

    </div>
  );
};

export default OMRSheet;