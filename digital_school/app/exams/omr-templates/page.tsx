"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  ScanLine,
  Printer,
  Download,
  CheckCircle2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Layers,
  FileText,
  Zap,
  Award,
  ChevronRight,
  BookOpen,
  Filter,
  Check,
  Maximize2
} from 'lucide-react';
import { BangladeshOMRGenerator, type PresetType } from '@/app/components/omr/BangladeshOMRGenerator';

export default function OMRTemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'gallery' | 'studio'>('gallery');
  const [activePreset, setActivePreset] = useState<PresetType>('board_cq_3part');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'board' | 'admission' | 'cq' | 'model'>('all');

  const officialTemplates = [
    {
      id: 'board_cq_3part' as PresetType,
      category: 'cq',
      categoryLabel: 'সৃজনশীল CQ কভার',
      title: 'বোর্ড সৃজনশীল (CQ) ৩-খণ্ড ওএমআর কভার পেজ',
      subtitle: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ডের অফিসিয়াল সৃজনশীল / রচনামূলক টপশিট',
      badge: 'বোর্ড CQ স্ট্যান্ডার্ড 📝',
      badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
      themeColor: 'magenta',
      themeLabel: 'অফিসিয়াল ম্যাজেন্টা পিঙ্ক',
      description: '৩-খণ্ড পারফোরেটেড বোর্ড লেআউট: পরীক্ষার্থীর অংশ (রোল, রেজি, বিষয় কোড), পরীক্ষকের অংশ (প্রাপ্ত নম্বর ৩-ডিজিট ওএমআর), এবং উত্তরপত্র অংশ (২০টি প্রশ্নের নম্বর টেবিল)।',
      specs: [
        { label: 'ফরম্যাট', value: '৩-খণ্ড পারফোরেটেড' },
        { label: 'প্রশ্ন ক্যাপাসিটি', value: '২০টি CQ প্রশ্ন টেবিল' },
        { label: 'পরীক্ষক মূল্যায়ন', value: '৩-ডিজিট ওএমআর বাবল' },
        { label: 'সিকিউরিটি', value: 'QR ও বারকোড ট্র্যাকিং' }
      ],
      features: [
        'কাঁচির চিহ্নে (✂️) ৩টি অংশ সহজে আলাদা করার পারফোরেশন সেপারেশন',
        'পরীক্ষক কর্তৃক প্রাপ্ত নম্বর ওএমআরে ৩-ডিজিট বাবল ভরাট সুবিধা',
        'মোবাইল ক্যামেরা ও অপটিক্যাল স্ক্যানারে তাৎক্ষণিক ডিকোডযোগ্য QR কোড',
        '৪-কোণা অপটিক্যাল ফিডুসিয়াল এবং পিঙ্ক সিঙ্ক ট্র্যাক'
      ],
      recommendedFor: 'এসএসসি, এইচএসসি, ডিআইবিএস ও টেস্ট/প্রি-টেস্ট সৃজনশীল পরীক্ষা'
    },
    {
      id: 'medical_100' as PresetType,
      category: 'admission',
      categoryLabel: 'মেডিকেল ভর্তি',
      title: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (১০০ প্রশ্ন)',
      subtitle: 'স্বাস্থ্য শিক্ষা অধিদপ্তর (DGHS) এর গোল্ড স্ট্যান্ডার্ড ২-কলাম ফরম্যাট',
      badge: 'মেডিকেল গোল্ড 🩺',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      themeColor: 'black',
      themeLabel: 'হাই-কনট্রাস্ট ব্ল্যাক',
      description: '৭-ডিজিট রোল, সিরিয়াল, ক্যান্ডিডেট ডিক্লারেশন বক্স, ২ কলাম ৫০-প্রশ্ন গ্রিড ও নিচের স্কোর সামারি স্ট্রিপ। ১০০% খাঁটি NikoshBAN ফন্টে তৈরি।',
      specs: [
        { label: 'প্রশ্ন সংখ্যা', value: '১০০টি নৈর্ব্যক্তিক' },
        { label: 'লেআউট', value: '২ কলাম × ৫০ প্রশ্ন' },
        { label: 'রোল ডিজিট', value: '৭-ডিজিট বাবলস' },
        { label: 'পেপার সাইজ', value: 'A4 (২১০×২৯৭ মিমি)' }
      ],
      features: [
        'ভুল দাগ ও নকল প্রতিরোধ বারকোড ও সিকিউরিটি মার্কিং',
        'ক্যান্ডিডেট ও ইনভিজিলেটর সিগনেচার ভেরিফিকেশন বক্স',
        'নিচের অংশে তাৎক্ষণিক স্কোর ও নেগেটিভ মার্কিং ক্যালকুলেশন স্ট্রিপ',
        'সাধারণ মোবাইল ক্যামেরা দিয়ে ৯৯.৯৯% নির্ভুল স্ক্যানিং'
      ],
      recommendedFor: 'মেডিকেল (MBBS), ডেন্টাল (BDS) ও নার্সিং ভর্তি কোচিং'
    },
    {
      id: 'hsc_ssc_50' as PresetType,
      category: 'board',
      categoryLabel: 'বোর্ড MCQ',
      title: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড (৫০ প্রশ্ন)',
      subtitle: 'অফিসিয়াল এইচএসসি ও এসএসসি পরীক্ষার স্প্লিট ওএমআর শিট',
      badge: 'বোর্ড স্ট্যান্ডার্ড 🎓',
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      themeColor: 'magenta',
      themeLabel: 'ম্যাজেন্টা পিঙ্ক',
      description: 'রোল ৬-ডিজিট, রেজি ১০-ডিজিট, বিষয় কোড ৩-ডিজিট এবং সেট ক, খ, গ, ঘ অপশন। পরিদর্শকের স্বাক্ষর, সীল ও নির্দেশনাবলী সহ স্প্লিট লেআউট।',
      specs: [
        { label: 'প্রশ্ন সংখ্যা', value: '৫০টি নৈর্ব্যক্তিক' },
        { label: 'লেআউট', value: 'টপ-ডাউন স্প্লিট আর্কিটেকচার' },
        { label: 'রেজিস্ট্রেশন', value: '১০-ডিজিট বাবল গ্রিড' },
        { label: 'সেট কোড', value: 'ক, খ, গ, ঘ অপশন' }
      ],
      features: [
        'বাংলাদেশ শিক্ষা বোর্ডের হুবহু ম্যাজেন্টা পিঙ্ক প্রিন্ট থিম',
        'রোল, রেজিস্ট্রেশন ও বিষয় কোডের জন্য আলাদা ভরাট গ্রিড',
        '৪-কোণা নিখুঁত ক্রসহেয়ার অপটিক্যাল মার্কার',
        'সাধারণ সাদা A4 কাগজে কোনো মার্জিন বিচ্যুতি ছাড়া প্রিন্ট'
      ],
      recommendedFor: 'স্কুল, কলেজ, প্রি-টেস্ট, টেস্ট ও এইচএসসি/এসএসসি মডেল টেস্ট'
    },
    {
      id: 'du_admission' as PresetType,
      category: 'admission',
      categoryLabel: 'ভার্সিটি ভর্তি',
      title: 'ঢাকা বিশ্ববিদ্যালয় ও ইঞ্জিনিয়ারিং ভর্তি (৬০/১০০ প্রশ্ন)',
      subtitle: 'ঢাবি ক/খ/গ ইউনিট ও ইঞ্জিনিয়ারিং স্ট্যান্ডার্ড ৪-কলাম লেআউট',
      badge: 'ভার্সিটি গুচ্ছ 🏛️',
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      themeColor: 'blue',
      themeLabel: 'রয়্যাল নেভি ব্লু',
      description: '৪ কলাম অপটিমাইজড প্রশ্ন বিন্যাস, নেগেটিভ মার্কিং কঠোর সতর্কতা, বারকোড সিকিউরিটি ও বিষয়ভিত্তিক (পদার্থ, রসায়ন, গণিত, জীববিজ্ঞান) উত্তর সেকশন।',
      specs: [
        { label: 'প্রশ্ন সংখ্যা', value: '৬০ / ১০০টি প্রশ্ন' },
        { label: 'লেআউট', value: '৪ কলাম গ্রিড' },
        { label: 'নেগেটিভ মার্ক', value: '০.২৫ কর্তন ওয়ার্নিং' },
        { label: 'সেট কোড', value: 'A, B, C, D অপশন' }
      ],
      features: [
        '৪ কলামে স্পেস-এফিশিয়েন্ট প্রশ্ন বিন্যাস',
        'নেগেটিভ মার্কিং কঠোর সতর্কতা ও নির্দেশনাবলী',
        'হাই-কনট্রাস্ট ব্লু থিম ও অটো-ডেস্কেউ কম্পিউটার ভিশন ট্র্যাকিং',
        'বিষয়ভিত্তিক সেকশন আলাদা করে মূল্যায়ন সুবিধা'
      ],
      recommendedFor: 'ঢাবি, রাবি, চবি, জাবি ও বুয়েট প্রিলি মডেল টেস্ট'
    },
    {
      id: 'gst_cluster' as PresetType,
      category: 'admission',
      categoryLabel: 'গুচ্ছ ভর্তি',
      title: 'GST সাধারণ ও বিজ্ঞান প্রযুক্তি গুচ্ছ (১০০ প্রশ্ন)',
      subtitle: '২৪টি বিশ্ববিদ্যালয়ের সমন্বিত ভর্তি পরীক্ষার স্ট্যান্ডার্ড শিট',
      badge: 'জিএসটি গুচ্ছ 🌐',
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      themeColor: 'blue',
      themeLabel: 'ভায়োলেট ব্লু',
      description: '৪ কলাম ২৫-প্রশ্ন গ্রিড, ৮-ডিজিট রোল নম্বর, সেট কোড, ফিজিক্স/কেমিস্ট্রি/ম্যাথ/বায়োলজি আলাদা সেকশন ও কম্প্যাক্ট স্পেস ইউটিলাইজেশন।',
      specs: [
        { label: 'প্রশ্ন সংখ্যা', value: '১০০টি প্রশ্ন (৪×২৫)' },
        { label: 'লেআউট', value: '৪ কলাম সমন্বিত' },
        { label: 'রোল ডিজিট', value: '৬-৮ ডিজিট বাবলস' },
        { label: 'স্ক্যান গতি', value: '০.৩ সেকেন্ড / শিট' }
      ],
      features: [
        'গুচ্ছ ভর্তি স্ট্যান্ডার্ড বারকোড ও ডিজিটাল ভ্যালিডেশন',
        'পদার্থ, রসায়ন, গণিত ও জীববিজ্ঞানের সুবিন্যস্ত কলাম',
        'কম্প্যাক্ট স্পেস ইউটিলাইজেশন ও দ্রুত ফলাফল প্রসেসিং',
        'মোবাইল ক্যামেরা ও ফ্ল্যাটবেড স্ক্যানার উভয়টিতে শতভাগ কার্যকর'
      ],
      recommendedFor: 'জিএসটি সাধারণ, বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের সমন্বিত ভর্তি'
    },
    {
      id: 'hsc_ssc_25' as PresetType,
      category: 'model',
      categoryLabel: 'দ্রুত কুইজ',
      title: 'মডেল টেস্ট ও কোচিং কম্প্যাক্ট (২৫ প্রশ্ন)',
      subtitle: 'দ্রুত ক্লাসরুম মূল্যায়ন, উইকলি টেস্ট ও শর্ট কুইজ ওএমআর',
      badge: 'হাই-স্পিড ⚡',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      themeColor: 'green',
      themeLabel: 'কালি সাশ্রয়ী গ্রিন',
      description: '১ পাতায় দ্রুত প্রিন্ট ও মোবাইল ক্যামেরা দিয়ে তাত্ক্ষণিক ৩ সেকেন্ডে স্ক্যান করার জন্য সবচেয়ে উপযোগী এবং অত্যন্ত কালি সাশ্রয়ী।',
      specs: [
        { label: 'প্রশ্ন সংখ্যা', value: '২৫টি প্রশ্ন' },
        { label: 'লেআউট', value: 'সিঙ্গেল কলাম কম্প্যাক্ট' },
        { label: 'কালি সাশ্রয়', value: '৭০% সাশ্রয়ী মিনিমালিস্ট' },
        { label: 'স্ক্যান সময়', value: '০.২ সেকেন্ড' }
      ],
      features: [
        '০.৫ সেকেন্ডে অটো ক্যামেরা স্ক্যান ও মার্কিং',
        'কম্প্যাক্ট সিঙ্গেল কলাম ও মিনিমালিস্ট ডিজাইন',
        'এক পেজে একাধিক কপি বা ফটোকপিতে নিখুঁত রিডিং',
        'ক্লাসরুম স্পিড টেস্ট ও দৈনিক কুইজের জন্য আদর্শ'
      ],
      recommendedFor: 'দৈনিক কুইজ, উইকলি টেস্ট ও বিশেষ ব্যাচ মূল্যায়ন'
    }
  ];

  const filteredTemplates = officialTemplates.filter(tpl => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'board') return tpl.category === 'board';
    if (categoryFilter === 'admission') return tpl.category === 'admission';
    if (categoryFilter === 'cq') return tpl.category === 'cq';
    if (categoryFilter === 'model') return tpl.category === 'model';
    return true;
  });

  const handleLaunchStudio = (preset: PresetType) => {
    setActivePreset(preset);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Render SVG Blueprint Schematics for Cards
  const renderCardBlueprint = (id: PresetType) => {
    switch (id) {
      case 'board_cq_3part':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-pink-500/20 p-2 shadow-inner">
            {/* Part 1 */}
            <rect x="8" y="8" width="184" height="66" rx="4" fill="#1b1222" stroke="#ec4899" strokeWidth="1" />
            <rect x="14" y="14" width="40" height="5" rx="1.5" fill="#ec4899" fillOpacity="0.4" />
            <rect x="58" y="14" width="80" height="5" rx="1.5" fill="#ec4899" fillOpacity="0.2" />
            <rect x="146" y="14" width="40" height="10" rx="1.5" fill="#ec4899" fillOpacity="0.7" />
            {/* Sync bar */}
            <rect x="14" y="23" width="172" height="4" rx="1" fill="#ec4899" fillOpacity="0.8" />
            {/* Roll & Reg mini bubbles */}
            <g fill="#f472b6" fillOpacity="0.6">
              <circle cx="22" cy="36" r="2" /><circle cx="30" cy="36" r="2" /><circle cx="38" cy="36" r="2" /><circle cx="46" cy="36" r="2" />
              <circle cx="22" cy="44" r="2" /><circle cx="30" cy="44" r="2" /><circle cx="38" cy="44" r="2" /><circle cx="46" cy="44" r="2" />
              <circle cx="22" cy="52" r="2" /><circle cx="30" cy="52" r="2" /><circle cx="38" cy="52" r="2" /><circle cx="46" cy="52" r="2" />
              <circle cx="22" cy="60" r="2" /><circle cx="30" cy="60" r="2" /><circle cx="38" cy="60" r="2" /><circle cx="46" cy="60" r="2" />
              <circle cx="22" cy="68" r="2" /><circle cx="30" cy="68" r="2" /><circle cx="38" cy="68" r="2" /><circle cx="46" cy="68" r="2" />
            </g>
            <rect x="64" y="32" width="122" height="38" rx="2" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="0.5" />
            {/* Perforation 1 */}
            <line x1="4" y1="80" x2="196" y2="80" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 3" />
            <text x="100" y="78" fill="#f472b6" fontSize="6.5" textAnchor="middle" fontWeight="bold">✂️ ১ম খণ্ড পারফোরেশন (পরীক্ষার্থীর অংশ)</text>

            {/* Part 2 */}
            <rect x="8" y="86" width="184" height="66" rx="4" fill="#1b1222" stroke="#ec4899" strokeWidth="1" />
            <rect x="14" y="91" width="172" height="4" rx="1" fill="#ec4899" fillOpacity="0.8" />
            <text x="100" y="103" fill="#f472b6" fontSize="6.5" textAnchor="middle" fontWeight="bold">পরীক্ষকের প্রাপ্ত নম্বর ওএমআর বাবলস (০-৯)</text>
            <g fill="#f472b6" fillOpacity="0.6">
              <circle cx="26" cy="114" r="2" /><circle cx="36" cy="114" r="2" /><circle cx="46" cy="114" r="2" /><circle cx="56" cy="114" r="2" />
              <circle cx="26" cy="122" r="2" /><circle cx="36" cy="122" r="2" /><circle cx="46" cy="122" r="2" /><circle cx="56" cy="122" r="2" />
              <circle cx="26" cy="130" r="2" /><circle cx="36" cy="130" r="2" /><circle cx="46" cy="130" r="2" /><circle cx="56" cy="130" r="2" />
              <circle cx="26" cy="138" r="2" /><circle cx="36" cy="138" r="2" /><circle cx="46" cy="138" r="2" /><circle cx="56" cy="138" r="2" />
              <circle cx="26" cy="146" r="2" /><circle cx="36" cy="146" r="2" /><circle cx="46" cy="146" r="2" /><circle cx="56" cy="146" r="2" />
            </g>
            <rect x="74" y="110" width="112" height="38" rx="2" fill="#ec4899" fillOpacity="0.1" stroke="#ec4899" strokeWidth="0.5" />
            {/* Perforation 2 */}
            <line x1="4" y1="158" x2="196" y2="158" stroke="#ec4899" strokeWidth="1" strokeDasharray="4 3" />
            <text x="100" y="156" fill="#f472b6" fontSize="6.5" textAnchor="middle" fontWeight="bold">✂️ ২য় খণ্ড পারফোরেশন (প্রধান পরীক্ষক)</text>

            {/* Part 3 */}
            <rect x="8" y="164" width="184" height="68" rx="4" fill="#1b1222" stroke="#ec4899" strokeWidth="1" />
            <rect x="14" y="169" width="172" height="4" rx="1" fill="#ec4899" fillOpacity="0.8" />
            <text x="100" y="181" fill="#f472b6" fontSize="6.5" textAnchor="middle" fontWeight="bold">উত্তরপত্রের অংশ: ২০টি সৃজনশীল প্রশ্ন নম্বর টেবিল</text>
            <rect x="14" y="188" width="172" height="38" rx="2" fill="#ec4899" fillOpacity="0.08" stroke="#ec4899" strokeWidth="0.5" />
            <line x1="14" y1="200" x2="186" y2="200" stroke="#ec4899" strokeWidth="0.5" />
            <line x1="14" y1="212" x2="186" y2="212" stroke="#ec4899" strokeWidth="0.5" />
          </svg>
        );

      case 'medical_100':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-emerald-500/20 p-2 shadow-inner">
            {/* Header Identity */}
            <rect x="8" y="8" width="184" height="46" rx="4" fill="#0d1f18" stroke="#10b981" strokeWidth="1" />
            <rect x="14" y="14" width="60" height="6" rx="2" fill="#10b981" fillOpacity="0.4" />
            <rect x="80" y="14" width="104" height="6" rx="2" fill="#10b981" fillOpacity="0.2" />
            {/* Student ID bubbles strip */}
            <g fill="#34d399" fillOpacity="0.6">
              <circle cx="20" cy="30" r="2" /><circle cx="28" cy="30" r="2" /><circle cx="36" cy="30" r="2" /><circle cx="44" cy="30" r="2" />
              <circle cx="20" cy="38" r="2" /><circle cx="28" cy="38" r="2" /><circle cx="36" cy="38" r="2" /><circle cx="44" cy="38" r="2" />
              <circle cx="20" cy="46" r="2" /><circle cx="28" cy="46" r="2" /><circle cx="36" cy="46" r="2" /><circle cx="44" cy="46" r="2" />
            </g>
            <rect x="60" y="26" width="124" height="22" rx="2" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="0.5" />
            {/* 2 Tall Columns of 50 Questions */}
            <g stroke="#10b981" strokeWidth="0.8" fill="#0d1f18">
              <rect x="8" y="60" width="88" height="136" rx="3" />
              <rect x="104" y="60" width="88" height="136" rx="3" />
            </g>
            {/* Column labels */}
            <text x="52" y="72" fill="#34d399" fontSize="6.5" textAnchor="middle" fontWeight="bold">কলাম ১: প্রশ্ন ১ - ৫০</text>
            <text x="148" y="72" fill="#34d399" fontSize="6.5" textAnchor="middle" fontWeight="bold">কলাম ২: প্রশ্ন ৫১ - ১০০</text>
            {/* Bubbles in col 1 */}
            <g fill="#34d399" fillOpacity="0.5">
              <circle cx="20" cy="84" r="2" /><circle cx="26" cy="84" r="2" /><circle cx="32" cy="84" r="2" /><circle cx="38" cy="84" r="2" />
              <circle cx="20" cy="94" r="2" /><circle cx="26" cy="94" r="2" /><circle cx="32" cy="94" r="2" /><circle cx="38" cy="94" r="2" />
              <circle cx="20" cy="104" r="2" /><circle cx="26" cy="104" r="2" /><circle cx="32" cy="104" r="2" /><circle cx="38" cy="104" r="2" />
              <circle cx="20" cy="114" r="2" /><circle cx="26" cy="114" r="2" /><circle cx="32" cy="114" r="2" /><circle cx="38" cy="114" r="2" />
              <circle cx="20" cy="124" r="2" /><circle cx="26" cy="124" r="2" /><circle cx="32" cy="124" r="2" /><circle cx="38" cy="124" r="2" />
              <circle cx="20" cy="134" r="2" /><circle cx="26" cy="134" r="2" /><circle cx="32" cy="134" r="2" /><circle cx="38" cy="134" r="2" />
              <circle cx="20" cy="144" r="2" /><circle cx="26" cy="144" r="2" /><circle cx="32" cy="144" r="2" /><circle cx="38" cy="144" r="2" />
              <circle cx="20" cy="154" r="2" /><circle cx="26" cy="154" r="2" /><circle cx="32" cy="154" r="2" /><circle cx="38" cy="154" r="2" />
              <circle cx="20" cy="164" r="2" /><circle cx="26" cy="164" r="2" /><circle cx="32" cy="164" r="2" /><circle cx="38" cy="164" r="2" />
              <circle cx="20" cy="174" r="2" /><circle cx="26" cy="174" r="2" /><circle cx="32" cy="174" r="2" /><circle cx="38" cy="174" r="2" />
              <circle cx="20" cy="184" r="2" /><circle cx="26" cy="184" r="2" /><circle cx="32" cy="184" r="2" /><circle cx="38" cy="184" r="2" />
            </g>
            {/* Bubbles in col 2 */}
            <g fill="#34d399" fillOpacity="0.5">
              <circle cx="116" cy="84" r="2" /><circle cx="122" cy="84" r="2" /><circle cx="128" cy="84" r="2" /><circle cx="134" cy="84" r="2" />
              <circle cx="116" cy="94" r="2" /><circle cx="122" cy="94" r="2" /><circle cx="128" cy="94" r="2" /><circle cx="134" cy="94" r="2" />
              <circle cx="116" cy="104" r="2" /><circle cx="122" cy="104" r="2" /><circle cx="128" cy="104" r="2" /><circle cx="134" cy="104" r="2" />
              <circle cx="116" cy="114" r="2" /><circle cx="122" cy="114" r="2" /><circle cx="128" cy="114" r="2" /><circle cx="134" cy="114" r="2" />
              <circle cx="116" cy="124" r="2" /><circle cx="122" cy="124" r="2" /><circle cx="128" cy="124" r="2" /><circle cx="134" cy="124" r="2" />
              <circle cx="116" cy="134" r="2" /><circle cx="122" cy="134" r="2" /><circle cx="128" cy="134" r="2" /><circle cx="134" cy="134" r="2" />
              <circle cx="116" cy="144" r="2" /><circle cx="122" cy="144" r="2" /><circle cx="128" cy="144" r="2" /><circle cx="134" cy="144" r="2" />
              <circle cx="116" cy="154" r="2" /><circle cx="122" cy="154" r="2" /><circle cx="128" cy="154" r="2" /><circle cx="134" cy="154" r="2" />
              <circle cx="116" cy="164" r="2" /><circle cx="122" cy="164" r="2" /><circle cx="128" cy="164" r="2" /><circle cx="134" cy="164" r="2" />
              <circle cx="116" cy="174" r="2" /><circle cx="122" cy="174" r="2" /><circle cx="128" cy="174" r="2" /><circle cx="134" cy="174" r="2" />
              <circle cx="116" cy="184" r="2" /><circle cx="122" cy="184" r="2" /><circle cx="128" cy="184" r="2" /><circle cx="134" cy="184" r="2" />
            </g>
            {/* Bottom Score Strip */}
            <rect x="8" y="204" width="184" height="26" rx="3" fill="#0d1f18" stroke="#10b981" strokeWidth="0.8" />
            <text x="100" y="220" fill="#34d399" fontSize="6.5" textAnchor="middle" fontWeight="bold">স্কোরিং ও নেগেটিভ মার্কিং ট্র্যাকিং স্ট্রিপ</text>
          </svg>
        );

      case 'hsc_ssc_50':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-rose-500/20 p-2 shadow-inner">
            {/* Split Top: Header */}
            <rect x="8" y="8" width="184" height="28" rx="3" fill="#201015" stroke="#f43f5e" strokeWidth="1" />
            <text x="100" y="22" fill="#fb7185" fontSize="7" textAnchor="middle" fontWeight="bold">মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড (৫০ প্রশ্ন)</text>
            <rect x="14" y="28" width="172" height="3" fill="#f43f5e" fillOpacity="0.7" />

            {/* Split Body: Left Questions (2 cols of 25), Right Student Roll/Reg Matrix */}
            <rect x="8" y="42" width="94" height="188" rx="3" fill="#201015" stroke="#f43f5e" strokeWidth="0.8" />
            <text x="55" y="54" fill="#fb7185" fontSize="6.5" textAnchor="middle" fontWeight="bold">প্রশ্ন ১ - ৫০ (MCQ)</text>
            <g fill="#fb7185" fillOpacity="0.5">
              <circle cx="18" cy="66" r="2" /><circle cx="24" cy="66" r="2" /><circle cx="30" cy="66" r="2" /><circle cx="36" cy="66" r="2" />
              <circle cx="18" cy="78" r="2" /><circle cx="24" cy="78" r="2" /><circle cx="30" cy="78" r="2" /><circle cx="36" cy="78" r="2" />
              <circle cx="18" cy="90" r="2" /><circle cx="24" cy="90" r="2" /><circle cx="30" cy="90" r="2" /><circle cx="36" cy="90" r="2" />
              <circle cx="18" cy="102" r="2" /><circle cx="24" cy="102" r="2" /><circle cx="30" cy="102" r="2" /><circle cx="36" cy="102" r="2" />
              <circle cx="18" cy="114" r="2" /><circle cx="24" cy="114" r="2" /><circle cx="30" cy="114" r="2" /><circle cx="36" cy="114" r="2" />
              <circle cx="18" cy="126" r="2" /><circle cx="24" cy="126" r="2" /><circle cx="30" cy="126" r="2" /><circle cx="36" cy="126" r="2" />
              <circle cx="18" cy="138" r="2" /><circle cx="24" cy="138" r="2" /><circle cx="30" cy="138" r="2" /><circle cx="36" cy="138" r="2" />
              <circle cx="18" cy="150" r="2" /><circle cx="24" cy="150" r="2" /><circle cx="30" cy="150" r="2" /><circle cx="36" cy="150" r="2" />
              <circle cx="18" cy="162" r="2" /><circle cx="24" cy="162" r="2" /><circle cx="30" cy="162" r="2" /><circle cx="36" cy="162" r="2" />
              <circle cx="18" cy="174" r="2" /><circle cx="24" cy="174" r="2" /><circle cx="30" cy="174" r="2" /><circle cx="36" cy="174" r="2" />
              <circle cx="18" cy="186" r="2" /><circle cx="24" cy="186" r="2" /><circle cx="30" cy="186" r="2" /><circle cx="36" cy="186" r="2" />
              <circle cx="18" cy="198" r="2" /><circle cx="24" cy="198" r="2" /><circle cx="30" cy="198" r="2" /><circle cx="36" cy="198" r="2" />
              <circle cx="18" cy="210" r="2" /><circle cx="24" cy="210" r="2" /><circle cx="30" cy="210" r="2" /><circle cx="36" cy="210" r="2" />
            </g>

            {/* Right: Roll (6), Reg (10), Subject Code (3), Set Code */}
            <rect x="108" y="42" width="84" height="188" rx="3" fill="#201015" stroke="#f43f5e" strokeWidth="0.8" />
            <text x="150" y="54" fill="#fb7185" fontSize="6.5" textAnchor="middle" fontWeight="bold">রোল, রেজি ও সেট কোড</text>
            <g fill="#fb7185" fillOpacity="0.6">
              <rect x="114" y="62" width="72" height="42" rx="2" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeWidth="0.5" />
              <text x="150" y="74" fill="#fb7185" fontSize="5.5" textAnchor="middle">রোল নম্বর (৬ ডিজিট)</text>
              <circle cx="122" cy="84" r="1.8" /><circle cx="128" cy="84" r="1.8" /><circle cx="134" cy="84" r="1.8" />
              <circle cx="140" cy="84" r="1.8" /><circle cx="146" cy="84" r="1.8" /><circle cx="152" cy="84" r="1.8" />
              <circle cx="122" cy="92" r="1.8" /><circle cx="128" cy="92" r="1.8" /><circle cx="134" cy="92" r="1.8" />
              <circle cx="140" cy="92" r="1.8" /><circle cx="146" cy="92" r="1.8" /><circle cx="152" cy="92" r="1.8" />

              <rect x="114" y="112" width="72" height="60" rx="2" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeWidth="0.5" />
              <text x="150" y="124" fill="#fb7185" fontSize="5.5" textAnchor="middle">রেজিস্ট্রেশন নম্বর (১০ ডিজিট)</text>
              <circle cx="120" cy="136" r="1.6" /><circle cx="126" cy="136" r="1.6" /><circle cx="132" cy="136" r="1.6" /><circle cx="138" cy="136" r="1.6" />
              <circle cx="144" cy="136" r="1.6" /><circle cx="150" cy="136" r="1.6" /><circle cx="156" cy="136" r="1.6" /><circle cx="162" cy="136" r="1.6" />
              <circle cx="120" cy="146" r="1.6" /><circle cx="126" cy="146" r="1.6" /><circle cx="132" cy="146" r="1.6" /><circle cx="138" cy="146" r="1.6" />
              <circle cx="144" cy="146" r="1.6" /><circle cx="150" cy="146" r="1.6" /><circle cx="156" cy="146" r="1.6" /><circle cx="162" cy="146" r="1.6" />

              <rect x="114" y="180" width="72" height="42" rx="2" fill="#f43f5e" fillOpacity="0.1" stroke="#f43f5e" strokeWidth="0.5" />
              <text x="150" y="192" fill="#fb7185" fontSize="5.5" textAnchor="middle">সেট কোড: ক খ গ ঘ</text>
              <circle cx="126" cy="204" r="2.5" /><circle cx="138" cy="204" r="2.5" /><circle cx="150" cy="204" r="2.5" /><circle cx="162" cy="204" r="2.5" />
            </g>
          </svg>
        );

      case 'du_admission':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-blue-500/20 p-2 shadow-inner">
            {/* Top Identity Block */}
            <rect x="8" y="8" width="184" height="42" rx="3" fill="#0d1829" stroke="#3b82f6" strokeWidth="1" />
            <text x="100" y="22" fill="#60a5fa" fontSize="7" textAnchor="middle" fontWeight="bold">ঢাকা বিশ্ববিদ্যালয় ভর্তি পরীক্ষা (৪ কলাম)</text>
            <rect x="14" y="28" width="172" height="3" fill="#3b82f6" fillOpacity="0.8" />
            <text x="100" y="38" fill="#93c5fd" fontSize="5.5" textAnchor="middle">ভুল উত্তরের জন্য ০.২৫ নেগেটিভ মার্কিং</text>

            {/* 4 Compact Columns */}
            <g stroke="#3b82f6" strokeWidth="0.7" fill="#0d1829">
              <rect x="8" y="56" width="42" height="174" rx="2" />
              <rect x="54" y="56" width="42" height="174" rx="2" />
              <rect x="100" y="56" width="42" height="174" rx="2" />
              <rect x="146" y="56" width="46" height="174" rx="2" />
            </g>
            <text x="29" y="66" fill="#60a5fa" fontSize="5" textAnchor="middle" fontWeight="bold">পদার্থ</text>
            <text x="75" y="66" fill="#60a5fa" fontSize="5" textAnchor="middle" fontWeight="bold">রসায়ন</text>
            <text x="121" y="66" fill="#60a5fa" fontSize="5" textAnchor="middle" fontWeight="bold">গণিত</text>
            <text x="169" y="66" fill="#60a5fa" fontSize="5" textAnchor="middle" fontWeight="bold">জীববিজ্ঞান</text>
            {/* 4 columns of bubbles */}
            <g fill="#60a5fa" fillOpacity="0.5">
              <circle cx="16" cy="78" r="1.5" /><circle cx="21" cy="78" r="1.5" /><circle cx="26" cy="78" r="1.5" /><circle cx="31" cy="78" r="1.5" />
              <circle cx="16" cy="90" r="1.5" /><circle cx="21" cy="90" r="1.5" /><circle cx="26" cy="90" r="1.5" /><circle cx="31" cy="90" r="1.5" />
              <circle cx="16" cy="102" r="1.5" /><circle cx="21" cy="102" r="1.5" /><circle cx="26" cy="102" r="1.5" /><circle cx="31" cy="102" r="1.5" />
              <circle cx="16" cy="114" r="1.5" /><circle cx="21" cy="114" r="1.5" /><circle cx="26" cy="114" r="1.5" /><circle cx="31" cy="114" r="1.5" />
              <circle cx="16" cy="126" r="1.5" /><circle cx="21" cy="126" r="1.5" /><circle cx="26" cy="126" r="1.5" /><circle cx="31" cy="126" r="1.5" />
              <circle cx="16" cy="138" r="1.5" /><circle cx="21" cy="138" r="1.5" /><circle cx="26" cy="138" r="1.5" /><circle cx="31" cy="138" r="1.5" />
              <circle cx="16" cy="150" r="1.5" /><circle cx="21" cy="150" r="1.5" /><circle cx="26" cy="150" r="1.5" /><circle cx="31" cy="150" r="1.5" />
              <circle cx="16" cy="162" r="1.5" /><circle cx="21" cy="162" r="1.5" /><circle cx="26" cy="162" r="1.5" /><circle cx="31" cy="162" r="1.5" />
              <circle cx="16" cy="174" r="1.5" /><circle cx="21" cy="174" r="1.5" /><circle cx="26" cy="174" r="1.5" /><circle cx="31" cy="174" r="1.5" />
              <circle cx="16" cy="186" r="1.5" /><circle cx="21" cy="186" r="1.5" /><circle cx="26" cy="186" r="1.5" /><circle cx="31" cy="186" r="1.5" />

              <circle cx="62" cy="78" r="1.5" /><circle cx="67" cy="78" r="1.5" /><circle cx="72" cy="78" r="1.5" /><circle cx="77" cy="78" r="1.5" />
              <circle cx="62" cy="90" r="1.5" /><circle cx="67" cy="90" r="1.5" /><circle cx="72" cy="90" r="1.5" /><circle cx="77" cy="90" r="1.5" />
              <circle cx="62" cy="102" r="1.5" /><circle cx="67" cy="102" r="1.5" /><circle cx="72" cy="102" r="1.5" /><circle cx="77" cy="102" r="1.5" />
              <circle cx="62" cy="114" r="1.5" /><circle cx="67" cy="114" r="1.5" /><circle cx="72" cy="114" r="1.5" /><circle cx="77" cy="114" r="1.5" />
              <circle cx="62" cy="126" r="1.5" /><circle cx="67" cy="126" r="1.5" /><circle cx="72" cy="126" r="1.5" /><circle cx="77" cy="126" r="1.5" />

              <circle cx="108" cy="78" r="1.5" /><circle cx="113" cy="78" r="1.5" /><circle cx="118" cy="78" r="1.5" /><circle cx="123" cy="78" r="1.5" />
              <circle cx="108" cy="90" r="1.5" /><circle cx="113" cy="90" r="1.5" /><circle cx="118" cy="90" r="1.5" /><circle cx="123" cy="90" r="1.5" />
              <circle cx="108" cy="102" r="1.5" /><circle cx="113" cy="102" r="1.5" /><circle cx="118" cy="102" r="1.5" /><circle cx="123" cy="102" r="1.5" />

              <circle cx="155" cy="78" r="1.5" /><circle cx="160" cy="78" r="1.5" /><circle cx="165" cy="78" r="1.5" /><circle cx="170" cy="78" r="1.5" />
              <circle cx="155" cy="90" r="1.5" /><circle cx="160" cy="90" r="1.5" /><circle cx="165" cy="90" r="1.5" /><circle cx="170" cy="90" r="1.5" />
              <circle cx="155" cy="102" r="1.5" /><circle cx="160" cy="102" r="1.5" /><circle cx="165" cy="102" r="1.5" /><circle cx="170" cy="102" r="1.5" />
            </g>
          </svg>
        );

      case 'gst_cluster':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-indigo-500/20 p-2 shadow-inner">
            <rect x="8" y="8" width="184" height="42" rx="3" fill="#14112e" stroke="#6366f1" strokeWidth="1" />
            <text x="100" y="22" fill="#a5b4fc" fontSize="7" textAnchor="middle" fontWeight="bold">GST সমন্বিত ভর্তি পরীক্ষা (১০০ প্রশ্ন)</text>
            <rect x="14" y="28" width="172" height="3" fill="#6366f1" fillOpacity="0.8" />
            <text x="100" y="38" fill="#c7d2fe" fontSize="5.5" textAnchor="middle">২৪টি বিশ্ববিদ্যালয়ের সেন্ট্রাল ওএমআর স্ট্যান্ডার্ড</text>

            <g stroke="#6366f1" strokeWidth="0.7" fill="#14112e">
              <rect x="8" y="56" width="42" height="174" rx="2" />
              <rect x="54" y="56" width="42" height="174" rx="2" />
              <rect x="100" y="56" width="42" height="174" rx="2" />
              <rect x="146" y="56" width="46" height="174" rx="2" />
            </g>
            <text x="29" y="66" fill="#a5b4fc" fontSize="5" textAnchor="middle" fontWeight="bold">সেকশন ১</text>
            <text x="75" y="66" fill="#a5b4fc" fontSize="5" textAnchor="middle" fontWeight="bold">সেকশন ২</text>
            <text x="121" y="66" fill="#a5b4fc" fontSize="5" textAnchor="middle" fontWeight="bold">সেকশন ৩</text>
            <text x="169" y="66" fill="#a5b4fc" fontSize="5" textAnchor="middle" fontWeight="bold">সেকশন ৪</text>
            <g fill="#a5b4fc" fillOpacity="0.5">
              <circle cx="16" cy="80" r="1.5" /><circle cx="22" cy="80" r="1.5" /><circle cx="28" cy="80" r="1.5" /><circle cx="34" cy="80" r="1.5" />
              <circle cx="16" cy="94" r="1.5" /><circle cx="22" cy="94" r="1.5" /><circle cx="28" cy="94" r="1.5" /><circle cx="34" cy="94" r="1.5" />
              <circle cx="16" cy="108" r="1.5" /><circle cx="22" cy="108" r="1.5" /><circle cx="28" cy="108" r="1.5" /><circle cx="34" cy="108" r="1.5" />
              <circle cx="16" cy="122" r="1.5" /><circle cx="22" cy="122" r="1.5" /><circle cx="28" cy="122" r="1.5" /><circle cx="34" cy="122" r="1.5" />
              <circle cx="16" cy="136" r="1.5" /><circle cx="22" cy="136" r="1.5" /><circle cx="28" cy="136" r="1.5" /><circle cx="34" cy="136" r="1.5" />
            </g>
          </svg>
        );

      case 'hsc_ssc_25':
      default:
        return (
          <svg viewBox="0 0 200 240" className="w-full h-40 rounded-xl bg-slate-950/80 border border-amber-500/20 p-2 shadow-inner">
            <rect x="8" y="8" width="184" height="38" rx="3" fill="#1f180d" stroke="#f59e0b" strokeWidth="1" />
            <text x="100" y="22" fill="#fbbf24" fontSize="7" textAnchor="middle" fontWeight="bold">মডেল টেস্ট ও স্পিড কুইজ (২৫ প্রশ্ন)</text>
            <text x="100" y="34" fill="#fcd34d" fontSize="5.5" textAnchor="middle">০.২ সেকেন্ডে তাত্ক্ষণিক স্ক্যান</text>

            <rect x="40" y="54" width="120" height="176" rx="3" fill="#1f180d" stroke="#f59e0b" strokeWidth="0.8" />
            <text x="100" y="68" fill="#fbbf24" fontSize="6.5" textAnchor="middle" fontWeight="bold">প্রশ্ন ১ - ২৫ (সিঙ্গেল কলাম)</text>
            <g fill="#fbbf24" fillOpacity="0.5">
              <circle cx="65" cy="82" r="2.2" /><circle cx="77" cy="82" r="2.2" /><circle cx="89" cy="82" r="2.2" /><circle cx="101" cy="82" r="2.2" />
              <circle cx="65" cy="96" r="2.2" /><circle cx="77" cy="96" r="2.2" /><circle cx="89" cy="96" r="2.2" /><circle cx="101" cy="96" r="2.2" />
              <circle cx="65" cy="110" r="2.2" /><circle cx="77" cy="110" r="2.2" /><circle cx="89" cy="110" r="2.2" /><circle cx="101" cy="110" r="2.2" />
              <circle cx="65" cy="124" r="2.2" /><circle cx="77" cy="124" r="2.2" /><circle cx="89" cy="124" r="2.2" /><circle cx="101" cy="124" r="2.2" />
              <circle cx="65" cy="138" r="2.2" /><circle cx="77" cy="138" r="2.2" /><circle cx="89" cy="138" r="2.2" /><circle cx="101" cy="138" r="2.2" />
              <circle cx="65" cy="152" r="2.2" /><circle cx="77" cy="152" r="2.2" /><circle cx="89" cy="152" r="2.2" /><circle cx="101" cy="152" r="2.2" />
              <circle cx="65" cy="166" r="2.2" /><circle cx="77" cy="166" r="2.2" /><circle cx="89" cy="166" r="2.2" /><circle cx="101" cy="166" r="2.2" />
              <circle cx="65" cy="180" r="2.2" /><circle cx="77" cy="180" r="2.2" /><circle cx="89" cy="180" r="2.2" /><circle cx="101" cy="180" r="2.2" />
              <circle cx="65" cy="194" r="2.2" /><circle cx="77" cy="194" r="2.2" /><circle cx="89" cy="194" r="2.2" /><circle cx="101" cy="194" r="2.2" />
              <circle cx="65" cy="208" r="2.2" /><circle cx="77" cy="208" r="2.2" /><circle cx="89" cy="208" r="2.2" /><circle cx="101" cy="208" r="2.2" />
            </g>
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
            title="পরীক্ষা তালিকায় ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">পরীক্ষা ব্যবস্থাপনা</span>
              <span className="text-slate-600">/</span>
              <h1 className="font-bold text-sm sm:text-base flex items-center gap-2 text-white">
                <ScanLine className="w-4 h-4 text-indigo-400" />
                <span>বাংলাদেশ স্ট্যান্ডার্ড OMR টেমপ্লেট হাব</span>
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              বোর্ড (SSC/HSC), মেডিকেল ও বিশ্ববিদ্যালয়ের অফিসিয়াল OMR শিট ভেক্টর প্রিন্ট ও স্ক্যানিং
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/print"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট হাব</span>
          </Link>
          <Link
            href="/exams"
            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors hidden sm:block"
          >
            পরীক্ষা তালিকা
          </Link>
        </div>
      </header>

      {/* Hero Banner with Segmented Tab Switcher */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 px-4 sm:px-6 py-6 sm:py-7">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>বাংলাদেশ শিক্ষা বোর্ড ও এডমিশন ওএমআর আর্কিটেকচার</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              অফিসিয়াল OMR শিট টেমপ্লেট ও লাইভ স্টুডিও
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              সরাসরি প্রিন্ট করার উপযোগী ভেক্টর কোয়ালিটি। খাঁটি <strong>NikoshBAN</strong> বাংলা ফন্ট, ৪-কোণা অপটিক্যাল ফিডুসিয়াল এবং যেকোনো সাধারণ মোবাইল ক্যামেরা দিয়ে ৯৯.৯৯% নির্ভুল স্ক্যানিং।
            </p>
          </div>

          {/* Top Segmented Tab Switcher */}
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-xl shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>টেমপ্লেট শোকেস (Showcase)</span>
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>লাইভ স্টুডিও (Live Studio)</span>
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>৯৯.৯৯% কম্পিউটার ভিশন এলাইনমেন্ট</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>NikoshBAN খাঁটি বাংলা ভেক্টর টাইপোগ্রাফি</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>৩-খণ্ড পারফোরেটেড সৃজনশীল CQ কভার পেজ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>সাধারণ মোবাইল ক্যামেরা ও স্ক্যানারে ডিকোডযোগ্য</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {activeTab === 'gallery' ? (
          /* TAB 1: SHOWCASE GALLERY */
          <div className="space-y-6">
            {/* Category Filter Pills & Search Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 sm:px-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" /> ফিল্টার:
                </span>
                {[
                  { id: 'all', label: 'সকল টেমপ্লেট (৬)' },
                  { id: 'board', label: 'বোর্ড পরীক্ষা (SSC/HSC)' },
                  { id: 'cq', label: 'সৃজনশীল ৩-খণ্ড CQ' },
                  { id: 'admission', label: 'ভর্তি পরীক্ষা (মেডিকেল ও ভার্সিটি)' },
                  { id: 'model', label: 'কুইজ ও মডেল টেস্ট' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-400 text-right">
                মোট <strong className="text-white">{filteredTemplates.length}</strong> টি ভেরিফাইড টেমপ্লেট
              </div>
            </div>

            {/* Template Gallery Cards Grid (Symmetrical 3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/10 overflow-hidden"
                >
                  <div className="p-5">
                    {/* Top Row: Category Badge & Theme Dot */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          tpl.themeColor === 'magenta' ? 'bg-pink-500' :
                          tpl.themeColor === 'blue' ? 'bg-blue-500' :
                          tpl.themeColor === 'green' ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}></span>
                        <span>{tpl.themeLabel}</span>
                      </div>
                    </div>

                    {/* Visual Blueprint Schematic */}
                    <div className="mb-4 group-hover:scale-[1.01] transition-transform duration-200">
                      {renderCardBlueprint(tpl.id)}
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-indigo-300 transition-colors leading-snug mb-1">
                      {tpl.title}
                    </h3>
                    <p className="text-xs font-medium text-indigo-400/90 mb-3 leading-relaxed">
                      {tpl.subtitle}
                    </p>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {tpl.description}
                    </p>

                    {/* Specification Badges Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px]">
                      {tpl.specs.map((sp, sIdx) => (
                        <div key={sIdx} className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-medium">{sp.label}:</span>
                          <span className="font-bold text-slate-200 truncate">{sp.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Key Features List */}
                    <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-800/80">
                      {tpl.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-0">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col gap-2.5">
                      <div className="text-[11px] text-slate-400 font-semibold truncate flex items-center gap-1">
                        <span>🎯</span>
                        <span>{tpl.recommendedFor}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleLaunchStudio(tpl.id)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-indigo-600/30 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>স্টুডিওতে কাস্টমাইজ ও প্রিভিউ</span>
                        </button>
                        <Link
                          href="/exams/print"
                          className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center justify-center"
                          title="প্রশ্নসহ প্রিন্ট পেজে যান"
                        >
                          <Printer className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* TAB 2: LIVE STUDIO & BUILDER WORKSPACE */
          <div className="space-y-4">
            {/* Studio Navigation & Direct Preset Switcher Ribbon */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('gallery')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700/60 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>শোকেসে ফিরে যান</span>
                </button>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span>লাইভ ওএমআর কাস্টমাইজেশন স্টুডিও</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    প্রতিষ্ঠানের নাম, কোড, সাল, প্রশ্নের সংখ্যা ও পেজ লেআউট কাস্টমাইজ করে সরাসরি প্রিন্ট নিন
                  </p>
                </div>
              </div>

              {/* Direct Preset Switcher Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">প্রিসেট:</span>
                {[
                  { id: 'board_cq_3part', label: '📝 CQ ৩-খণ্ড কভার' },
                  { id: 'medical_100', label: '🩺 মেডিকেল ১০০' },
                  { id: 'hsc_ssc_50', label: '🎓 HSC/SSC ৫০' },
                  { id: 'du_admission', label: '🏛️ ঢাবি ৬০/১০০' },
                  { id: 'gst_cluster', label: '🌐 GST গুচ্ছ ১০০' },
                  { id: 'hsc_ssc_25', label: '⚡ মডেল টেস্ট ২৫' },
                ].map(p => (
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

            {/* Mounted BangladeshOMRGenerator with activePreset passed seamlessly */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-5 shadow-2xl">
              <BangladeshOMRGenerator
                key={activePreset}
                initialPreset={activePreset}
                hideTopHeader={true}
                onApplyGeneratedTemplate={(tpl) => {
                  console.log('Applied template:', tpl);
                }}
                onNavigateToScanner={() => {
                  router.push('/exams');
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-400">
        Rofaz Academy Advanced OMR Engine • Bangladesh Board & University Admission Precision Standard
      </footer>
    </div>
  );
}