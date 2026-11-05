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
  BookOpen
} from 'lucide-react';
import { BangladeshOMRGenerator, type PresetType } from '@/app/components/omr/BangladeshOMRGenerator';

export default function OMRTemplatesPage() {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState<PresetType>('medical_100');
  const [activeTab, setActiveTab] = useState<'gallery' | 'studio'>('gallery');

  const officialTemplates = [
    {
      id: 'medical_100' as PresetType,
      title: 'মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (১০০ প্রশ্ন)',
      subtitle: 'ALL_13_MEDICAL_EXAMS_WORLD_CLASS_BW_MASTER ফরম্যাট',
      badge: 'গোল্ড স্ট্যান্ডার্ড 🌟',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      description: '৭-ডিজিট রোল, সিরিয়াল, ক্যান্ডিডেট বক্স, ২ কলাম ৫০-প্রশ্ন ও নিচের স্কোর স্ট্রিপ। খাঁটি NikoshBAN ফন্টে তৈরি।',
      features: ['৪-কোণা অপটিক্যাল ফিডুসিয়াল', 'A3 মাস্টার ও A4 পেপার সাপোর্ট', 'ভুল দাগ প্রতিরোধ বারকোড'],
      themeColor: 'black',
      recommendedFor: 'মেডিকেল, ডেন্টাল ও নার্সিং ভর্তি কোচিং'
    },
    {
      id: 'hsc_ssc_50' as PresetType,
      title: 'মাধ্যমিক ও উচ্চ মাধ্যমিক শিক্ষা বোর্ড (৫০ প্রশ্ন)',
      subtitle: 'অফিসিয়াল এইচএসসি ও এসএসসি পরীক্ষার ওএমআর শিট',
      badge: 'বোর্ড স্ট্যান্ডার্ড 🎓',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      description: 'রোল ৬-ডিজিট, রেজি ১০-ডিজিট, বিষয় কোড ৩-ডিজিট এবং সেট ক, খ, গ, ঘ অপশন। সিগনেচার ও নির্দেশনা বক্স সহ।',
      features: ['অফিসিয়াল ম্যাজেন্টা পিঙ্ক থিম', 'পূর্ণাঙ্গ বোর্ড সাইজিং', 'টপ-ডাউন স্প্লিট লেআউট'],
      themeColor: 'magenta',
      recommendedFor: 'স্কুল, কলেজ, প্রি-টেস্ট ও টেস্ট পরীক্ষা'
    },
    {
      id: 'du_admission' as PresetType,
      title: 'বিশ্ববিদ্যালয় ভর্তি পরীক্ষা ও GST গুচ্ছ (১০০ প্রশ্ন)',
      subtitle: 'ঢাকা বিশ্ববিদ্যালয়, জিএসটি ও কৃষি গুচ্ছ স্ট্যান্ডার্ড',
      badge: 'ভার্সিটি গুচ্ছ 🏛️',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      description: '৪ কলাম ২৫-প্রশ্ন গ্রিড, নেগেটিভ মার্কিং কঠোর সতর্কতা, বারকোড সিকিউরিটি ও বিষয়ভিত্তিক উত্তর সেকশন।',
      features: ['৪ কলাম কম্প্যাক্ট গ্রিড', 'নেগেটিভ মার্কিং ওয়ার্নিং', 'হাই-কনট্রাস্ট ব্লু থিম'],
      themeColor: 'blue',
      recommendedFor: 'ঢাবি, রাবি, চবি, জাবি ও জিএসটি মডেল টেস্ট'
    },
    {
      id: 'hsc_ssc_25' as PresetType,
      title: 'মডেল টেস্ট ও কোচিং কম্প্যাক্ট (২৫/৫০ প্রশ্ন)',
      subtitle: 'দ্রুত ক্লাসরুম মূল্যায়ন ও সাপ্তাহিক টেস্ট ওএমআর',
      badge: 'হাই-স্পিড ⚡',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: '১ পাতায় দ্রুত প্রিন্ট ও মোবাইল ক্যামেরা দিয়ে তাত্ক্ষণিক ৩ সেকেন্ডে স্ক্যান করার জন্য সবচেয়ে উপযোগী।',
      features: ['০.৫ সেকেন্ডে অটো স্ক্যান', 'কম্প্যাক্ট সিঙ্গেল কলাম', 'মিনিমালিস্ট ও কালি সাশ্রয়ী'],
      themeColor: 'green',
      recommendedFor: 'দৈনিক কুইজ, উইকলি টেস্ট ও বিশেষ ব্যাচ'
    }
  ];

  const handleLaunchStudio = (preset: PresetType) => {
    setActivePreset(preset);
    setActiveTab('studio');
    // Scroll smoothly to studio container
    setTimeout(() => {
      document.getElementById('omr-studio-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="পরীক্ষা তালিকায় ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg flex items-center gap-2 text-white">
              <ScanLine className="w-5 h-5 text-indigo-400" />
              <span>বাংলাদেশ স্ট্যান্ডার্ড OMR স্টুডিও ও টেমপ্লেট গ্যালারি</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO 2026
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              মেডিকেল, বোর্ড ও বিশ্ববিদ্যালয় ভর্তি পরীক্ষার অফিশিয়াল OMR শিট প্রিন্ট, কাস্টমাইজেশন ও অটো-গ্রেডিং হাব
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/print"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট হাব</span>
          </Link>
          <Link
            href="/exams"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors hidden sm:block"
          >
            পরীক্ষা তালিকা
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>৯৯.৯৯% নির্ভুল অপটিক্যাল মার্কার এলাইনমেন্ট প্রযুক্তি</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              বিশ্বমানের ব্ল্যাক & হোয়াইট এবং রঙিন OMR মাস্টার শীট
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              সরাসরি প্রিন্ট করার উপযোগী ভেক্টর কোয়ালিটি। খাঁটি <strong>NikoshBAN</strong> বাংলা ফন্ট, ৪-কোণা অপটিক্যাল ফিডুসিয়াল মার্কার এবং যেকোনো সাধারণ মোবাইল ক্যামেরা দিয়ে নিখুঁত স্ক্যানিং সুবিধা।
            </p>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>টেমপ্লেট গ্যালারি</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('studio');
                document.getElementById('omr-studio-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                activeTab === 'studio'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>OMR বিল্ডার ও কাস্টমাইজার</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-8">
        {/* Template Gallery Cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>অফিসিয়াল স্ট্যান্ডার্ড টেমপ্লেটসমূহ</span>
              </h3>
              <p className="text-xs text-slate-400">
                নিচে থেকে আপনার পছন্দের ফরম্যাট বেছে নিয়ে সরাসরি প্রিভিউ ও প্রিন্ট করুন
              </p>
            </div>
            <Link
              href="/exams/print"
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <span>সকল পরীক্ষার প্রশ্নসহ প্রিন্ট</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {officialTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tpl.badgeColor}`}>
                      {tpl.badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {tpl.themeColor}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-white group-hover:text-indigo-300 transition-colors leading-snug mb-1">
                    {tpl.title}
                  </h4>
                  <p className="text-[11px] font-medium text-indigo-400/90 mb-2">
                    {tpl.subtitle}
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {tpl.description}
                  </p>

                  <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-800/80">
                    {tpl.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="text-[10px] text-slate-400 font-semibold truncate">
                    🎯 {tpl.recommendedFor}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLaunchStudio(tpl.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>কাস্টমাইজ ও প্রিন্ট</span>
                    </button>
                    <Link
                      href="/exams/print"
                      className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                      title="প্রশ্নসহ প্রিন্ট পেজে যান"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live OMR Studio & Builder Container */}
        <section id="omr-studio-section" className="pt-4 border-t border-slate-800/80">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <span>লাইভ ওএমআর শিট কাস্টমাইজার ও প্রিন্টার</span>
              </h3>
              <p className="text-xs text-slate-400">
                প্রতিষ্ঠানের নাম, তারিখ, প্রশ্নের সংখ্যা ও কালার থিম পরিবর্তন করে সরাসরি প্রিন্ট করুন
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
            <BangladeshOMRGenerator
              onApplyGeneratedTemplate={(tpl) => {
                console.log('Applied template:', tpl);
              }}
              onNavigateToScanner={() => {
                router.push('/exams');
              }}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        Rofaz Academy Advanced OMR Engine • World-Class Vector Precision & Computer Vision Alignment
      </footer>
    </div>
  );
}
