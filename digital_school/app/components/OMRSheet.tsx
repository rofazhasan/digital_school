import React from "react";
import QRCode from "react-qr-code";

interface OMRSheetProps {
  questions: {
    mcq: { q: string; options: string[] }[];
    mc?: { q: string; options: string[] }[];
    cq?: any[];
    sq?: any[];
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
    <div className={`flex flex-col items-center mx-0.5 ${colClass}`} style={{ minWidth: width * (size + 4) }}>
      <div className="text-xs font-bold mb-0.5 text-center" style={{ fontWeight: 700 }}>{label}</div>
      {/* Box for hand-written entry, same width as bubble */}
      <div className="flex flex-row gap-0.5 mb-0.5">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="border border-black bg-white" style={{ width: size, height: size * 0.9, fontSize: size * 0.5 }}></div>
        ))}
      </div>
      <div className="flex flex-row gap-0.5">
        {Array.from({ length: width }).map((_, idx) => (
          <div key={idx} className="flex flex-col items-center gap-0.5">
            {DIGITS.map((d) => (
              <div
                key={d}
                className={`border-2 border-black rounded-full ${fontClass} flex items-center justify-center bg-white`}
                style={{ width: size, height: size, fontSize: size * 0.6, fontWeight: 700 }}
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
    <table className="w-full text-center border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th className="border-b-2 border-black text-base py-1 font-bold">প্রশ্ন</th>
          {mcqOptionLabels.map((l, i) => (
            <th key={i} className="border-b-2 border-black text-base py-1 font-bold">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => (
          <tr key={idx} className="">
            <td className="border-b border-gray-400 text-base py-1 px-1 font-bold" style={{ height: '28px' }}>{idx + 1}</td>
            {mcqOptionLabels.map((l, oidx) => (
              <td key={oidx} className="border-b border-gray-300 py-1 px-1" style={{ height: '28px' }}>
                <div
                  className="border-2 border-black rounded-full flex items-center justify-center mx-auto bg-white text-lg font-bold"
                  style={{ width: answerBubbleSize, height: answerBubbleSize, fontSize: answerBubbleSize * 0.7, fontWeight: 700 }}
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
    <table className="w-full text-center border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
      <thead>
        <tr>
          <th className="border-b-2 border-black text-base py-1 font-bold">প্রশ্ন</th>
          {mcqOptionLabels.map((l, i) => (
            <th key={i} className="border-b-2 border-black text-base py-1 font-bold">{l}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: endIdx - startIdx }, (_, i) => startIdx + i).map(idx => {
          if (idx >= mcQuestions.length) return null;
          return (
            <tr key={idx} className="">
              <td className="border-b border-gray-400 text-base py-1 px-1 font-bold" style={{ height: '28px' }}>{idx + 1}</td>
              {mcqOptionLabels.map((l, oidx) => (
                <td key={oidx} className="border-b border-gray-300 py-1 px-1" style={{ height: '28px' }}>
                  <div
                    className="border-2 border-black rounded-sm flex items-center justify-center mx-auto bg-white text-sm font-bold"
                    style={{ width: answerBubbleSize - 2, height: answerBubbleSize - 2, fontSize: (answerBubbleSize - 2) * 0.5, fontWeight: 700 }}
                    aria-label={`MC ${idx + 1} option ${l}`}
                  >☐</div>
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="w-full h-full flex flex-col items-stretch p-0 gap-0 omr-bg-pink relative" style={{ fontFamily, borderRadius: 8, border: '2px solid #222', maxWidth: '8.27in', minHeight: '11.69in', background: '#ffb6e6', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Header: Exam info, logo, confidential, etc. */}
      <div className="w-full flex flex-row items-center justify-between px-2 pt-2 pb-1 border-b border-black bg-white" style={{ minHeight: 0, marginBottom: 2 }}>
        {/* Left: Logo or watermark (if any) */}
        <div className="flex items-center gap-1 min-w-0">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain mr-1" style={{ maxHeight: 28 }} />
          )}
          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap leading-tight" style={{ lineHeight: 1.1 }}>{instituteName}</span>
        </div>
        {/* Center: Exam title and info */}
        <div className="flex flex-col items-center flex-1 min-w-0 px-1">
          <span className="text-base font-bold text-black leading-tight" style={{ lineHeight: 1.1 }}>{examTitle}</span>
          <span className="text-xs text-gray-700 font-medium leading-tight" style={{ lineHeight: 1.1 }}>{examDate} | {subjectName} | {setName}</span>
        </div>
        {/* Right: Confidential */}
        <div className="flex flex-col items-end min-w-0">
          {uniqueCode && (
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">#{uniqueCode}</span>
          )}
        </div>
      </div>
      {/* Anchors for Computer Vision - Large Solid Squares */}
      {/* Top-Left */}
      <div className="absolute left-2 top-2 w-6 h-6 bg-black rounded-none" style={{ zIndex: 10 }}></div>
      {/* Top-Right */}
      <div className="absolute right-2 top-2 w-6 h-6 bg-black rounded-none" style={{ zIndex: 10 }}></div>
      {/* Bottom-Left */}
      <div className="absolute left-2 bottom-2 w-6 h-6 bg-black rounded-none" style={{ zIndex: 10 }}></div>
      {/* Bottom-Right */}
      <div className="absolute right-2 bottom-2 w-6 h-6 bg-black rounded-none" style={{ zIndex: 10 }}></div>

      {/* Main OMR body */}
      <div className="flex-1 w-full flex flex-row items-stretch p-2 gap-0 omr-bg-pink">
        {/* Left: Four-column MCQ Answer Table (fit 100 questions) */}
        <div className="flex-[4] flex flex-row gap-0 border border-black rounded bg-white p-1 justify-between min-w-0">
          <div className="w-1/4 min-w-0 border-r border-gray-400">{renderMCQColumn(0, 25)}</div>
          <div className="w-1/4 min-w-0 border-r border-gray-400">{renderMCQColumn(25, 50)}</div>
          <div className="w-1/4 min-w-0 border-r border-gray-400">{renderMCQColumn(50, 75)}</div>
          <div className="w-1/4 min-w-0">{renderMCQColumn(75, 100)}</div>
        </div>
        {/* Vertical black bar between answer grid and right column */}
        <div className="w-2 bg-black mx-1"></div>
        {/* Right: Fields, QR, Signature, Instructions (compact, bold, boxed) */}
        <div className="flex flex-col items-center justify-between min-w-[170px] max-w-[200px] border-4 border-black rounded bg-white p-2 h-full relative">
          {/* Roll and set code, with separator */}
          <div className="flex flex-row w-full justify-center mb-1">
            {verticalField('রোল নম্বর', rollDigits, 'Noto Serif Bengali, serif', rollDigits, '', bubbleSize)}
            <div className="flex flex-col items-center">
              <div className="text-xs font-semibold mb-1">সেট কোড</div>
              <div className="flex flex-col items-center gap-1">
                <div className="border border-black w-7 h-7 mb-1 bg-white"></div>
                {mcqOptionLabels.map((l) => (
                  <div
                    key={l}
                    className="border-2 border-black rounded-full flex items-center justify-center bg-white text-lg font-bold"
                    style={{ width: bubbleSize, height: bubbleSize, fontSize: bubbleSize * 0.7, fontWeight: 700 }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full border-t-2 border-black my-1"></div>
          {/* Registration and subject code, with separator */}
          <div className="flex flex-row w-full justify-center mb-1">
            {verticalField('রেজিস্ট্রেশন নম্বর', 6, 'Times New Roman', 6, '', bubbleSize)}
            {verticalField('বিষয় কোড', 3, 'Noto Serif Bengali, serif', 3, '', bubbleSize)}
          </div>
          <div className="w-full border-t-2 border-black my-1"></div>
          {/* QR and Set */}
          <div className="flex flex-col items-center mb-1">
            <QRCode value={JSON.stringify(qrData)} size={90} />
            {setName && <div className="text-xs font-bold mt-1">সেট: {setName}</div>}
          </div>
          <div className="flex flex-row justify-between w-full gap-2 mt-1">
            <div className="flex flex-col items-center flex-1">
              <div className="  w-12 h-6"></div>

            </div>
          </div>
          <div className="flex flex-row justify-between w-full gap-2 mt-1">
            <div className="flex flex-col items-center flex-1">
              <div className="  w-12 h-6"></div>

            </div>
          </div>
          {/* Signature box */}
          <div className="flex flex-row justify-between w-full gap-2 mt-1">
            <div className="flex flex-col items-center flex-1">
              <div className="border border-black w-full h-10 flex flex-col justify-center items-center"></div>

            </div>
          </div>
          <div className="flex flex-col items-center w-full mt-2 mb-1">
            <div className="">
              <span className="text-xs font-bold">কক্ষ পরিদর্শকের স্বাক্ষর ও তারিখ</span>
            </div>

          </div>
          {/* Large instruction block at bottom */}
          <div className="w-full mt-2 p-2 border-2 border-black rounded bg-white text-xs font-bold text-center leading-tight" style={{ fontWeight: 700 }}>
            <div>নিয়মাবলি</div>
            <ol className="list-decimal list-inside text-left mt-1">
              <li>
                সঠিক পদ্ধতি
                <span className="inline-block w-4 h-4 border-2 border-black rounded-full bg-black align-middle mx-1"></span>
                ভুল পদ্ধতি
                <span className="inline-block w-4 h-4 border-2 border-black rounded-full bg-cross-mark align-middle mx-1"></span>
              </li>
              <li> অংশবিশেষ ভরাট করতে হবে।</li>
              <li>উত্তরপত্রে নির্ধারিত স্থানে ব্যতীত কোন অতিরিক্ত দাগ বা লেখা যাবে না।</li>
              <li>শুধুমাত্র কালো বল-পয়েন্ট কলম দিয়ে বাবল ভরাট করতে হবে।</li>
              <li>সেট কোড না লিখলে/ভুল ভরাট করলে উত্তরপত্র বাতিল হবে।</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OMRSheet; 