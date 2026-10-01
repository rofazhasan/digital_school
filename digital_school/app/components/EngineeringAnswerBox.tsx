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
  paperSize?: 'legal' | 'a4' | 'letter' | 'a3';
  className?: string;
  style?: React.CSSProperties;
}

export const EngineeringAnswerBox: React.FC<EngineeringAnswerBoxProps> = ({
  lines,
  marks = 2,
  isEn = false,
  boxStyle = 'ruled',
  boxScale = 1.0,
  paperSize = 'a4',
  className = '',
  style = {},
}) => {
  const isLegal = paperSize === 'legal';
  const effectiveLines = Math.max(2, lines);
  const effectiveScale = Math.max(0.75, Math.min(1.4, boxScale || 1.0));
  
  // On Legal paper (14in tall), line height is slightly more generous (7.2mm)
  // On standard A4 paper (297mm tall), line height is standard 6.8mm
  const baseLineHeightMm = (isLegal ? 7.2 : 6.8) * effectiveScale;
  const minHeightMm = Math.round(effectiveLines * baseLineHeightMm);

  return (
    <div
      className={`engineering-answer-box relative w-full border border-slate-700 rounded-xs bg-white print:border-black print:bg-white select-none overflow-hidden break-inside-avoid flex flex-col flex-1 ${className}`}
      style={{
        minHeight: `${minHeightMm}mm`,
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        ...style,
      }}
    >
      {/* Background Style: Grid (5mm engineering graph paper) */}
      {boxStyle === 'grid' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30 print:opacity-45"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(100, 116, 139, 0.4) 0.75px, transparent 0.75px),
              linear-gradient(to bottom, rgba(100, 116, 139, 0.4) 0.75px, transparent 0.75px)
            `,
            backgroundSize: '5mm 5mm',
          }}
          aria-hidden="true"
        />
      )}

      {/* Background Style: Ruled Lines (Infinite repeating gradient with Left Margin Guide) */}
      {boxStyle === 'ruled' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              to bottom,
              transparent,
              transparent ${baseLineHeightMm - 0.75}mm,
              rgba(148, 163, 184, 0.5) ${baseLineHeightMm - 0.75}mm,
              rgba(148, 163, 184, 0.5) ${baseLineHeightMm}mm
            )`,
            backgroundSize: `100% ${baseLineHeightMm}mm`,
          }}
          aria-hidden="true"
        >
          {/* Subtle Left Margin Guide Line (Standard 14mm engineering script margin) */}
          <div className="absolute top-0 bottom-0 left-[14mm] border-r border-slate-300/80 print:border-slate-400" />
        </div>
      )}

      {/* Top-Right Docked Examiner Mark Evaluation Box */}
      <div className="absolute top-0 right-0 border-b border-l border-slate-600 print:border-black bg-slate-50/95 print:bg-white px-2 py-0.5 text-[8.5px] font-mono text-slate-800 print:text-black z-10 flex items-center gap-1.5 shadow-2xs select-none">
        <span className="font-semibold">{isEn ? 'Mark' : 'প্রাপ্ত নম্বর'}:</span>
        <span className="inline-block w-6 border-b border-dotted border-black text-center font-bold"></span>
        <span className="font-bold">/ {isEn ? marks : toBengaliNumerals(marks)}</span>
      </div>

      {/* Clean Unobstructed Writing Body - 100% usable student workspace */}
      <div className="relative z-0 w-full h-full flex-1" style={{ minHeight: `${minHeightMm}mm` }} />
    </div>
  );
};
