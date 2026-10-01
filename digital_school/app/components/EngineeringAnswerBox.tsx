import React from 'react';
import { SqClassification } from '@/utils/engineeringAnswerBox';
import { toBengaliNumerals } from '@/utils/numeralConverter';

export interface EngineeringAnswerBoxProps {
  lines: number;
  marks?: number;
  classification?: SqClassification;
  guideType?: 'numerical' | 'diagram' | 'derivation' | 'code' | 'none';
  isEn?: boolean;
  boxStyle?: 'ruled' | 'blank' | 'grid';
  boxScale?: number;
}

export const EngineeringAnswerBox: React.FC<EngineeringAnswerBoxProps> = ({
  lines,
  marks = 2,
  classification = 'short_explanation',
  guideType = 'none',
  isEn = false,
  boxStyle = 'ruled',
  boxScale = 1.0,
}) => {
  const effectiveLines = Math.max(2, lines);
  const effectiveScale = Math.max(0.7, Math.min(1.5, boxScale || 1.0));
  const lineHeightMm = 6.8 * effectiveScale;
  const totalHeightMm = Math.round(effectiveLines * lineHeightMm);

  return (
    <div
      className="engineering-answer-box relative w-full border border-slate-700 rounded-sm my-2 bg-white print:border-black print:bg-white select-none overflow-hidden break-inside-avoid"
      style={{
        minHeight: `${totalHeightMm}mm`,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {/* Background Style: Grid */}
      {boxStyle === 'grid' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 print:opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, #475569 0.75px, transparent 0.75px), radial-gradient(circle, #475569 0.75px, transparent 0.75px)',
            backgroundSize: '5mm 5mm',
            backgroundPosition: '0 0, 2.5mm 2.5mm',
          }}
          aria-hidden="true"
        />
      )}

      {/* Background Style: Ruled Lines */}
      {boxStyle === 'ruled' && (
        <div
          className="absolute inset-0 flex flex-col pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {Array.from({ length: effectiveLines }).map((_, lIdx) => (
            <div
              key={lIdx}
              className="w-full border-b border-dashed border-slate-300/80 print:border-slate-400/80"
              style={{ height: `${lineHeightMm}mm` }}
            />
          ))}
        </div>
      )}

      {/* Content Prompts & Watermarks */}
      <div className="relative z-10 w-full h-full p-1.5 flex flex-col justify-between" style={{ minHeight: `${totalHeightMm}mm` }}>
        {/* Top Watermarks / Hints */}
        <div className="flex items-start justify-between w-full pointer-events-none">
          {guideType === 'numerical' && (
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 bg-white/80 px-1 rounded">
              {isEn ? 'Given / Data:' : 'দেওয়া আছে:'}
            </span>
          )}

          {guideType === 'derivation' && (
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 bg-white/80 px-1 rounded">
              {isEn ? 'Derivation / Proof Steps:' : 'প্রতিপাদন / প্রমাণের ধাপসমূহ:'}
            </span>
          )}

          {guideType === 'code' && (
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 bg-white/80 px-1 rounded">
              {isEn ? '// Write Solution Code Below:' : '// সমাধান কোড / অ্যালগরিদম:'}
            </span>
          )}

          {guideType === 'diagram' && (
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 bg-white/80 px-1 rounded ml-auto flex items-center gap-1">
              📐 {isEn ? 'Diagram / Schematic Area' : 'চিত্র / বর্তনী অঙ্কন স্থান'}
            </span>
          )}
        </div>

        {/* Middle Guide for Numerical */}
        {guideType === 'numerical' && effectiveLines >= 6 && (
          <div className="w-full pointer-events-none pl-1 my-auto">
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 print:text-slate-600 bg-white/80 px-1 rounded">
              {isEn ? 'Calculation / Working:' : 'হিসাব / গণনা:'}
            </span>
          </div>
        )}

        {/* Footer Area: Bottom-left student rule + Bottom-right Examiner Mark Box */}
        <div className="flex items-end justify-between w-full pt-1 pointer-events-none">
          <span className="text-[7.5px] text-slate-400 print:text-slate-500 italic select-none pl-1">
            {isEn ? 'Do not write outside this designated box' : 'নির্ধারিত বক্সের বাইরে লেখা নিষিদ্ধ'}
          </span>

          <div className="flex items-center gap-2">
            {guideType === 'numerical' && (
              <span className="text-[8.5px] font-mono font-bold text-slate-500 print:text-slate-700 bg-white/90 px-1">
                {isEn ? 'Ans: __________________' : 'উত্তর: __________________'}
              </span>
            )}

            <div className="border border-slate-400 bg-white px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-600 print:text-black print:border-black flex items-center gap-1 shadow-2xs">
              <span className="font-bold">{isEn ? 'Mark:' : 'নম্বর:'}</span>
              <span className="inline-block w-6 border-b border-dotted border-slate-600"></span>
              <span>/ {isEn ? marks : toBengaliNumerals(marks)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
