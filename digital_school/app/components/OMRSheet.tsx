"use client";

import React, { useEffect, useMemo, useRef } from "react";
import QRCode from "react-qr-code";
import { toBengaliNumerals, formatBengaliDuration } from "@/utils/numeralConverter";
import type { FieldBlock, Template } from "@/lib/omr/types";
import { saveCalibratedTemplateLocal } from "@/lib/omr/presetTemplates";

/**
 * High-Contrast Solid Pro Concentric Bullseye Fiducial
 * Optimal for smartphone camera AR lock, perspective warp, and heavy-noise/shadow scans.
 */
function SolidProFiducial({
  id,
  className = "",
}: {
  id: "TL" | "TR" | "BL" | "BR";
  className?: string;
}) {
  return (
    <div
      data-omr-fiducial={id}
      className={`absolute z-20 flex items-center justify-center ${className}`}
      style={{ width: 24, height: 24 }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          border: "3px solid #000000",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: 11,
            height: 11,
            background: "#000000",
          }}
        />
      </div>
    </div>
  );
}

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
  regDigits?: number;
  bubbleSize?: number;
  fontFamily?: string;
  extraFields?: Array<{ label: string; width?: number }>;
  mcqOptionLabels?: string[];
  mcqOptionsCount?: number;
  setName?: string;
  logoUrl?: string;
  instituteName?: string;
  schoolAddress?: string;
  examTitle?: string;
  examDate?: string;
  subjectName?: string;
  uniqueCode?: string;
  objectiveTime?: number;
  cqSqTime?: number;
  hideInstitute?: boolean;
}

const DEFAULT_BN_LABELS = ["ক", "খ", "গ", "ঘ", "ঙ"];
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Official Board-Style High-Contrast Monochrome (B&W) OMR Sheet
 * - Matches BangladeshOMRGenerator quality in crisp photocopy-safe Black & White
 * - 100% Single-Page Borderless A4 (210mm x 297mm)
 * - Auto-calibrates its exact fiducial-relative bubble coordinates to Scanner & Cloud DB on mount
 */
const OMRSheet: React.FC<OMRSheetProps> = ({
  questions,
  qrData,
  rollDigits = 4,
  regDigits = 6,
  fontFamily = "'NikoshBAN', 'Hind Siliguri', 'SolaimanLipi', 'Noto Serif Bengali', serif",
  mcqOptionLabels = DEFAULT_BN_LABELS,
  mcqOptionsCount = 4,
  setName = "A",
  logoUrl,
  instituteName = "শিক্ষা প্রতিষ্ঠান",
  schoolAddress = "",
  examTitle = "নৈর্ব্যক্তিক অভীক্ষার উত্তরপত্র",
  examDate = "",
  subjectName = "",
  uniqueCode,
  objectiveTime,
  hideInstitute = false,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  const actualMcqCount = useMemo(() => {
    const raw =
      (questions?.mcq?.length || 0) +
      (questions?.mc?.length || 0);
    if (raw <= 0) return 50;
    if (raw <= 25) return 25;
    if (raw <= 50) return 50;
    if (raw <= 60) return 60;
    return Math.min(100, Math.ceil(raw / 10) * 10);
  }, [questions]);

  const optCount: 4 | 5 = mcqOptionsCount >= 5 ? 5 : 4;
  const activeOptions = mcqOptionLabels.slice(0, optCount);
  const isBangla = activeOptions[0] === "ক";
  const isSplitLayout = actualMcqCount <= 50;
  const numColumns = isSplitLayout
    ? actualMcqCount <= 25
      ? 1
      : 2
    : actualMcqCount <= 60
    ? 3
    : 4;
  const qPerCol = Math.ceil(actualMcqCount / numColumns);

  const cleanSet = String(setName || "A")
    .replace(/^(set|সেট)\s*[-:]?\s*/i, "")
    .trim()
    .split(/\s+/)[0] || "A";

  const setOptions = isBangla ? ["ক", "খ", "গ", "ঘ"] : ["A", "B", "C", "D"];

  // Unique deterministic template ID shared between QR code & auto-calibration
  const resolvedTemplateId = useMemo(() => {
    const exId = (typeof qrData === "object" && qrData?.examId) || "exam";
    const safeEx = String(exId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "exam";
    return `bw_omr_${safeEx}_${actualMcqCount}q_${optCount}opt_${isSplitLayout ? "split" : "stack"}`;
  }, [qrData, actualMcqCount, optCount, isSplitLayout]);

  const qrPayloadString = useMemo(() => {
    if (typeof qrData === "string") return qrData;
    return JSON.stringify({
      ...(qrData || {}),
      v: 1,
      examId: qrData?.examId || "",
      setId: qrData?.setId || `SET_${cleanSet}`,
      setName: cleanSet,
      template: resolvedTemplateId,
      title: examTitle,
      sheetType: "MCQ",
    });
  }, [qrData, cleanSet, resolvedTemplateId, examTitle]);

  // Automatic Zero-Drift Fiducial-Relative DOM Calibration on mount
  useEffect(() => {
    if (typeof window === "undefined" || !sheetRef.current) return;
    const timer = window.setTimeout(() => {
      const sheetEl = sheetRef.current;
      if (!sheetEl) return;
      const sheetRect = sheetEl.getBoundingClientRect();
      if (sheetRect.width < 120 || sheetRect.height < 120) return;

      const tlEl = sheetEl.querySelector<HTMLElement>('[data-omr-fiducial="TL"]');
      const trEl = sheetEl.querySelector<HTMLElement>('[data-omr-fiducial="TR"]');
      const blEl = sheetEl.querySelector<HTMLElement>('[data-omr-fiducial="BL"]');
      const brEl = sheetEl.querySelector<HTMLElement>('[data-omr-fiducial="BR"]');
      if (!tlEl || !trEl || !blEl || !brEl) return;

      const bubbleNodes = Array.from(sheetEl.querySelectorAll<HTMLElement>('[data-omr-bubble="1"]'));
      if (bubbleNodes.length < 10) return;

      const pageW = 1240;
      const pageH = 1754;
      const fidInsetX = 30;
      const fidInsetY = 30;

      const rTL = tlEl.getBoundingClientRect();
      const rTR = trEl.getBoundingClientRect();
      const rBL = blEl.getBoundingClientRect();
      const rBR = brEl.getBoundingClientRect();

      const refLeft = (rTL.left + rTL.width / 2 + rBL.left + rBL.width / 2) / 2;
      const refRight = (rTR.left + rTR.width / 2 + rBR.left + rBR.width / 2) / 2;
      const refTop = (rTL.top + rTL.height / 2 + rTR.top + rTR.height / 2) / 2;
      const refBot = (rBL.top + rBL.height / 2 + rBR.top + rBR.height / 2) / 2;
      if (refRight - refLeft < 80 || refBot - refTop < 80) return;

      const scaleX = (pageW - 1 - 2 * fidInsetX) / (refRight - refLeft);
      const scaleY = (pageH - 1 - 2 * fidInsetY) / (refBot - refTop);

      type MB = { block: string; label: string; value: string; dir: "vertical" | "horizontal"; x: number; y: number; w: number; h: number };
      const grouped: Record<string, MB[]> = {};
      let sumW = 0;
      let sumH = 0;

      for (const el of bubbleNodes) {
        const r = el.getBoundingClientRect();
        const block = el.dataset.omrBlock || "Block";
        const label = el.dataset.omrLabel || "";
        const value = el.dataset.omrValue || "";
        const dir = (el.dataset.omrDir === "vertical" ? "vertical" : "horizontal") as "vertical" | "horizontal";
        const x = fidInsetX + (r.left - refLeft) * scaleX;
        const y = fidInsetY + (r.top - refTop) * scaleY;
        const w = r.width * scaleX;
        const h = r.height * scaleY;
        sumW += w;
        sumH += h;
        if (!grouped[block]) grouped[block] = [];
        grouped[block].push({ block, label, value, dir, x, y, w, h });
      }

      const avgW = Math.max(14, Math.round(sumW / bubbleNodes.length));
      const avgH = Math.max(14, Math.round(sumH / bubbleNodes.length));
      const fieldBlocks: Record<string, FieldBlock> = {};
      const customLabels: Record<string, string[]> = {};

      for (const [blockName, items] of Object.entries(grouped)) {
        const labelOrder: string[] = [];
        const byLabel: Record<string, MB[]> = {};
        for (const it of items) {
          if (!byLabel[it.label]) {
            byLabel[it.label] = [];
            labelOrder.push(it.label);
          }
          byLabel[it.label].push(it);
        }
        const firstGroup = byLabel[labelOrder[0]];
        if (!firstGroup || firstGroup.length === 0) continue;
        const dir = firstGroup[0].dir;
        const originX = Math.round(firstGroup[0].x);
        const originY = Math.round(firstGroup[0].y);

        let bubblesGap = 24;
        if (firstGroup.length > 1) {
          const lastB = firstGroup[firstGroup.length - 1];
          const span = dir === "horizontal" ? lastB.x - firstGroup[0].x : lastB.y - firstGroup[0].y;
          bubblesGap = Number((span / (firstGroup.length - 1)).toFixed(2));
        }

        let labelsGap = 24;
        if (labelOrder.length > 1) {
          const lastFirst = byLabel[labelOrder[labelOrder.length - 1]][0];
          const span = dir === "horizontal" ? lastFirst.y - firstGroup[0].y : lastFirst.x - firstGroup[0].x;
          labelsGap = Number((span / (labelOrder.length - 1)).toFixed(2));
        }

        fieldBlocks[blockName] = {
          origin: [originX, originY],
          bubblesGap,
          labelsGap,
          direction: dir,
          fieldLabels: labelOrder,
          bubbleValues: firstGroup.map((b) => b.value),
          section: blockName,
        };

        if (blockName === "Roll") customLabels["Roll"] = labelOrder;
        if (blockName === "Reg") customLabels["Registration"] = labelOrder;
        if (blockName === "SubjectCode") customLabels["SubjectCode"] = labelOrder;
        if (blockName === "SetCode") customLabels["Set"] = labelOrder;
      }

      const calibrated: Template = {
        pageDimensions: [pageW, pageH],
        bubbleDimensions: [avgW, avgH],
        fiducialInset: [fidInsetX, fidInsetY],
        preProcessors: [{ name: "CropOnMarkers" }],
        fieldBlocks,
        customLabels,
      };

      saveCalibratedTemplateLocal(resolvedTemplateId, calibrated);
      fetch("/api/omr-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: resolvedTemplateId,
          name: `${examTitle} (${actualMcqCount}Q B&W)`,
          canonicalWidth: pageW,
          canonicalHeight: pageH,
          geometry: calibrated,
        }),
      }).catch(() => {});
    }, 120);

    return () => window.clearTimeout(timer);
  }, [resolvedTemplateId, examTitle, actualMcqCount]);

  // Render a vertical digit matrix (Roll, Registration, Subject Code) in crisp B&W
  const renderDigitGrid = (
    title: string,
    blockName: string,
    labelPrefix: string,
    digits: number,
    compact = false
  ) => {
    const cellSize = compact ? 14 : digits >= 10 ? 15 : 17;
    return (
      <div className="border-[1.4px] border-black bg-white flex flex-col">
        <div className="bg-black text-white text-center font-bold tracking-wide py-0.5 px-1 text-[9.5px] leading-tight">
          {title}
        </div>
        {/* Handwritten digit boxes */}
        <div className="flex border-b-[1.2px] border-black">
          {Array.from({ length: digits }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 bg-white ${i < digits - 1 ? "border-r border-black" : ""}`}
              style={{ height: compact ? 18 : 21, minWidth: cellSize + 3 }}
            />
          ))}
        </div>
        {/* 0-9 Bubbles matrix with alternating subtle B&W column stripes */}
        <div className="flex">
          {Array.from({ length: digits }).map((_, colIdx) => (
            <div
              key={colIdx}
              className={`flex-1 flex flex-col items-center py-0.5 gap-[2px] ${
                colIdx % 2 === 0 ? "bg-neutral-100" : "bg-white"
              } ${colIdx < digits - 1 ? "border-r border-black/25" : ""}`}
            >
              {DIGITS.map((d) => (
                <div
                  key={d}
                  data-omr-bubble="1"
                  data-omr-block={blockName}
                  data-omr-label={`${labelPrefix}${colIdx + 1}`}
                  data-omr-value={String(d)}
                  data-omr-dir="vertical"
                  className="rounded-full border-[1.3px] border-black bg-white flex items-center justify-center font-bold text-black leading-none"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    fontSize: compact ? 8.5 : 9.5,
                  }}
                >
                  {isBangla ? toBengaliNumerals(d) : d}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Vertical Set Code block (crisp B&W)
  const renderSetCodeGrid = (compact = false) => {
    const cellSize = compact ? 15 : 18;
    return (
      <div className="border-[1.4px] border-black bg-white flex flex-col shrink-0" style={{ minWidth: compact ? 42 : 48 }}>
        <div className="bg-black text-white text-center font-bold py-0.5 px-1 text-[9px] leading-tight">
          {isBangla ? "সেট কোড" : "SET"}
        </div>
        <div
          className="border-b-[1.2px] border-black bg-white flex items-center justify-center font-black text-[11px] text-black"
          style={{ height: compact ? 18 : 21 }}
        >
          {cleanSet}
        </div>
        <div className="flex-1 flex flex-col items-center justify-around py-1 bg-neutral-100 gap-1">
          {setOptions.map((s) => (
            <div
              key={s}
              data-omr-bubble="1"
              data-omr-block="SetCode"
              data-omr-label="Set"
              data-omr-value={s}
              data-omr-dir="vertical"
              className="rounded-full border-[1.3px] border-black bg-white flex items-center justify-center font-bold text-black leading-none"
              style={{ width: cellSize, height: cellSize, fontSize: 9.5 }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render a single MCQ Column (crisp B&W alternating row stripes, 4 or 5 options)
  const renderQuestionColumn = (colIdx: number) => {
    const startQ = colIdx * qPerCol + 1;
    const endQ = Math.min(actualMcqCount, (colIdx + 1) * qPerCol);
    if (startQ > actualMcqCount) return null;

    const bubbleDim = isSplitLayout
      ? optCount === 5
        ? 18
        : 20
      : optCount === 5
      ? 15
      : 17;

    return (
      <div key={colIdx} className="border-[1.4px] border-black bg-white flex flex-col h-full">
        {/* Column Header */}
        <div className="flex items-center bg-black text-white text-[9.5px] font-bold py-1 px-1.5">
          <div className="w-7 text-center border-r border-white/30 pr-1">
            {isBangla ? "প্রশ্ন" : "Q#"}
          </div>
          <div className="flex-1 text-center">{isBangla ? "উত্তর (সঠিক বৃত্ত ভরাট করুন)" : "ANSWERS"}</div>
        </div>
        {/* Question Rows */}
        <div className="flex-1 flex flex-col justify-between">
          {Array.from({ length: endQ - startQ + 1 }).map((_, idx) => {
            const qNum = startQ + idx;
            const isStripe = idx % 2 === 0;
            return (
              <div
                key={qNum}
                className={`flex items-center px-1.5 py-[1.5px] ${
                  isStripe ? "bg-neutral-100" : "bg-white"
                } ${idx % 5 === 4 && qNum < endQ ? "border-b border-black/30" : ""}`}
              >
                <div className="w-7 text-center font-extrabold text-[11px] text-black border-r border-black/25 pr-1 leading-none">
                  {isBangla ? toBengaliNumerals(qNum) : qNum}
                </div>
                <div className="flex-1 flex items-center justify-around pl-1">
                  {activeOptions.map((opt) => (
                    <div
                      key={opt}
                      data-omr-bubble="1"
                      data-omr-block={`Questions_Col${colIdx + 1}`}
                      data-omr-label={`q${qNum}`}
                      data-omr-value={opt}
                      data-omr-dir="horizontal"
                      className="rounded-full border-[1.4px] border-black bg-white flex items-center justify-center font-bold text-black leading-none"
                      style={{
                        width: bubbleDim,
                        height: bubbleDim,
                        fontSize: bubbleDim <= 16 ? 8.5 : 9.5,
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={sheetRef}
      className="relative bg-white text-black mx-auto overflow-hidden select-none"
      style={{
        fontFamily,
        width: "210mm",
        height: "297mm",
        maxWidth: "210mm",
        maxHeight: "297mm",
        padding: "11mm 11mm 10mm 11mm",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      {/* 4 Symmetric High-Contrast Solid Pro Bullseye Fiducials */}
      <SolidProFiducial id="TL" className="top-[8px] left-[8px]" />
      <SolidProFiducial id="TR" className="top-[8px] right-[8px]" />
      <SolidProFiducial id="BL" className="bottom-[8px] left-[8px]" />
      <SolidProFiducial id="BR" className="bottom-[8px] right-[8px]" />

      {/* Continuous Left & Right Lateral Optical Timing Tracks */}
      <div className="absolute left-[10px] top-[90px] bottom-[60px] w-[10px] flex flex-col justify-between items-center pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-[10px] h-[3.5px] bg-black" />
        ))}
      </div>
      <div className="absolute right-[10px] top-[90px] bottom-[60px] w-[10px] flex flex-col justify-between items-center pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="w-[10px] h-[3.5px] bg-black" />
        ))}
      </div>

      {/* HEADER: Official Board Monochrome Layout */}
      <header className="relative border-b-[1.8px] border-black pb-2 mb-2 px-2">
        {/* Top-Left Institute Logo (Grayscale B&W) */}
        {logoUrl && !hideInstitute && (
          <div className="absolute left-1 top-0 w-[48px] h-[48px] border border-black/30 rounded bg-white p-0.5 flex items-center justify-center">
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-full max-h-full object-contain grayscale contrast-125"
            />
          </div>
        )}

        {/* Top-Right Universal OMR QR Badge */}
        <div className="absolute right-1 top-0 border-[1.3px] border-black bg-white p-1 rounded-sm text-center">
          <QRCode value={qrPayloadString} size={46} level="M" />
          <div className="text-[7.5px] font-mono font-bold text-black mt-0.5 leading-none">
            SET-{cleanSet}
          </div>
        </div>

        <div className="text-center px-14">
          {!hideInstitute && instituteName && (
            <div className="text-[15px] font-black tracking-tight text-black leading-tight">
              {instituteName}
            </div>
          )}
          {!hideInstitute && schoolAddress && (
            <div className="text-[8.5px] font-semibold text-neutral-700 leading-tight">
              {schoolAddress}
            </div>
          )}
          <div className="text-[13px] font-extrabold text-black mt-0.5 leading-tight underline decoration-black/70 underline-offset-2">
            {examTitle || (isBangla ? "নৈর্ব্যক্তিক অভীক্ষার উত্তরপত্র" : "OMR ANSWER SHEET")}
          </div>

          {/* Crisp B&W Instruction Pill */}
          <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
            <span className="bg-black text-white px-2.5 py-0.5 text-[8.5px] font-bold rounded-xs">
              {isBangla
                ? "অবশ্যই কালো বল-পয়েন্ট কলম দিয়ে বৃত্ত সম্পূর্ণ ভরাট করতে হবে"
                : "USE BLACK BALLPOINT PEN ONLY — DARKEN CIRCLES COMPLETELY"}
            </span>
          </div>

          {/* Metadata Strip */}
          <div className="mt-1.5 flex items-center justify-between border border-black bg-neutral-100 px-2 py-0.5 text-[9px] font-bold text-black">
            <span>
              {isBangla ? "বিষয়:" : "Subject:"} {subjectName || ".................."}
            </span>
            <span>
              {isBangla ? "সেট:" : "Set:"} {cleanSet}
            </span>
            {objectiveTime && objectiveTime > 0 ? (
              <span>
                {isBangla ? "সময়:" : "Time:"} {formatBengaliDuration(objectiveTime)}
              </span>
            ) : null}
            <span>
              {isBangla ? "তারিখ:" : "Date:"} {examDate ? toBengaliNumerals(examDate) : "............"}
            </span>
            <span>
              {isBangla ? "প্রশ্ন:" : "MCQs:"} {isBangla ? toBengaliNumerals(actualMcqCount) : actualMcqCount}
            </span>
          </div>
        </div>
      </header>

      {/* BODY: Split Board Layout (<=50Q) OR Stacked Admission Layout (>50Q) */}
      {isSplitLayout ? (
        <div className="flex-1 grid grid-cols-12 gap-2.5 min-h-0 px-2">
          {/* Left Side: Questions Columns */}
          <div
            className="col-span-6 grid gap-2 h-full"
            style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}
          >
            {Array.from({ length: numColumns }).map((_, c) => renderQuestionColumn(c))}
          </div>

          {/* Right Side: Roll, Set, Registration, Subject Code, Signatures & Rules */}
          <div className="col-span-6 flex flex-col justify-between gap-2 h-full">
            {/* Top Row: Roll + Set + Invigilator Sign */}
            <div className="flex items-stretch gap-1.5">
              <div className="flex-1">
                {renderDigitGrid(isBangla ? "রোল নম্বর (ROLL)" : "ROLL NUMBER", "Roll", "roll", rollDigits)}
              </div>
              {renderSetCodeGrid()}
              <div className="w-[82px] flex flex-col justify-between gap-1.5">
                <div className="flex-1 border-[1.3px] border-black bg-white flex flex-col justify-end p-1">
                  <span className="text-[7.5px] font-bold text-center border-t border-black/40 pt-0.5">
                    {isBangla ? "কক্ষ পরিদর্শকের স্বাক্ষর" : "Invigilator Sign"}
                  </span>
                </div>
                <div className="h-[52px] border-[1.3px] border-black bg-white flex flex-col justify-end p-1">
                  <span className="text-[7.5px] font-bold text-center border-t border-black/40 pt-0.5">
                    {isBangla ? "তারিখ" : "Date"}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Row: 10-Digit Registration + 3-Digit Subject Code */}
            <div className="flex items-stretch gap-1.5">
              <div className="flex-1">
                {renderDigitGrid(
                  isBangla ? "রেজিস্ট্রেশন নম্বর (REG)" : "REGISTRATION NO",
                  "Reg",
                  "reg",
                  regDigits
                )}
              </div>
              <div className="w-[74px]">
                {renderDigitGrid(isBangla ? "বিষয় কোড" : "SUB CODE", "SubjectCode", "sub", 3)}
              </div>
            </div>

            {/* Candidate Signature & Serial Strip */}
            <div className="flex items-stretch gap-2">
              <div className="flex-1 border-[1.3px] border-black bg-white h-[44px] flex flex-col justify-end p-1">
                <span className="text-[8px] font-bold text-center border-t border-black/40 pt-0.5">
                  {isBangla ? "পরীক্ষার্থীর পূর্ণ স্বাক্ষর ও তারিখ" : "Candidate's Full Signature & Date"}
                </span>
              </div>
              <div className="w-[125px] border-[1.3px] border-black bg-neutral-100 p-1 flex flex-col justify-center items-center">
                <span className="text-[7.5px] font-bold uppercase tracking-wider">OMR SERIAL ID</span>
                <span className="text-[10px] font-mono font-black tracking-tight">
                  {(uniqueCode || "OMR2026001").slice(0, 12).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Official Board Monochrome Fill Rules */}
            <div className="border-[1.4px] border-black bg-white p-2 text-[8.5px] leading-snug">
              <div className="text-center font-black border-b border-black pb-0.5 mb-1 text-[9.5px]">
                {isBangla ? "বৃত্ত ভরাটের নিয়মাবলী (ভুল হলে উত্তর বাতিল হবে)" : "IMPORTANT MARKING INSTRUCTIONS"}
              </div>
              <div className="flex items-center justify-between bg-neutral-100 border border-black/30 px-2 py-1 mb-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{isBangla ? "সঠিক পদ্ধতি:" : "CORRECT:"}</span>
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-black border border-black" />
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{isBangla ? "ভুল পদ্ধতি:" : "WRONG:"}</span>
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-black text-[8px]">•</span>
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-black text-[8px]">✔</span>
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-black text-[8px]">✖</span>
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-black text-[8px]">◐</span>
                </div>
              </div>
              <ol className="list-decimal pl-3.5 space-y-0.5 font-medium text-neutral-900">
                <li>{isBangla ? "রোল নম্বর, রেজিস্ট্রেশন নম্বর ও সেট কোড সঠিকভাবে ইংরেজি/বাংলা সংখ্যায় লিখে নিচের বৃত্ত ভরাট করুন।" : "Write Roll, Registration & Set Code accurately and darken bubbles completely."}</li>
                <li>{isBangla ? "এক প্রশ্নে একাধিক বৃত্ত ভরাট করলে বা ঘষাঘষি করলে উত্তর বাতিল গণ্য হবে।" : "Multiple marks or incomplete erasures invalidate the answer."}</li>
                <li>{isBangla ? "উত্তরপত্র ভাঁজ করবেন না এবং নির্ধারিত স্থান ব্যতীত কোনো দাগ দেবেন না।" : "Do not fold, staple, or make stray marks outside the bubbles."}</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        /* Stacked Monochrome Admission Layout (60–100 Questions) */
        <div className="flex-1 flex flex-col gap-2 min-h-0 px-2">
          {/* Top Identification Band */}
          <div className="flex items-stretch gap-1.5">
            {renderDigitGrid(isBangla ? "রোল নম্বর" : "ROLL NO", "Roll", "roll", rollDigits, true)}
            {renderSetCodeGrid(true)}
            {renderDigitGrid(isBangla ? "রেজিস্ট্রেশন নম্বর" : "REGISTRATION NO", "Reg", "reg", regDigits, true)}
            <div className="flex-1 flex flex-col justify-between gap-1.5">
              <div className="border-[1.3px] border-black p-1.5 bg-neutral-100 text-[8px] font-bold leading-tight">
                <div>{isBangla ? "সঠিক: ●  |  ভুল: ⊙ ✔ ✖ ◐" : "CORRECT: ● | WRONG: ⊙ ✔ ✖"}</div>
                <div className="mt-0.5 font-normal">
                  {isBangla ? "কালো বলপেন ব্যবহার করুন। শিট ভাঁজ করবেন না।" : "Use black ballpoint pen. Do not fold."}
                </div>
              </div>
              <div className="flex-1 border-[1.3px] border-black bg-white flex flex-col justify-end p-1">
                <span className="text-[7.5px] font-bold text-center border-t border-black/40 pt-0.5">
                  {isBangla ? "কক্ষ পরিদর্শকের স্বাক্ষর" : "Invigilator Signature"}
                </span>
              </div>
              <div className="flex-1 border-[1.3px] border-black bg-white flex flex-col justify-end p-1">
                <span className="text-[7.5px] font-bold text-center border-t border-black/40 pt-0.5">
                  {isBangla ? "পরীক্ষার্থীর স্বাক্ষর" : "Candidate Signature"}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Full-Width MCQ Matrix (3 or 4 Columns) */}
          <div
            className="flex-1 grid gap-2 min-h-0"
            style={{ gridTemplateColumns: `repeat(${numColumns}, 1fr)` }}
          >
            {Array.from({ length: numColumns }).map((_, c) => renderQuestionColumn(c))}
          </div>
        </div>
      )}

      {/* Bottom Center Optical Registration Sync Bar */}
      <div className="mt-1.5 flex justify-center">
        <div className="w-16 h-[3.5px] bg-black" />
      </div>
    </div>
  );
};

export default OMRSheet;
