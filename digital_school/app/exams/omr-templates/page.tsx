"use client";

import React, { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  ScanLine,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  Sliders,
  Layers,
  Search,
  Eye,
  Code2,
  Copy,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Cpu,
  QrCode,
  FileJson,
  Filter,
} from 'lucide-react';
import { BangladeshOMRGenerator, type PresetType } from '@/app/components/omr/BangladeshOMRGenerator';
import { PRESET_TEMPLATES } from '@/lib/omr/presetTemplates';
import { parseTemplate } from '@/lib/omr/templateParser';
import type { Template } from '@/lib/omr/types';

interface TemplateCatalogItem {
  id: PresetType;
  scannerPresetId: string;
  category: 'board' | 'admission' | 'cq' | 'model';
  categoryLabel: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  badge: string;
  accent: {
    pill: string;
    border: string;
    ink: string;
    inkLight: string;
    dot: string;
  };
  themeLabel: string;
  description: string;
  specs: { label: string; value: string }[];
  features: string[];
  recommendedFor: string;
}

const OFFICIAL_TEMPLATES: TemplateCatalogItem[] = [
  {
    id: 'board_cq_3part',
    scannerPresetId: 'bangladesh_board_cq_top_sheet',
    category: 'cq',
    categoryLabel: 'সৃজনশীল CQ কভার',
    title: 'বোর্ড সৃজনশীল (CQ) ৩-খণ্ড ওএমআর কভার',
    englishTitle: 'Bangladesh Board CQ 3-Part Cover Sheet',
    subtitle: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ডের অফিসিয়াল সৃজনশীল টপশিট',
    badge: 'বোর্ড CQ স্ট্যান্ডার্ড',
    accent: {
      pill: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
      border: 'hover:border-pink-500/50',
      ink: '#be185d',
      inkLight: '#fce7f3',
      dot: 'bg-pink-500',
    },
    themeLabel: 'ম্যাজেন্টা পিঙ্ক',
    description:
      '৩-খণ্ড পারফোরেটেড লেআউট: পরীক্ষার্থীর অংশ (রোল ৬, রেজি ১০, বিষয় কোড ৩), পরীক্ষকের ৩-ডিজিট প্রাপ্ত নম্বর ওএমআর এবং ২০টি CQ প্রশ্ন টেবিল।',
    specs: [
      { label: 'ফরম্যাট', value: '৩-খণ্ড পারফোরেটেড' },
      { label: 'আইডি বাবলস', value: 'রোল ৬ + রেজি ১০' },
      { label: 'পরীক্ষক নম্বর', value: '৩-ডিজিট OMR' },
      { label: 'সিকিউরিটি', value: 'QR + ৪-কোণা ফিডুসিয়াল' },
    ],
    features: [
      'কাঁচির দাগে (✂) ৩টি অংশ আলাদা করার নিখুঁত পারফোরেশন লাইন',
      'পরীক্ষক ও প্রধান পরীক্ষকের প্রাপ্ত নম্বর ৩-ডিজিট ওএমআর বাবল',
      'অটো-কালার ড্রপআউট (ম্যাজেন্টা) সহ মোবাইল ক্যামেরায় ১০০% ডিকোডিং',
    ],
    recommendedFor: 'SSC, HSC, প্রি-টেস্ট ও টেস্ট সৃজনশীল পরীক্ষা',
  },
  {
    id: 'hsc_ssc_50',
    scannerPresetId: 'bangladesh_board_hsc',
    category: 'board',
    categoryLabel: 'বোর্ড MCQ',
    title: 'শিক্ষা বোর্ড নৈর্ব্যক্তিক (৫০ প্রশ্ন)',
    englishTitle: 'Bangladesh Board HSC / SSC 50-Q MCQ',
    subtitle: 'অফিসিয়াল এইচএসসি ও এসএসসি স্প্লিট ওএমআর উত্তরপত্র',
    badge: 'বোর্ড স্ট্যান্ডার্ড',
    accent: {
      pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      border: 'hover:border-rose-500/50',
      ink: '#e11d48',
      inkLight: '#ffe4e6',
      dot: 'bg-rose-500',
    },
    themeLabel: 'বোর্ড রোজ-পিঙ্ক',
    description:
      'রোল ৬-ডিজিট, রেজিস্ট্রেশন ১০-ডিজিট, বিষয় কোড ৩-ডিজিট এবং সেট কোড (ক, খ, গ, ঘ) সহ ২ কলাম ৫০ প্রশ্নের অফিসিয়াল স্প্লিট লেআউট।',
    specs: [
      { label: 'প্রশ্ন সংখ্যা', value: '৫০টি MCQ (২×২৫)' },
      { label: 'রোল ও রেজি', value: '৬ + ১০ ডিজিট' },
      { label: 'সেট ও বিষয়', value: 'ক-ঘ + ৩ ডিজিট' },
      { label: 'পেপার সাইজ', value: 'A4 (210×297 mm)' },
    ],
    features: [
      'খাঁটি NikoshBAN বাংলা টাইপোগ্রাফি ও বোর্ড ম্যাজেন্টা থিম',
      'রেড-চ্যানেল ড্রপআউট ইঞ্জিনে ঝাপসা ছবিতেও ১০০% রোল/রেজি/উত্তর পাঠ',
      '৪-কোণা অপটিক্যাল মার্কার + পরিদর্শকের স্বাক্ষর ও সীল বক্স',
    ],
    recommendedFor: 'স্কুল, কলেজ, HSC/SSC বোর্ড ও মডেল টেস্ট',
  },
  {
    id: 'medical_100',
    scannerPresetId: 'medical_admission_100q',
    category: 'admission',
    categoryLabel: 'মেডিকেল ভর্তি',
    title: 'মেডিকেল ও ডেন্টাল ভর্তি (১০০ প্রশ্ন)',
    englishTitle: 'DGHS Medical & Dental 100-Q Admission',
    subtitle: 'স্বাস্থ্য শিক্ষা অধিদপ্তর (DGHS) গোল্ড স্ট্যান্ডার্ড ফরম্যাট',
    badge: 'মেডিকেল গোল্ড',
    accent: {
      pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      border: 'hover:border-emerald-500/50',
      ink: '#059669',
      inkLight: '#d1fae5',
      dot: 'bg-emerald-500',
    },
    themeLabel: 'এমারেল্ড / ব্ল্যাক',
    description:
      '৭-ডিজিট রোল, ৬-ডিজিট সিরিয়াল, ক্যান্ডিডেট ডিক্লারেশন ও ১০০টি নৈর্ব্যক্তিক প্রশ্নের হাই-ডেনসিটি গ্রিড এবং নেগেটিভ মার্কিং স্ট্রিপ।',
    specs: [
      { label: 'প্রশ্ন সংখ্যা', value: '১০০টি MCQ' },
      { label: 'আইডি গ্রিড', value: '৭ রোল + ৬ সিরিয়াল' },
      { label: 'নেগেটিভ মার্ক', value: '-০.২৫ অটো-গ্রেডিং' },
      { label: 'স্ক্যান স্পিড', value: '~১১০ ms / শিট' },
    ],
    features: [
      'মাস্টার পিডিএফ ২-আপ স্প্রেড এবং সিঙ্গেল স্ক্যান উভয়ই সাপোর্ট করে',
      'অটো-ডিটেক্টেড ডাবল মার্ক ও অসম্পূর্ণ ইরেজার ফ্ল্যাগিং',
      'ক্যান্ডিডেট ও ইনভিজিলেটর ভেরিফিকেশন স্বাক্ষর বক্স',
    ],
    recommendedFor: 'MBBS, BDS, নার্সিং ও মেডিকেল ভর্তি কোচিং',
  },
  {
    id: 'du_admission',
    scannerPresetId: 'medical_admission_100q',
    category: 'admission',
    categoryLabel: 'ভার্সিটি ভর্তি',
    title: 'ঢাকা বিশ্ববিদ্যালয় ও ইঞ্জিনিয়ারিং (৬০/১০০)',
    englishTitle: 'DU & Engineering Unit Admission OMR',
    subtitle: 'ঢাবি ক/খ/গ ইউনিট ও ইঞ্জিনিয়ারিং প্রিলি মাল্টি-কলাম লেআউট',
    badge: 'ভার্সিটি প্রিমিয়াম',
    accent: {
      pill: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      border: 'hover:border-sky-500/50',
      ink: '#0284c7',
      inkLight: '#e0f2fe',
      dot: 'bg-sky-500',
    },
    themeLabel: 'রয়্যাল নেভি ব্লু',
    description:
      'বিষয়ভিত্তিক (পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান) কলাম বিন্যাস, ৭-ডিজিট রোল, সেট কোড (A-D) এবং নেগেটিভ মার্কিং সতর্কতা।',
    specs: [
      { label: 'প্রশ্ন সংখ্যা', value: '৬০ / ১০০টি MCQ' },
      { label: 'লেআউট', value: '৩ বা ৪ কলাম গ্রিড' },
      { label: 'রোল ও সেট', value: '৭ ডিজিট + A-D' },
      { label: 'নেগেটিভ মার্ক', value: '-০.২৫ কর্তন' },
    ],
    features: [
      'বিষয়ভিত্তিক আলাদা সেকশন স্কোরিং ও অ্যানালিটিক্স সাপোর্ট',
      'হাই-কনট্রাস্ট ব্লু প্রিন্ট ও অটো-ডেস্কেউ ক্যামেরা ট্র্যাকিং',
      'QR কোডে স্বয়ংক্রিয় পরীক্ষা ও সেট সনাক্তকরণ',
    ],
    recommendedFor: 'ঢাবি, রাবি, চবি, জাবি ও বুয়েট প্রিলি টেস্ট',
  },
  {
    id: 'gst_cluster',
    scannerPresetId: 'medical_admission_100q',
    category: 'admission',
    categoryLabel: 'গুচ্ছ ভর্তি',
    title: 'GST সাধারণ ও বিজ্ঞান প্রযুক্তি গুচ্ছ (১০০)',
    englishTitle: 'GST Integrated Cluster 100-Q OMR',
    subtitle: '২৪টি বিশ্ববিদ্যালয়ের সমন্বিত ভর্তি পরীক্ষার স্ট্যান্ডার্ড শিট',
    badge: 'GST গুচ্ছ',
    accent: {
      pill: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      border: 'hover:border-indigo-500/50',
      ink: '#4f46e5',
      inkLight: '#e0e7ff',
      dot: 'bg-indigo-500',
    },
    themeLabel: 'ইন্ডিগো ভায়োলেট',
    description:
      '৪ কলাম × ২৫ প্রশ্নের সুবিন্যস্ত ১০০ প্রশ্নের গুচ্ছ ওএমআর শিট, ৬-৮ ডিজিট রোল, সেট কোড ও কম্প্যাক্ট স্পেস অপ্টিমাইজেশন।',
    specs: [
      { label: 'প্রশ্ন সংখ্যা', value: '১০০টি (৪×২৫)' },
      { label: 'রোল ডিজিট', value: '৬-৮ ডিজিট' },
      { label: 'বারকোড / QR', value: 'অটো-লিঙ্কড' },
      { label: 'স্ক্যান মাধ্যম', value: 'ফোন + স্ক্যানার' },
    ],
    features: [
      '২৪টি গুচ্ছ বিশ্ববিদ্যালয়ের প্রচলিত ৪-সেকশন আর্কিটেকচার',
      'ব্যাচ আপলোড ও হ্যান্ডস-ফ্রি কন্টিনিউয়াস ক্যামেরা স্ক্যান',
      'সাধারণ সাদা A4 কাগজে নিখুঁত মার্জিন অ্যালাইনমেন্ট',
    ],
    recommendedFor: 'GST গুচ্ছ ও কৃষি গুচ্ছ ভর্তি প্রস্তুতি',
  },
  {
    id: 'hsc_ssc_25',
    scannerPresetId: 'bangladesh_board_hsc',
    category: 'model',
    categoryLabel: 'দ্রুত কুইজ',
    title: 'মডেল টেস্ট ও স্পিড কুইজ (২৫ প্রশ্ন)',
    englishTitle: 'Compact Classroom Speed Quiz (25-Q)',
    subtitle: 'ক্লাসরুম কুইজ, উইকলি টেস্ট ও কালি-সাশ্রয়ী কম্প্যাক্ট ওএমআর',
    badge: 'হাই-স্পিড',
    accent: {
      pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      border: 'hover:border-amber-500/50',
      ink: '#d97706',
      inkLight: '#fef3c7',
      dot: 'bg-amber-500',
    },
    themeLabel: 'অ্যাম্বার / গ্রিন',
    description:
      'দ্রুত প্রিন্ট ও কম কালিতে ফটোকপি উপযোগী ২৫ প্রশ্নের কম্প্যাক্ট ওএমআর। ক্লাসরুমে তাৎক্ষণিক মোবাইল স্ক্যানে ২ সেকেন্ডে রেজাল্ট।',
    specs: [
      { label: 'প্রশ্ন সংখ্যা', value: '২৫টি MCQ' },
      { label: 'কালি সাশ্রয়', value: '৭০% কম কালি' },
      { label: 'রোল ডিজিট', value: '৬ ডিজিট' },
      { label: 'স্ক্যান স্পিড', value: '< ৯০ ms / শিট' },
    ],
    features: [
      'ফটোকপি ও সাধারণ লেজার প্রিন্টারেও ১০০% বাবল কনট্রাস্ট',
      'ডেইলি কুইজ, উইকলি মডেল টেস্ট ও স্পেশাল ব্যাচের জন্য সেরা',
      'তাৎক্ষণিক র‍্যাংকিং ও স্টুডেন্ট ড্যাশবোর্ডে রেজাল্ট সিঙ্ক',
    ],
    recommendedFor: 'সাপ্তাহিক কুইজ, ক্লাস টেস্ট ও কোচিং ব্যাচ',
  },
];

/**
 * Crisp realistic white-paper A4 OMR blueprint preview with real corner fiducials,
 * QR badge, Roll/Reg bubble matrices, and question columns.
 */
function RealisticPaperPreview({ item }: { item: TemplateCatalogItem }) {
  const ink = item.accent.ink;
  const inkLight = item.accent.inkLight;

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 p-3 border border-slate-800 flex items-center justify-center overflow-hidden">
      <div className="w-[168px] aspect-[210/297] bg-white rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.45)] ring-1 ring-slate-200/80 relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.03] group-hover:-translate-y-0.5">
        <svg viewBox="0 0 210 297" className="w-full h-full">
          {/* 4 Corner Optical Fiducial Squares */}
          <rect x="7" y="7" width="8" height="8" fill="#0f172a" />
          <rect x="195" y="7" width="8" height="8" fill="#0f172a" />
          <rect x="7" y="282" width="8" height="8" fill="#0f172a" />
          <rect x="195" y="282" width="8" height="8" fill="#0f172a" />

          {/* Sheet Border */}
          <rect x="18" y="10" width="174" height="277" fill="none" stroke={ink} strokeWidth="0.9" rx="1.5" />

          {/* Header Bar */}
          <rect x="21" y="13" width="144" height="16" fill={inkLight} rx="1" />
          <rect x="34" y="16.5" width="118" height="3.2" fill={ink} rx="1" />
          <rect x="52" y="22.5" width="82" height="2" fill={ink} opacity="0.55" rx="1" />

          {/* QR Code Corner Box */}
          <rect x="169" y="13" width="19" height="19" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.7" rx="1" />
          <rect x="171.5" y="15.5" width="5" height="5" fill="#0f172a" />
          <rect x="180.5" y="15.5" width="5" height="5" fill="#0f172a" />
          <rect x="171.5" y="24.5" width="5" height="5" fill="#0f172a" />
          <rect x="178.5" y="22.5" width="3" height="3" fill="#0f172a" />
          <rect x="183" y="25.5" width="2.5" height="3.5" fill="#0f172a" />

          {item.id === 'board_cq_3part' ? (
            <>
              {/* Part 1: Student Roll/Reg */}
              <rect x="22" y="36" width="166" height="66" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="22" y="36" width="166" height="6" fill={ink} opacity="0.85" />
              {Array.from({ length: 12 }).map((_, col) =>
                Array.from({ length: 7 }).map((__, row) => (
                  <circle
                    key={`p1-${col}-${row}`}
                    cx={29 + col * 10.5}
                    cy={48 + row * 7.2}
                    r="2.2"
                    fill={(col + row) % 5 === 0 ? '#0f172a' : 'none'}
                    stroke={ink}
                    strokeWidth="0.55"
                  />
                ))
              )}
              <rect x="155" y="45" width="29" height="52" fill={inkLight} opacity="0.55" stroke={ink} strokeWidth="0.4" />

              {/* Perforation 1 */}
              <line x1="12" y1="108" x2="198" y2="108" stroke={ink} strokeWidth="0.9" strokeDasharray="3 2.5" />

              {/* Part 2: Examiner Marks OMR */}
              <rect x="22" y="114" width="166" height="68" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="22" y="114" width="166" height="6" fill={ink} opacity="0.85" />
              {Array.from({ length: 9 }).map((_, col) =>
                Array.from({ length: 7 }).map((__, row) => (
                  <circle
                    key={`p2-${col}-${row}`}
                    cx={30 + col * 11.5}
                    cy={126 + row * 7.5}
                    r="2.2"
                    fill={(col * 2 + row) % 6 === 1 ? '#0f172a' : 'none'}
                    stroke={ink}
                    strokeWidth="0.55"
                  />
                ))
              )}
              <rect x="135" y="124" width="49" height="52" fill={inkLight} opacity="0.45" stroke={ink} strokeWidth="0.4" />

              {/* Perforation 2 */}
              <line x1="12" y1="188" x2="198" y2="188" stroke={ink} strokeWidth="0.9" strokeDasharray="3 2.5" />

              {/* Part 3: 20-CQ Score Grid */}
              <rect x="22" y="194" width="166" height="86" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="22" y="194" width="166" height="6" fill={ink} opacity="0.85" />
              {Array.from({ length: 6 }).map((_, r) => (
                <line key={`g3r-${r}`} x1="22" y1={208 + r * 12} x2="188" y2={208 + r * 12} stroke={ink} strokeWidth="0.4" opacity="0.5" />
              ))}
              {Array.from({ length: 5 }).map((_, c) => (
                <line key={`g3c-${c}`} x1={50 + c * 28} y1="200" x2={50 + c * 28} y2="280" stroke={ink} strokeWidth="0.4" opacity="0.5" />
              ))}
            </>
          ) : item.id === 'hsc_ssc_50' ? (
            <>
              {/* Split Board Layout: Left 2 MCQ cols, Right Roll + Reg */}
              <rect x="22" y="36" width="84" height="244" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="22" y="36" width="84" height="6" fill={ink} opacity="0.85" />
              {[0, 1].map((colBlock) =>
                Array.from({ length: 20 }).map((_, r) =>
                  [0, 1, 2, 3].map((opt) => (
                    <circle
                      key={`hq-${colBlock}-${r}-${opt}`}
                      cx={29 + colBlock * 41 + opt * 7.5}
                      cy={48 + r * 11.4}
                      r="2.1"
                      fill={(r + colBlock * 2) % 4 === opt ? '#0f172a' : 'none'}
                      stroke={ink}
                      strokeWidth="0.5"
                    />
                  ))
                )
              )}

              {/* Right Side: Roll (6) + Reg (10) */}
              <rect x="110" y="36" width="78" height="98" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="110" y="36" width="78" height="6" fill={ink} opacity="0.85" />
              {Array.from({ length: 6 }).map((_, col) =>
                Array.from({ length: 10 }).map((__, row) => (
                  <circle
                    key={`hr-${col}-${row}`}
                    cx={119 + col * 11.5}
                    cy={49 + row * 8.4}
                    r="2.2"
                    fill={(col + 1) % 10 === row ? '#0f172a' : 'none'}
                    stroke={ink}
                    strokeWidth="0.5"
                  />
                ))
              )}

              <rect x="110" y="140" width="78" height="104" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="110" y="140" width="78" height="6" fill={ink} opacity="0.85" />
              {Array.from({ length: 9 }).map((_, col) =>
                Array.from({ length: 10 }).map((__, row) => (
                  <circle
                    key={`hreg-${col}-${row}`}
                    cx={116 + col * 8.2}
                    cy={153 + row * 8.8}
                    r="1.9"
                    fill={(col * 3 + 2) % 10 === row ? '#0f172a' : 'none'}
                    stroke={ink}
                    strokeWidth="0.45"
                  />
                ))
              )}
              <rect x="110" y="250" width="78" height="30" fill={inkLight} opacity="0.45" stroke={ink} strokeWidth="0.5" rx="1" />
            </>
          ) : (
            <>
              {/* Stacked Admission / Quiz Layout: Top Roll & Info + Bottom Multi-Col MCQs */}
              <rect x="22" y="36" width="88" height="72" fill="none" stroke={ink} strokeWidth="0.6" rx="1" />
              <rect x="22" y="36" width="88" height="5.5" fill={ink} opacity="0.85" />
              {Array.from({ length: 7 }).map((_, col) =>
                Array.from({ length: 8 }).map((__, row) => (
                  <circle
                    key={`ar-${col}-${row}`}
                    cx={30 + col * 11.5}
                    cy={48 + row * 7.6}
                    r="2.1"
                    fill={(col + 2) % 8 === row ? '#0f172a' : 'none'}
                    stroke={ink}
                    strokeWidth="0.5"
                  />
                ))
              )}
              <rect x="114" y="36" width="74" height="72" fill={inkLight} opacity="0.35" stroke={ink} strokeWidth="0.5" rx="1" />
              <rect x="120" y="45" width="60" height="3" fill={ink} opacity="0.5" rx="1" />
              <rect x="120" y="54" width="52" height="2.2" fill="#64748b" opacity="0.4" rx="1" />
              <rect x="120" y="62" width="56" height="2.2" fill="#64748b" opacity="0.4" rx="1" />
              <rect x="120" y="76" width="60" height="24" fill="#ffffff" stroke={ink} strokeWidth="0.4" rx="1" />

              {/* Multi-column MCQ Grid */}
              {(item.id === 'hsc_ssc_25' ? [0, 1] : [0, 1, 2, 3]).map((colBlock, _, arr) => {
                const colW = arr.length === 2 ? 80 : 39;
                const gap = arr.length === 2 ? 6 : 3.3;
                const x0 = 22 + colBlock * (colW + gap);
                const optGap = arr.length === 2 ? 12 : 7.2;
                const startX = x0 + (arr.length === 2 ? 18 : 8.5);
                return (
                  <g key={`ac-${colBlock}`}>
                    <rect x={x0} y="114" width={colW} height="156" fill="none" stroke={ink} strokeWidth="0.55" rx="1" />
                    <rect x={x0} y="114" width={colW} height="5" fill={ink} opacity="0.85" />
                    {Array.from({ length: 15 }).map((__, r) =>
                      [0, 1, 2, 3].map((opt) => (
                        <circle
                          key={`aq-${colBlock}-${r}-${opt}`}
                          cx={startX + opt * optGap}
                          cy={125 + r * 9.5}
                          r={arr.length === 2 ? '2.5' : '1.9'}
                          fill={(r + colBlock) % 4 === opt ? '#0f172a' : 'none'}
                          stroke={ink}
                          strokeWidth="0.45"
                        />
                      ))
                    )}
                  </g>
                );
              })}

              {/* Footer Strip */}
              <rect x="22" y="274" width="166" height="9" fill={inkLight} rx="1" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

export default function OMRTemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'gallery' | 'studio'>('gallery');
  const [activePreset, setActivePreset] = useState<PresetType>('hsc_ssc_50');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'board' | 'admission' | 'cq' | 'model'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectingItem, setInspectingItem] = useState<TemplateCatalogItem | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return OFFICIAL_TEMPLATES.filter((tpl) => {
      const catMatch = categoryFilter === 'all' || tpl.category === categoryFilter;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.englishTitle.toLowerCase().includes(q) ||
        tpl.subtitle.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.recommendedFor.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, searchQuery]);

  const handleLaunchStudio = (preset: PresetType) => {
    setActivePreset(preset);
    setActiveTab('studio');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUseInScanner = (scannerPresetId: string, customTemplate?: Template) => {
    if (typeof window !== 'undefined') {
      if (customTemplate) {
        localStorage.setItem('rofaz_active_omr_template', JSON.stringify(customTemplate));
        router.push('/exams/omr-scan?preset=custom');
        return;
      }
      localStorage.removeItem('rofaz_active_omr_template');
      router.push(`/exams/omr-scan?preset=${encodeURIComponent(scannerPresetId)}`);
    }
  };

  const getSchemaForItem = (item: TemplateCatalogItem): Template => {
    const found = PRESET_TEMPLATES.find((p) => p.id === item.scannerPresetId) || PRESET_TEMPLATES[0];
    return found.template;
  };

  const handleDownloadJson = (item: TemplateCatalogItem) => {
    const schema = getSchemaForItem(item);
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.id}_omr_template.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${item.id}_omr_template.json ডাউনলোড হয়েছে!`);
  };

  const handleCopyJson = async (item: TemplateCatalogItem) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(getSchemaForItem(item), null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      showToast('ক্লিপবোর্ডে কপি করা যায়নি');
    }
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedJson = JSON.parse(text);
      const { bubbles, template } = parseTemplate(parsedJson);
      localStorage.setItem('rofaz_active_omr_template', JSON.stringify(template));
      showToast(`কাস্টম টেমপ্লেট ইমপোর্ট সফল (${bubbles.length} বাবলস) — স্ক্যানারে চালু হচ্ছে...`);
      setTimeout(() => router.push('/exams/omr-scan?preset=custom'), 700);
    } catch (err: any) {
      showToast(`ত্রুটিপূর্ণ টেমপ্লেট JSON: ${err?.message || 'Invalid JSON'}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Sticky Navbar */}
      <header className="border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/exams"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition border border-slate-800 shrink-0"
              title="পরীক্ষা তালিকায় ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ScanLine className="w-4 h-4 text-indigo-400 shrink-0" />
                <h1 className="font-bold text-sm sm:text-base text-white truncate">
                  OMR টেমপ্লেট হাব ও লাইভ স্টুডিও
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  v3 ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">
                বাংলাদেশ শিক্ষা বোর্ড, মেডিকেল ও বিশ্ববিদ্যালয় স্ট্যান্ডার্ড ভেক্টর OMR ডিজাইন ও ১০০% নির্ভুল স্ক্যানার হ্যান্ডঅফ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportJsonFile}
            />
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hidden sm:flex items-center gap-1.5 transition cursor-pointer"
              title="কাস্টম JSON OMR টেমপ্লেট ইমপোর্ট করুন"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON ইমপোর্ট</span>
            </button>
            <Link
              href="/exams/omr-scan"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm shadow-emerald-600/30"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>OMR স্ক্যানার</span>
            </Link>
            <Link
              href="/exams/print"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/30"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">প্রিন্ট হাব</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative border-b border-slate-800/80 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.16),_transparent_65%)] px-4 sm:px-6 py-7 sm:py-9">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>প্রোডাকশন-গ্রেড OMR আর্কিটেকচার • কালার ড্রপআউট ও ভেক্টর প্রিন্ট</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              প্রিন্ট-রেডি অফিসিয়াল OMR টেমপ্লেট ও কাস্টম স্টুডিও
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
              যেকোনো টেমপ্লেট কাস্টমাইজ করুন, A4 ভেক্টর পিডিএফ প্রিন্ট নিন অথবা এক ক্লিকেই{' '}
              <strong className="text-white">স্মার্ট OMR v3 স্ক্যানারে</strong> চালু করুন। ঝাপসা, ছায়াযুক্ত কিংবা বাঁকা ফোন ছবিতেও রোল, রেজিস্ট্রেশন ও উত্তর বাবল ১০০% নির্ভুলভাবে পার্স হয়।
            </p>

            {/* Trust / Capability Badges */}
            <div className="mt-5 flex flex-wrap gap-2.5 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> 2-Level Grid Registration
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Auto Blur Deconvolution
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                <QrCode className="w-3.5 h-3.5 text-indigo-400" /> QR Auto-Exam & Set Sync
              </span>
            </div>
          </div>

          {/* Primary Segmented Switcher */}
          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="flex bg-slate-900/95 p-1.5 rounded-2xl border border-slate-800 shadow-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('gallery')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'gallery'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>টেমপ্লেট গ্যালারি</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'studio'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>লাইভ কাস্টম স্টুডিও</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              মোট {OFFICIAL_TEMPLATES.length} টি ভেরিফাইড A4 টেমপ্লেট • NikoshBAN ভেক্টর সাপোর্ট
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'gallery' ? (
          <div className="space-y-6">
            {/* Search + Category Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pl-1 pr-1 shrink-0">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> ক্যাটাগরি:
                </span>
                {[
                  { id: 'all', label: `সকল (${OFFICIAL_TEMPLATES.length})` },
                  { id: 'board', label: 'বোর্ড MCQ' },
                  { id: 'cq', label: 'সৃজনশীল ৩-খণ্ড CQ' },
                  { id: 'admission', label: 'মেডিকেল ও ভার্সিটি ভর্তি' },
                  { id: 'model', label: 'কুইজ ও মডেল টেস্ট' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="টেমপ্লেট খুঁজুন (HSC, Medical, CQ...)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Template Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-12 text-center">
                <p className="text-sm text-slate-300 font-semibold">কোনো টেমপ্লেট খুঁজে পাওয়া যায়নি</p>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((tpl) => (
                  <article
                    key={tpl.id}
                    className={`rounded-2xl bg-slate-900/90 border border-slate-800 ${tpl.accent.border} transition-all flex flex-col justify-between group shadow-lg hover:shadow-2xl hover:shadow-indigo-950/40 overflow-hidden`}
                  >
                    <div className="p-5 flex flex-col gap-4">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tpl.accent.pill}`}>
                          {tpl.badge}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <span className={`w-2 h-2 rounded-full ${tpl.accent.dot}`} />
                          <span>{tpl.themeLabel}</span>
                        </div>
                      </div>

                      {/* Realistic A4 Paper Blueprint */}
                      <RealisticPaperPreview item={tpl} />

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors leading-snug">
                          {tpl.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-indigo-400/90 mt-0.5">{tpl.subtitle}</p>
                        <p className="text-xs text-slate-300 leading-relaxed mt-2">{tpl.description}</p>
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/75 border border-slate-800/90 text-[11px]">
                        {tpl.specs.map((sp, i) => (
                          <div key={i} className="flex flex-col">
                            <span className="text-[10px] text-slate-400">{sp.label}</span>
                            <span className="font-bold text-slate-100 truncate">{sp.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Highlights */}
                      <ul className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        {tpl.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 pt-0 mt-auto">
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2.5">
                        <div className="text-[11px] text-slate-400 truncate">
                          উপযোগী: <span className="text-slate-200 font-medium">{tpl.recommendedFor}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleLaunchStudio(tpl.id)}
                            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm shadow-indigo-600/30"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>কাস্টমাইজ ও প্রিন্ট</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUseInScanner(tpl.scannerPresetId)}
                            className="py-2 px-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                            title="এই টেমপ্লেট দিয়ে সরাসরি OMR স্ক্যানার চালু করুন"
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>স্ক্যান</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInspectingItem(tpl)}
                            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/70 transition cursor-pointer"
                            title="স্কিমা ও JSON প্রিভিউ"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: LIVE CUSTOMIZATION STUDIO */
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>গ্যালারি</span>
                </button>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>লাইভ OMR ডিজাইন ও প্রিন্ট স্টুডিও</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    প্রতিষ্ঠানের নাম, রোল/রেজি ডিজিট, কলাম ও কালার কাস্টমাইজ করে সরাসরি প্রিন্ট বা স্ক্যানারে পাঠান
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'hsc_ssc_50', label: 'HSC/SSC ৫০' },
                  { id: 'board_cq_3part', label: 'CQ ৩-খণ্ড' },
                  { id: 'medical_100', label: 'মেডিকেল ১০০' },
                  { id: 'du_admission', label: 'ঢাবি ৬০/১০০' },
                  { id: 'gst_cluster', label: 'GST গুচ্ছ' },
                  { id: 'hsc_ssc_25', label: 'কুইজ ২৫' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePreset(p.id as PresetType)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activePreset === p.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-2xl">
              <BangladeshOMRGenerator
                key={activePreset}
                initialPreset={activePreset}
                hideTopHeader={true}
                onApplyGeneratedTemplate={(tpl) => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('rofaz_active_omr_template', JSON.stringify(tpl));
                    showToast('কাস্টম OMR টেমপ্লেট স্ক্যানারের জন্য সেভ হয়েছে!');
                  }
                }}
                onNavigateToScanner={() => {
                  router.push('/exams/omr-scan?preset=custom');
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Schema & Calibration Preview Modal */}
      {inspectingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectingItem(null)}
        >
          <div
            className="w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm sm:text-base text-white">{inspectingItem.title}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{inspectingItem.englishTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {(() => {
                const schema = getSchemaForItem(inspectingItem);
                const parsed = parseTemplate(schema);
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Page Dimensions</div>
                        <div className="font-bold text-white mt-0.5">
                          {schema.pageDimensions[0]} × {schema.pageDimensions[1]} px
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Bubble Size</div>
                        <div className="font-bold text-white mt-0.5">
                          {schema.bubbleDimensions[0]} × {schema.bubbleDimensions[1]} px
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Total Bubbles</div>
                        <div className="font-bold text-emerald-400 mt-0.5">{parsed.bubbles.length} bubbles</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-slate-400 text-[11px]">Field Blocks</div>
                        <div className="font-bold text-indigo-400 mt-0.5">
                          {Object.keys(schema.fieldBlocks).length} blocks
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
                      <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Scanner Calibration Schema (JSON)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyJson(inspectingItem)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadJson(inspectingItem)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-3.5 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-64">
                        {JSON.stringify(schema, null, 2)}
                      </pre>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = inspectingItem.id;
                  setInspectingItem(null);
                  handleLaunchStudio(id);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>স্টুডিওতে এডিট করুন</span>
              </button>
              <button
                type="button"
                onClick={() => handleUseInScanner(inspectingItem.scannerPresetId)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
              >
                <span>OMR স্ক্যানারে চালু করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-4 px-6 text-center text-xs text-slate-400">
        Rofaz Academy OMR v3 Studio • Bangladesh Board &amp; University Admission Precision Standard
      </footer>
    </div>
  );
}
