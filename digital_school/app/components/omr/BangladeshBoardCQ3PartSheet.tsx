"use client";

import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toBengaliNumerals as toBanglaNumber, generateBoardCQSerial } from '@/utils/numeralConverter';
import type { FieldBlock, Template } from '@/lib/omr/types';
import { saveCalibratedTemplateLocal } from '@/lib/omr/presetTemplates';

const StripCornerFiducials = ({ prefix }: { prefix: string }) => (
  <>
    {[
      { id: `${prefix}_TL`, style: { top: 2, left: 2 } },
      { id: `${prefix}_TR`, style: { top: 2, right: 2 } },
      { id: `${prefix}_BL`, style: { bottom: 2, left: 2 } },
      { id: `${prefix}_BR`, style: { bottom: 2, right: 2 } },
    ].map((m) => (
      <div
        key={m.id}
        data-cq-fiducial={m.id}
        style={{
          position: 'absolute',
          ...m.style,
          width: 16,
          height: 16,
          border: '2.5px solid #000000',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          zIndex: 15,
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: 7, height: 7, background: '#000000' }} />
      </div>
    ))}
  </>
);

const CrispScissorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" />
  </svg>
);

export interface BangladeshBoardCQ3PartSheetProps {
  serialNumber?: string;
  examYear?: string;
  examId?: string;
  instituteName?: string;
  examTitle?: string;
  themeColor?: 'magenta' | 'black' | 'blue';
  examType?: 'SSC' | 'HSC' | 'DIBS';
  sheetIndex?: number;
}

/**
 * Official Bangladesh Government / Education Board Crest Monogram SVG
 */
const OfficialBoardEmblem = ({ size = 26, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="cq-board-emblem inline-block align-middle"
  >
    <circle cx="50" cy="50" r="46" stroke={color} strokeWidth="3" fill="#ffffff" />
    <circle cx="50" cy="50" r="41" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
    {/* Water lily blossom center (শাপলা) */}
    <path d="M50 24 C46 34 38 44 32 48 C36 46 44 45 47 48 C48 38 50 30 50 24 Z" fill={color} />
    <path d="M50 24 C54 34 62 44 68 48 C64 46 56 45 53 48 C52 38 50 30 50 24 Z" fill={color} />
    <path d="M50 22 C49 32 46 44 50 50 C54 44 51 32 50 22 Z" fill={color} />
    {/* Base water waves (নদীমাতৃক বাংলাদেশ) */}
    <path d="M26 62 Q50 54 74 62 Q50 58 26 62 Z" fill={color} />
    <path d="M30 67 Q50 61 70 67 Q50 64 30 67 Z" fill={color} />
    <path d="M36 72 Q50 68 64 72 Q50 70 36 72 Z" fill={color} />
    {/* Surrounding rice paddy sheaves (ধানের শীষ) */}
    <path d="M24 50 C22 40 26 30 32 26 C28 32 28 42 30 48 Z" fill={color} />
    <path d="M76 50 C78 40 74 30 68 26 C72 32 72 42 70 48 Z" fill={color} />
    {/* 4 National Stars */}
    <polygon points="50,11 51.5,14 55,14 52,16 53.5,19 50,17 46.5,19 48,16 45,14 48.5,14" fill={color} />
  </svg>
);

export function BangladeshBoardCQ3PartSheet({
  serialNumber,
  examYear = '২৬',
  examId = 'BOARD_CQ_EXAM',
  instituteName = 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড, ঢাকা',
  examTitle = 'এস.এস.সি / এইচ.এস.সি / ডিআইবিএস পরীক্ষা',
  themeColor = 'magenta',
  examType = 'HSC'
}: BangladeshBoardCQ3PartSheetProps) {
  // If serialNumber is missing or placeholder T2301139641, generate a dynamic authentic serial
  const effectiveSerial = React.useMemo(() => {
    if (serialNumber && serialNumber !== 'T2301139641') {
      return serialNumber;
    }
    return generateBoardCQSerial('T', examYear || '26');
  }, [serialNumber, examYear]);

  // Extract authentic 2 Bengali digits for exam year (e.g. '2026' or '26' or '২৬' -> ['২', '৬'])
  const yearDigits = React.useMemo(() => {
    const raw = String(examYear || '26').trim();
    const enDigits = raw.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d))).replace(/\D/g, '');
    const lastTwo = enDigits.length >= 2 ? enDigits.slice(-2) : enDigits.padStart(2, '26');
    return [toBanglaNumber(lastTwo[0] || '2'), toBanglaNumber(lastTwo[1] || '6')];
  }, [examYear]);

  // Dynamic exam level options based on examTitle
  const examTypeOptions = React.useMemo(() => {
    const title = (examTitle || '').toLowerCase();
    if (title.includes('দাখিল') || title.includes('আলিম')) {
      return ['দাখিল', 'আলিম', 'অন্যান্য'];
    }
    if (title.includes('জেএসসি') || title.includes('জেডিসি')) {
      return ['জেএসসি', 'জেডিসি', 'অন্যান্য'];
    }
    if (title.includes('নির্বাচনী') || title.includes('বার্ষিক') || title.includes('মডেল') || title.includes('অর্ধ-বার্ষিক')) {
      return ['অর্ধ-বার্ষিক', 'বার্ষিক', 'নির্বাচনী'];
    }
    // Default Bangladesh Board Options
    return ['এসএসসি', 'এইচএসসি', 'ডিআইবিএস'];
  }, [examTitle]);

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  // Theme color mappings
  const themePalette = {
    magenta: {
      primary: '#d91884',
      lightStripe: '#fdf2f8',
      tintBg: '#fce7f3',
      border: '#be185d',
    },
    black: {
      primary: '#111827',
      lightStripe: '#f9fafb',
      tintBg: '#f3f4f6',
      border: '#374151',
    },
    blue: {
      primary: '#1d4ed8',
      lightStripe: '#eff6ff',
      tintBg: '#dbeafe',
      border: '#1e40af',
    }
  }[themeColor] || {
    primary: '#d91884',
    lightStripe: '#fdf2f8',
    tintBg: '#fce7f3',
    border: '#be185d',
  };

  const part1Ref = useRef<HTMLDivElement>(null);
  const part2Ref = useRef<HTMLDivElement>(null);

  // Auto-calibrate BOTH detachable strips (Part 1 Student & Part 2 Examiner) strictly relative to each strip's OWN 4 fiducials
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const calibrateStrip = (
      sectionEl: HTMLElement | null,
      prefix: string,
      templateId: string,
      pageW: number,
      pageH: number
    ) => {
      if (!sectionEl) return;
      const tl = sectionEl.querySelector<HTMLElement>(`[data-cq-fiducial="${prefix}_TL"]`);
      const tr = sectionEl.querySelector<HTMLElement>(`[data-cq-fiducial="${prefix}_TR"]`);
      const bl = sectionEl.querySelector<HTMLElement>(`[data-cq-fiducial="${prefix}_BL"]`);
      const br = sectionEl.querySelector<HTMLElement>(`[data-cq-fiducial="${prefix}_BR"]`);
      if (!tl || !tr || !bl || !br) return;

      const bubbles = Array.from(sectionEl.querySelectorAll<HTMLElement>('[data-omr-bubble="1"]'));
      if (bubbles.length < 10) return;

      const fidX = 24;
      const fidY = 24;
      const rTL = tl.getBoundingClientRect();
      const rTR = tr.getBoundingClientRect();
      const rBL = bl.getBoundingClientRect();
      const rBR = br.getBoundingClientRect();
      const refL = (rTL.left + rTL.width / 2 + rBL.left + rBL.width / 2) / 2;
      const refR = (rTR.left + rTR.width / 2 + rBR.left + rBR.width / 2) / 2;
      const refT = (rTL.top + rTL.height / 2 + rTR.top + rTR.height / 2) / 2;
      const refB = (rBL.top + rBL.height / 2 + rBR.top + rBR.height / 2) / 2;
      if (refR - refL < 80 || refB - refT < 40) return;

      const sx = (pageW - 1 - 2 * fidX) / (refR - refL);
      const sy = (pageH - 1 - 2 * fidY) / (refB - refT);

      type MB = { block: string; label: string; value: string; x: number; y: number; w: number; h: number };
      const grouped: Record<string, MB[]> = {};
      let sumW = 0, sumH = 0;
      for (const el of bubbles) {
        const r = el.getBoundingClientRect();
        const block = el.dataset.omrBlock || 'Block';
        const label = el.dataset.omrLabel || '';
        const value = el.dataset.omrValue || '';
        const x = fidX + (r.left - refL) * sx;
        const y = fidY + (r.top - refT) * sy;
        const w = r.width * sx;
        const h = r.height * sy;
        sumW += w; sumH += h;
        if (!grouped[block]) grouped[block] = [];
        grouped[block].push({ block, label, value, x, y, w, h });
      }

      const avgW = Math.max(14, Math.round(sumW / bubbles.length));
      const avgH = Math.max(14, Math.round(sumH / bubbles.length));
      const fieldBlocks: Record<string, FieldBlock> = {};
      const customLabels: Record<string, string[]> = {};

      for (const [bName, items] of Object.entries(grouped)) {
        const labelOrder: string[] = [];
        const byLabel: Record<string, MB[]> = {};
        for (const it of items) {
          if (!byLabel[it.label]) { byLabel[it.label] = []; labelOrder.push(it.label); }
          byLabel[it.label].push(it);
        }
        const first = byLabel[labelOrder[0]];
        if (!first || first.length === 0) continue;
        const originX = Math.round(first[0].x);
        const originY = Math.round(first[0].y);
        const bGap = first.length > 1 ? Number(((first[first.length - 1].y - first[0].y) / (first.length - 1)).toFixed(2)) : 24;
        const lGap = labelOrder.length > 1 ? Number(((byLabel[labelOrder[labelOrder.length - 1]][0].x - first[0].x) / (labelOrder.length - 1)).toFixed(2)) : 24;
        fieldBlocks[bName] = {
          origin: [originX, originY],
          bubblesGap: bGap,
          labelsGap: lGap,
          direction: 'vertical',
          fieldLabels: labelOrder,
          bubbleValues: first.map((b) => b.value),
          section: bName,
        };
        customLabels[bName] = labelOrder;
      }

      const tpl: Template = {
        pageDimensions: [pageW, pageH],
        bubbleDimensions: [avgW, avgH],
        fiducialInset: [fidX, fidY],
        preProcessors: [{ name: 'CropOnMarkers' }],
        fieldBlocks,
        customLabels,
      };
      saveCalibratedTemplateLocal(templateId, tpl);
    };

    const timer = window.setTimeout(() => {
      calibrateStrip(part1Ref.current, 'P1', 'cq_part1_student_strip', 1240, 620);
      calibrateStrip(part2Ref.current, 'P2', 'cq_part2_examiner_strip', 1240, 620);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [examId, effectiveSerial]);

  return (
    <div 
      className="bd-cq-3part-sheet print-break-after"
      style={{
        '--cq-primary': themePalette.primary,
        '--cq-light-stripe': themePalette.lightStripe,
        '--cq-tint-bg': themePalette.tintBg,
        '--cq-border': themePalette.border,
      } as React.CSSProperties}
    >
      {/* Lateral Continuous Timing Tracks (Left & Right) */}
      <div className="cq-side-timing left">
        {[...Array(40)].map((_, i) => <div key={i} className="cq-sync-block"></div>)}
      </div>
      <div className="cq-side-timing right">
        {[...Array(40)].map((_, i) => <div key={i} className="cq-sync-block"></div>)}
      </div>

      {/* ========================================================================= */}
      {/* PART 1: পরীক্ষার্থীর অংশ (Detachable Student Identification Strip)        */}
      {/* ========================================================================= */}
      <section className="cq-part-container part-1-student">
        <div ref={part1Ref as React.RefObject<HTMLDivElement>} className="cq-strip-scan-box">
        <StripCornerFiducials prefix="P1" />
        <div className="cq-part-header formal-double-line">
          {/* Left Tag */}
          <div className="cq-header-side left">
            <div className="cq-part-badge" style={{ color: themePalette.primary, borderColor: themePalette.border, background: themePalette.tintBg }}>
              পরীক্ষার্থীর অংশ
            </div>
          </div>

          {/* Center: Formal Double-Line (School/Board Name + Exam Title & Year) */}
          <div className="cq-header-center-double">
            {/* Line 1: School / Board Name */}
            <div className="cq-title-line-1">
              <OfficialBoardEmblem size={24} color={themePalette.primary} />
              <h2 className="cq-board-title">{instituteName}</h2>
            </div>
            {/* Line 2: Exam Name with Year Digits */}
            <div className="cq-title-line-2">
              <span className="cq-exam-label">{examTitle} - ২০</span>
              <div className="cq-year-boxes">
                <div className="cq-digit-box">{yearDigits[0]}</div>
                <div className="cq-digit-box">{yearDigits[1]}</div>
              </div>
            </div>
          </div>

          {/* Right: Tracking Box */}
          <div className="cq-header-side right">
            <div className="cq-serial-number omr-latin-num">{effectiveSerial}</div>
            <div className="cq-qr-wrapper">
              <QRCodeSVG
                value={JSON.stringify({
                  part: 'P1_STUDENT',
                  sheetType: 'CQ_PART1_STUDENT',
                  template: 'cq_part1_student_strip',
                  examId: examId,
                  serial: effectiveSerial,
                  sn: effectiveSerial,
                  ex: examId,
                  b: instituteName,
                  t: examTitle,
                  yr: yearDigits.join(''),
                  v: 1
                })}
                size={38}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Black Barcode Synchronization Band */}
        <div className="cq-sync-band">
          <span className="cq-sync-warning">এ বক্সের মধ্যে কোন দাগ দেয়া যাবে না</span>
          <div className="cq-sync-bar-series">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="cq-sync-rect"></div>
            ))}
          </div>
        </div>
        <div className="cq-sub-instruction">
          অবশ্যই কালো কালির বলপয়েন্ট কলম দিয়ে বৃত্ত ভরাট করতে হবে।
        </div>

        {/* Main Grid: Exam Type + Roll + Reg + Subject Code + Extra Scripts + Signature */}
        <div className="cq-p1-grid-layout">
          {/* 1. Exam Level Selector (No set code in CQ) */}
          <div className="cq-field-column exam-type-col">
            <div className="cq-column-title">পরীক্ষা</div>
            <div className="cq-exam-bubble-options">
              {examTypeOptions.map((opt) => (
                <label key={opt} className="cq-exam-option">
                  <span className={`cq-bubble-circle ${examType === opt ? 'active' : ''}`}></span>
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Roll Number (4 Digits - English 0-9) */}
          <div className="cq-field-column roll-col">
            <div className="cq-column-title">রোল নম্বর (৪ ডিজিট)</div>
            <div className="cq-write-boxes-row">
              {[...Array(4)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(4)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="Roll" data-omr-label={`roll${colIdx + 1}`} data-omr-value={String(d)}>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Registration Number (6 Digits - English 0-9) */}
          <div className="cq-field-column reg-col">
            <div className="cq-column-title">রেজিস্ট্রেশন নম্বর (৬ ডিজিট)</div>
            <div className="cq-write-boxes-row">
              {[...Array(6)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(6)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="Registration" data-omr-label={`reg${colIdx + 1}`} data-omr-value={String(d)}>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Subject Code (3 Digits - English 0-9) */}
          <div className="cq-field-column sub-col">
            <div className="cq-column-title">বিষয় কোড</div>
            <div className="cq-write-boxes-row">
              {[...Array(3)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(3)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="SubjectCode" data-omr-label={`sub${colIdx + 1}`} data-omr-value={String(d)}>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Extra Script Count (2 Digits - English 0-9) */}
          <div className="cq-field-column extra-col">
            <div className="cq-column-title">অতিরিক্ত<br />উত্তরপত্রের সংখ্যা</div>
            <div className="cq-write-boxes-row">
              {[...Array(2)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(2)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="ExtraScripts" data-omr-label={`extra${colIdx + 1}`} data-omr-value={String(d)}>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Invigilator Signature Box */}
          <div className="cq-field-column invigilator-col">
            <div className="cq-sig-box">
              <div className="cq-sig-title">কক্ষ পরিদর্শকের স্বাক্ষর</div>
              <div className="cq-sig-blank-area"></div>
            </div>
            <div className="cq-sig-box date-box">
              <div className="cq-sig-title">তারিখ:</div>
              <div className="cq-sig-blank-area sm"></div>
            </div>
            <div className="cq-sig-warning-note">
              (বিঃদ্রঃ কোন প্রকার সীলমোহর দেয়া যাবে না)<br />
              বক্সের বাইরে স্বাক্ষর দেয়া যাবে না
            </div>
          </div>
        </div>

        </div>
        {/* Bottom Perforation Cut Guide — Strictly Outside Part 1 & Part 2 Scan Boxes */}
        <div className="cq-perforation-divider">
          <span className="cq-scissor-icon"><CrispScissorIcon /></span>
          <span className="cq-perforation-label">এখান থেকে কাটুন (CUT HERE — পরীক্ষার্থীর অংশ বিচ্ছিন্ন করুন)</span>
          <div className="cq-dashed-line"></div>
          <span className="cq-scissor-icon"><CrispScissorIcon /></span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PART 2: পরীক্ষক ও প্রধান পরীক্ষকের অংশ (Detachable Blind-Grading Strip)   */}
      {/* ========================================================================= */}
      <section className="cq-part-container part-2-examiner">
        <div ref={part2Ref as React.RefObject<HTMLDivElement>} className="cq-strip-scan-box">
        <StripCornerFiducials prefix="P2" />
        <div className="cq-part-header formal-double-line">
          {/* Left Tag */}
          <div className="cq-header-side left">
            <div className="cq-part-badge" style={{ color: themePalette.primary, borderColor: themePalette.border, background: themePalette.tintBg }}>
              পরীক্ষক / প্র: পরীক্ষকের অংশ
            </div>
          </div>

          {/* Center: Formal Double-Line (School/Board Name + Exam Title & Year) */}
          <div className="cq-header-center-double">
            {/* Line 1: School / Board Name */}
            <div className="cq-title-line-1 sm">
              <OfficialBoardEmblem size={20} color={themePalette.primary} />
              <h3 className="cq-board-title sm">{instituteName}</h3>
            </div>
            {/* Line 2: Exam Name with Year Digits */}
            <div className="cq-title-line-2 sm">
              <span className="cq-exam-label">{examTitle} - ২০</span>
              <div className="cq-year-boxes">
                <div className="cq-digit-box">{yearDigits[0]}</div>
                <div className="cq-digit-box">{yearDigits[1]}</div>
              </div>
            </div>
          </div>

          {/* Right: Tracking QR & Shared Serial Number for Detached Blind-Grading Pairing */}
          <div className="cq-header-side right">
            <div className="cq-serial-number omr-latin-num" style={{ fontSize: '9px' }}>{effectiveSerial}</div>
            <div className="cq-qr-wrapper sm">
              <QRCodeSVG
                value={JSON.stringify({
                  part: 'P2_EXAMINER',
                  sheetType: 'CQ_PART2_MARKS',
                  template: 'cq_part2_examiner_strip',
                  examId: examId,
                  serial: effectiveSerial,
                  sn: effectiveSerial,
                  v: 1
                })}
                size={36}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Sync Band */}
        <div className="cq-sync-band">
          <span className="cq-sync-warning">এ বক্সের মধ্যে কোন দাগ দেয়া যাবে না</span>
          <div className="cq-sync-bar-series">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="cq-sync-rect"></div>
            ))}
          </div>
        </div>
        <div className="cq-sub-instruction">
          অবশ্যই কালো কালির বলপয়েন্ট কলম দিয়ে বৃত্ত ভরাট করতে হবে।
        </div>

        {/* Examiner OMR Matrix */}
        <div className="cq-p2-grid-layout">
          {/* 1. Subject Code (3 Digits - English 0-9) */}
          <div className="cq-field-column">
            <div className="cq-column-title">বিষয় কোড</div>
            <div className="cq-write-boxes-row">
              {[...Array(3)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(3)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="SubjectCodePart2" data-omr-label={`subP2_${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 2. Examiner Code (4 Digits - English 0-9) */}
          <div className="cq-field-column">
            <div className="cq-column-title">পরীক্ষক কোড</div>
            <div className="cq-write-boxes-row">
              {[...Array(4)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(4)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="ExaminerCode" data-omr-label={`exCode${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Script Serial Number (4 Digits - English 0-9) */}
          <div className="cq-field-column">
            <div className="cq-column-title">উত্তরপত্রের ক্রমিক নম্বর</div>
            <div className="cq-write-boxes-row">
              {[...Array(4)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(4)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="ScriptSerial" data-omr-label={`serial${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 4. Extra Scripts (2 Digits - English 0-9) */}
          <div className="cq-field-column">
            <div className="cq-column-title">অতিরিক্ত<br />উত্তরপত্রের সংখ্যা</div>
            <div className="cq-write-boxes-row">
              {[...Array(2)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(2)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="ExtraScriptsPart2" data-omr-label={`extraP2_${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Obtained Marks (প্রাপ্ত নম্বর - 3 Digits - English 0-9) */}
          <div className="cq-field-column highlight-marks">
            <div className="cq-column-title">প্রাপ্ত নম্বর</div>
            <div className="cq-write-boxes-row">
              {[...Array(3)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(3)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="ObtainedMarks" data-omr-label={`marks${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 6. Head Examiner Marks (3 Digits - English 0-9) */}
          <div className="cq-field-column">
            <div className="cq-column-title sm">প্রধান পরীক্ষক কর্তৃক পরিবর্তনের পর প্রাপ্ত মোট নম্বর</div>
            <div className="cq-write-boxes-row">
              {[...Array(3)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
            <div className="cq-digits-matrix">
              {[...Array(3)].map((_, colIdx) => (
                <div key={colIdx} className={`cq-digit-strip ${colIdx % 2 === 0 ? 'striped' : ''}`}>
                  {digits.map(d => (
                    <div key={d} className="cq-bubble-item omr-latin-num" data-omr-bubble="1" data-omr-block="HeadExaminerMarks" data-omr-label={`headMarks${colIdx + 1}`} data-omr-value={String(d)}><span>{d}</span></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 7. Examiner & Scrutinizer Signatures */}
          <div className="cq-field-column signatures-col">
            <div className="cq-stacked-sig-table">
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label">পরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label">নিরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label">প্রধান পরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label">প্রধান পরীক্ষকের কোড</div>
                <div className="cq-head-code-boxes">
                  {[...Array(4)].map((_, i) => <div key={i} className="cq-mini-box"></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
        {/* Perforation Cut Guide Between Part 2 & Part 3 */}
        <div className="cq-perforation-divider">
          <span className="cq-scissor-icon"><CrispScissorIcon /></span>
          <span className="cq-perforation-label">এখান থেকে কাটুন (CUT HERE — উত্তরপত্রের অংশ)</span>
          <div className="cq-dashed-line"></div>
          <span className="cq-scissor-icon"><CrispScissorIcon /></span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PART 3: উত্তরপত্রের অংশ (Script Attached Marks Breakdown Table)           */}
      {/* ========================================================================= */}
      <section className="cq-part-container part-3-script">
        <div className="cq-part-header formal-double-line">
          {/* Left Tag */}
          <div className="cq-header-side left">
            <div className="cq-part-badge" style={{ color: themePalette.primary, borderColor: themePalette.border, background: themePalette.tintBg }}>
              উত্তরপত্রের অংশ
            </div>
          </div>

          {/* Center: Formal Double-Line (School/Board Name + Exam Title & Year) */}
          <div className="cq-header-center-double">
            {/* Line 1: School / Board Name */}
            <div className="cq-title-line-1 sm">
              <OfficialBoardEmblem size={20} color={themePalette.primary} />
              <h3 className="cq-board-title sm">{instituteName}</h3>
            </div>
            {/* Line 2: Exam Name with Year Digits */}
            <div className="cq-title-line-2 sm">
              <span className="cq-exam-label">{examTitle} - ২০</span>
              <div className="cq-year-boxes">
                <div className="cq-digit-box">{yearDigits[0]}</div>
                <div className="cq-digit-box">{yearDigits[1]}</div>
              </div>
            </div>
          </div>

          {/* Right: Tracking Box */}
          <div className="cq-header-side right">
            <div className="cq-serial-number sm">{effectiveSerial}</div>
            <div className="cq-qr-wrapper sm">
              <QRCodeSVG
                value={JSON.stringify({
                  part: 'P3_BREAKDOWN',
                  sn: effectiveSerial,
                  ex: examId,
                  b: instituteName,
                  t: examTitle,
                  yr: yearDigits.join(''),
                  v: 1
                })}
                size={32}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>
        </div>

        {/* Sync Band */}
        <div className="cq-sync-band">
          <span className="cq-sync-warning">এ বক্সের মধ্যে কোন দাগ দেয়া যাবে না</span>
          <div className="cq-sync-bar-series">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="cq-sync-rect"></div>
            ))}
          </div>
        </div>

        {/* Identification Row (Subject Code, Examiner Code, Script Serial) */}
        <div className="cq-p3-id-row">
          <div className="cq-p3-id-cell">
            <span className="cq-label">বিষয় কোড</span>
            <div className="cq-boxes-wrap">
              {[...Array(3)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
          </div>

          <div className="cq-p3-id-cell">
            <span className="cq-label">পরীক্ষক কোড</span>
            <div className="cq-boxes-wrap">
              {[...Array(4)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
          </div>

          <div className="cq-p3-qr-wrap">
            <QRCodeSVG
              value={JSON.stringify({
                part: 'P3_BREAKDOWN',
                sn: effectiveSerial,
                v: 1
              })}
              size={34}
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="cq-p3-id-cell">
            <span className="cq-label">উত্তরপত্রের মধ্যের অংশে ব্যবহৃত ক্রমিক নম্বর</span>
            <div className="cq-boxes-wrap">
              {[...Array(4)].map((_, i) => <div key={i} className="cq-write-box"></div>)}
            </div>
          </div>
        </div>

        {/* Question-by-Question Marks Table (Questions 1 to 20 + Grand Total) */}
        <div className="cq-questions-marks-layout">
          <div className="cq-q-table-wrapper">
            <table className="cq-q-marks-table">
              <thead>
                <tr>
                  <th className="cq-th-header-col">প্রশ্ন<br />নম্বর</th>
                  {[...Array(20)].map((_, i) => (
                    <th key={i} className="cq-th-qnum">{toBanglaNumber(i + 1)}</th>
                  ))}
                  <th className="cq-th-total">প্রাপ্ত<br />মোট নম্বর</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="cq-td-label">নম্বর</td>
                  {[...Array(20)].map((_, i) => (
                    <td key={i} className="cq-td-score-cell"></td>
                  ))}
                  <td className="cq-td-total-cell"></td>
                </tr>
              </tbody>
            </table>
            <div className="cq-table-note">
              প্রাপ্ত মোট নম্বর বাক্সের অংশে প্রাপ্ত নম্বরের ঘরে তুলে বৃত্ত ভরাট করতে হবে
            </div>
          </div>

          {/* Right Signature Table */}
          <div className="cq-p3-signatures-block">
            <div className="cq-stacked-sig-table">
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label sm">পরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label sm">নিরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label sm">প্রধান পরীক্ষকের স্বাক্ষর</div>
                <div className="cq-sig-cell-blank"></div>
              </div>
              <div className="cq-sig-row">
                <div className="cq-sig-cell-label sm">প্রধান পরীক্ষকের কোড</div>
                <div className="cq-head-code-boxes">
                  {[...Array(4)].map((_, i) => <div key={i} className="cq-mini-box"></div>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
