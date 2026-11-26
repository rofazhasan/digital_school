"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  FileText,
  ScanLine,
  CheckCircle2,
  Layers,
  Search,
} from 'lucide-react';
import { BangladeshOMRGenerator, type PresetType } from '@/app/components/omr/BangladeshOMRGenerator';

export default function ExamPrintHubPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'blank_omr' | 'select_exam'>('blank_omr');
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('medical_100');

  useEffect(() => {
    async function loadRecentExams() {
      try {
        const res = await fetch('/api/exams?limit=30');
        if (res.ok) {
          const data = await res.json();
          const raw = data?.data || data?.exams || data;
          setExams(Array.isArray(raw) ? raw : []);
        }
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecentExams();
  }, []);

  const filteredExams = exams.filter((e) => {
    const title = (e.name || e.title || '').toLowerCase();
    const subject = (e.subject || '').toLowerCase();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return title.includes(q) || subject.includes(q);
  });

  const quickMasterCards: Array<{
    id: PresetType;
    badge: string;
    badgeCls: string;
    title: string;
    desc: string;
    foot: string;
    footCls: string;
  }> = [
    {
      id: 'medical_100',
      badge: 'মেডিকেল মাস্টার',
      badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      title: '১০০-প্রশ্ন মেডিকেল ভর্তি OMR',
      desc: 'ক্যান্ডিডেট বক্স, রোল ৭ ডিজিট, সিরিয়াল ও ১০০-প্রশ্ন গ্রিড',
      foot: '৪-কোণা অপটিক্যাল ফিডুসিয়াল',
      footCls: 'text-emerald-400',
    },
    {
      id: 'hsc_ssc_50',
      badge: 'শিক্ষা বোর্ড',
      badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      title: 'এইচএসসি/এসএসসি ৫০-প্রশ্ন OMR',
      desc: 'রোল ৬ ডিজিট, রেজি ১০ ডিজিট, বিষয় কোড ৩ ডিজিট ও সেট ক/খ/গ/ঘ',
      foot: 'বোর্ড স্ট্যান্ডার্ড সাইজিং',
      footCls: 'text-purple-400',
    },
    {
      id: 'gst_cluster',
      badge: 'বিশ্ববিদ্যালয় ভর্তি',
      badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      title: 'ঢাবি ও জিএসটি গুচ্ছ ১০০-প্রশ্ন',
      desc: 'নেগেটিভ মার্কিং সতর্কবার্তা, ৪ কলাম গ্রিড ও সেট A-D',
      foot: 'QR ও বারকোড সিকিউরিটি',
      footCls: 'text-blue-400',
    },
    {
      id: 'hsc_ssc_25',
      badge: 'মডেল টেস্ট',
      badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      title: '২৫-প্রশ্ন কম্প্যাক্ট স্পিড শিট',
      desc: 'কোচিং, সাপ্তাহিক টেস্ট ও দ্রুত ক্লাসরুম মূল্যায়নের জন্য নিখুঁত',
      foot: 'কালি-সাশ্রয়ী ও দ্রুত স্ক্যান',
      footCls: 'text-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5 flex items-center justify-between">
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
              <Printer className="w-5 h-5 text-indigo-400" />
              <span>পরীক্ষা প্রশ্নপত্র ও OMR প্রিন্ট হাব</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                OMR v3 Ready
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              মেডিকেল অ্যাডমিশন মাস্টার (A3/A4), বোর্ড OMR, এবং পূর্ণাঙ্গ প্রশ্নপত্র প্রিন্ট ও ম্যানেজমেন্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/omr-templates"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 hidden sm:flex items-center gap-1.5 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-indigo-400" />
            <span>টেমপ্লেট হাব</span>
          </Link>
          <Link
            href="/exams/bulk-print"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>বাল্ক প্রিন্ট</span>
          </Link>
          <Link
            href="/exams/omr-scan"
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>OMR স্ক্যানার</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('blank_omr')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'blank_omr'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ScanLine className="w-4 h-4 text-indigo-300" />
            <span>অফিসিয়াল OMR শিট প্রিন্ট স্টুডিও</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('select_exam')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'select_exam'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>পরীক্ষার প্রশ্নপত্র ও QR-যুক্ত OMR প্রিন্ট ({exams.length})</span>
          </button>
        </div>

        {activeTab === 'select_exam' ? (
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="পরীক্ষার নাম বা বিষয় লিখে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-400">
                মোট পরীক্ষা: <span className="font-bold text-white">{filteredExams.length}</span> টি
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">পরীক্ষা তালিকা লোড হচ্ছে...</p>
              </div>
            ) : filteredExams.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-xl text-slate-400">
                কোন পরীক্ষা পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/10"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {exam.subject || 'সাধারণ'}
                        </span>
                        {exam.date && (
                          <span className="text-[11px] text-slate-400">
                            {new Date(exam.date).toLocaleDateString('bn-BD')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1">
                        {exam.name || exam.title || 'নামবিহীন পরীক্ষা'}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                        পূর্ণমান: {exam.totalMarks || 100} | সময়: {exam.duration || 60} মি.
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                      <Link
                        href={`/exams/${exam.id}/print`}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>প্রিন্ট করুন</span>
                      </Link>
                      <Link
                        href={`/exams/${exam.id}/omr-scan`}
                        className="py-1.5 px-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
                        <span>OMR স্ক্যান</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Interactive Quick Master Preset Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              {quickMasterCards.map((card) => {
                const isSelected = selectedPreset === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedPreset(card.id)}
                    className={`text-left p-3.5 rounded-xl bg-slate-900 border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/25 shadow-lg shadow-indigo-950/40'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${card.badgeCls}`}>
                        {card.badge}
                      </span>
                      <h4 className="font-bold text-sm text-white mt-1.5">{card.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
                    </div>
                    <div className="mt-3">
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${card.footCls}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> {card.foot}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <BangladeshOMRGenerator
                key={selectedPreset}
                initialPreset={selectedPreset}
                hideTopHeader={true}
                onApplyGeneratedTemplate={(tpl) => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('rofaz_active_omr_template', JSON.stringify(tpl));
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
    </div>
  );
}
