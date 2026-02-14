import React from "react";
import QRCode from "react-qr-code";

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
  const answerBubbleSize = 24; // Smaller to fit 4 cols

  // Vertical field helper with box, box and bubble same width
  const verticalField = (label: string, digits: number, fontClass: string = 'omr-bubble-font', width = 1, colClass = '', size = bubbleSize) => (
    <div className={`flex flex-col items-center mx-0.5 ${colClass}`} style={{ minWidth: width * (size + 6) }}>
      <div className="text-[10px] font-black mb-1 p-0.5 bg-black text-white w-full text-center uppercase tracking-tighter">{label}</div>
      {/* Box for hand-written entry, same width as bubble */}
      <div className="flex flex-row gap-1 mb-1">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="border-2 border-black bg-white flex items-center justify-center font-black" style={{ width: size, height: size + 4, fontSize: size * 0.7 }}></div>
        ))}
      </div>
      <div className="flex flex-row gap-1 p-1 bg-white border-2 border-black rounded">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            {DIGITS.map((d) => (
              <div
                key={d}
                className="w-4 h-4 border border-black rounded-full flex items-center justify-center text-[9px] font-black hover:bg-black hover:text-white"
                aria-label={`${label} digit ${idx + 1} option ${d}`}
              >{d}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  // Render a single column of 25 questions
  const renderMCQColumn = (startIdx: number, endIdx: number) => (
    <table className="w-full text-center border-collapse" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr className="bg-black text-white">
          <th className="text-[10px] font-black py-0.5">Q</th>
          {mcqOptionLabels.slice(0, 4).map((l, i) => (
            <th key={i} className="text-[10px] font-black py-0.5">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => (
          <tr key={idx} className="hover:bg-gray-50">
            <td className="text-[10px] font-black py-1 border-r border-black/20">{idx + 1}</td>
            {mcqOptionLabels.slice(0, 4).map((l, oidx) => (
              <td key={oidx} className="py-1">
                <div
                  className="w-5 h-5 border-2 border-black rounded-full flex items-center justify-center mx-auto bg-white text-[10px] font-black"
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
    <table className="w-full text-center border-collapse" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr className="bg-gray-800 text-white font-black text-[10px]">
          <th className="py-0.5">Q</th>
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
              <td className="text-[10px] font-black py-1 border-r border-black/20">{idx + 1}</td>
              {mcqOptionLabels.slice(0, 5).map((l, oidx) => (
                <td key={oidx} className="py-1">
                  <div
                    className="w-4 h-4 border-2 border-black rounded-sm flex items-center justify-center mx-auto bg-white"
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
    const labels = ['1', '2', '3', '4', '5'];
    return (
      <table className="w-full text-center border-collapse" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-gray-800 text-white font-black text-[10px]">
            <th className="py-0.5">Q</th>
            {labels.map((l, i) => (
              <th key={i} className="py-0.5">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
            if (idx >= arQuestions.length) return null;
            return (
              <tr key={idx} className="hover:bg-gray-100">
                <td className="text-[10px] font-black py-1 border-r border-black/20">{idx + 1}</td>
                {labels.map((l, oidx) => (
                  <td key={oidx} className="py-1">
                    <div
                      className="w-4 h-4 border-2 border-black rounded-full flex items-center justify-center mx-auto bg-white text-[9px] font-black"
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
    <div className="mt-2 space-y-3">
      {mtfQuestions.map((q, qIndex) => (
        <div key={qIndex} className="border border-black p-1.5 rounded relative bg-white overflow-hidden">
          <div className="text-[8px] font-black uppercase mb-1.5 border-b border-black pb-0.5 flex justify-between items-center bg-gray-100 -mx-1.5 px-1.5">
            <span>MTF Question {qIndex + 1}</span>
            <span className="opacity-50 text-[6px]">MATRIX TYPE</span>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-black/30 text-[8px]">#</th>
                {q.rightColumn.map((rc: any) => (
                  <th key={rc.id} className="border-b border-black/30 text-[10px] font-black">{rc.id}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.leftColumn.map((lc: any) => (
                <tr key={lc.id}>
                  <td className="border-b border-black/10 text-[10px] font-black py-1">{lc.id}</td>
                  {q.rightColumn.map((rc: any) => (
                    <td key={rc.id} className="border-b border-black/10 py-1 text-center">
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
    <table className="w-full text-center border-collapse" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr className="bg-gray-800 text-white font-black text-[10px]">
          <th className="py-0.5">Q</th>
          <th className="py-0.5">Int Answer</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-black/10">
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= intQuestions.length) return null;
          return (
            <tr key={idx} className="hover:bg-gray-100">
              <td className="text-[10px] font-black py-2 border-r border-black/20">{idx + 1}</td>
              <td className="py-2 flex justify-center gap-1">
                {[1, 2, 3].map(pos => (
                  <div key={pos} className="flex flex-col gap-0.5 bg-gray-200 p-0.5 border border-black rounded">
                    <div className="w-4 h-4 bg-white border border-black flex items-center justify-center text-[8px] font-black">▢</div>
                    <div className="grid grid-cols-2 gap-0.5">
                      {DIGITS.map(d => (
                        <div key={d} className="w-2.5 h-2.5 border border-black rounded-full text-[6px] font-black flex items-center justify-center bg-white">{d}</div>
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

      {/* Precision Timing Track (Left) */}
      <div className="absolute left-0 top-0 bottom-0 w-4 flex flex-col justify-around py-10 z-20 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="w-4 h-2 bg-black"></div>
        ))}
      </div>

      {/* Precision Timing Track (Right) */}
      <div className="absolute right-0 top-0 bottom-0 w-4 flex flex-col justify-around py-10 z-20 pointer-events-none">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="w-4 h-2 bg-black"></div>
        ))}
      </div>

      {/* Precision Anchor: Top-Left L-Stone */}
      <div className="absolute left-6 top-6 w-12 h-12 flex flex-col items-start justify-start z-30">
        <div className="w-12 h-4 bg-black"></div>
        <div className="w-4 h-8 bg-black"></div>
      </div>

      {/* Precision Anchor: Top-Right L-Stone */}
      <div className="absolute right-6 top-6 w-12 h-12 flex flex-col items-end justify-start z-30">
        <div className="w-12 h-4 bg-black"></div>
        <div className="w-4 h-8 bg-black"></div>
      </div>

      {/* Precision Anchor: Bottom-Left L-Stone */}
      <div className="absolute left-6 bottom-6 w-12 h-12 flex flex-col items-start justify-end z-30">
        <div className="w-4 h-8 bg-black"></div>
        <div className="w-12 h-4 bg-black"></div>
      </div>

      {/* Precision Anchor: Bottom-Right L-Stone */}
      <div className="absolute right-6 bottom-6 w-12 h-12 flex flex-col items-end justify-end z-30">
        <div className="w-4 h-8 bg-black"></div>
        <div className="w-12 h-4 bg-black"></div>
      </div>

      {/* Header Area */}
      <div className="w-full flex flex-row items-center justify-between px-16 pt-8 pb-4 border-b-2 border-black bg-white">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-12 w-12 object-contain" />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-black text-black uppercase tracking-widest">{instituteName}</span>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">OMR ANSWER SHEET</span>
          </div>
        </div>

        <div className="flex flex-col items-center flex-1">
          <span className="text-xl font-black text-black uppercase">{examTitle}</span>
          <div className="flex gap-4 mt-1">
            <span className="text-xs bg-black text-white px-2 py-0.5 font-bold uppercase">{subjectName}</span>
            <span className="text-xs border-2 border-black px-2 py-0.5 font-bold uppercase">{examDate}</span>
          </div>
        </div>

        <div className="flex flex-col items-end border-l-2 border-black pl-4">
          {uniqueCode && (
            <span className="text-[10px] font-mono font-bold text-black transform rotate-90 origin-right translate-y-4">#{uniqueCode}</span>
          )}
          <div className="text-xs font-black bg-gray-100 p-1 border border-black">SET: {setName || 'NULL'}</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-row items-stretch mx-12 my-4 gap-6">

        {/* Left Section: Answer Grid */}
        <div className="flex-[5] flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4 border-4 border-black p-2 bg-white rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
            <div className="border-r-2 border-black pr-2">
              {renderMCQColumn(0, 25)}
            </div>
            <div className="border-r-2 border-black pr-2">
              {renderMCQColumn(25, 50)}
            </div>
            <div className="border-r-2 border-black pr-2">
              {renderMCQColumn(50, 75)}
            </div>
            <div className="pl-1">
              {renderMCQColumn(75, 100)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {questions.mc && questions.mc.length > 0 && (
              <div className="border-2 border-black p-2 rounded bg-gray-50">
                <div className="text-[10px] font-black uppercase mb-1 border-b border-black">Multiple Correct (MC)</div>
                {renderMCColumn(0, 10, questions.mc)}
              </div>
            )}
            {questions.ar && questions.ar.length > 0 && (
              <div className="border-2 border-black p-2 rounded bg-gray-50">
                <div className="text-[10px] font-black uppercase mb-1 border-b border-black">Assertion-Reason (AR)</div>
                {renderARColumn(0, 10, questions.ar)}
              </div>
            )}
            {questions.int && questions.int.length > 0 && (
              <div className="border-2 border-black p-2 rounded bg-gray-50">
                <div className="text-[10px] font-black uppercase mb-1 border-b border-black">Integer Type (INT)</div>
                {renderINTColumn(0, 10, questions.int)}
              </div>
            )}
          </div>

          {questions.mtf && questions.mtf.length > 0 && (
            <div className="border-2 border-black p-2 rounded bg-white">
              <div className="text-[10px] font-black uppercase mb-1 border-b border-black">Match The Following (MTF)</div>
              {renderMTFSection(questions.mtf)}
            </div>
          )}
        </div>

        {/* Right Section: Student Data */}
        <div className="flex-[2] flex flex-col gap-4 border-4 border-black bg-gray-50 p-2 rounded-lg relative overflow-hidden">
          {/* Subtle Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -rotate-45">
            <span className="text-4xl font-black">CONFIDENTIAL</span>
          </div>

          <div className="flex flex-col items-center">
            {verticalField('রোল নম্বর', rollDigits, 'Noto Serif Bengali, serif', rollDigits, 'bg-white border p-1 rounded', 14)}
          </div>

          <div className="w-full border-t border-black border-dashed"></div>

          <div className="flex flex-row justify-center gap-2">
            <div className="flex flex-col items-center">
              <div className="text-[10px] font-black mb-1">সেট কোড</div>
              <div className="p-1 border bg-white rounded flex flex-col items-center gap-1">
                <div className="w-6 h-6 border-2 border-black mb-1 bg-gray-100 flex items-center justify-center text-xs font-bold">▢</div>
                {mcqOptionLabels.map((l) => (
                  <div key={l} className="w-5 h-5 border border-black rounded-full flex items-center justify-center text-[10px] font-black hover:bg-black hover:text-white cursor-pointer transition-colors duration-200">
                    {l}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center pt-4">
              <QRCode value={JSON.stringify(qrData)} size={64} />
              <span className="text-[8px] font-mono mt-1 opacity-50 uppercase">Secured QR</span>
            </div>
          </div>

          <div className="w-full border-t border-black border-dashed"></div>

          <div className="flex flex-col items-center">
            {verticalField('বিষয় কোড', 3, 'Noto Serif Bengali, serif', 3, 'bg-white border p-1 rounded', 14)}
          </div>

          <div className="mt-auto space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-gray-500">Student's Signature</span>
              <div className="h-10 border-2 border-black bg-white rounded shadow-inner"></div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black uppercase text-gray-500">Invigilator's Signature</span>
              <div className="h-10 border-2 border-black bg-white rounded shadow-inner"></div>
            </div>
          </div>

          {/* New Optimized Space Algorithm for Instructions */}
          <div className="mt-4 p-2 border border-black bg-white text-[9px] leading-tight rounded">
            <div className="font-black text-center mb-1 border-b border-black pb-0.5">INSTRUCTIONS / নিয়মাবলি</div>
            <ul className="space-y-1 font-bold">
              <li className="flex items-start gap-1">
                <span className="text-blue-500">•</span>
                <span>Use Black Ball-Point Pen only.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-red-500">•</span>
                <span>Filling more than one bubble per row is invalid.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-green-500">•</span>
                <span>Darken the bubble completely: ⬤</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Bottom Timing Track (Horizontal) */}
      <div className="absolute bottom-0 left-0 right-0 h-4 flex flex-row justify-around px-20 z-20 pointer-events-none">
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} className="w-2 h-4 bg-black"></div>
        ))}
      </div>

    </div>
  );
};

export default OMRSheet; 