"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Printer,
  ArrowLeft,
  FileText,
  ScanLine,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  Settings2,
  BookOpen,
  Search
} from 'lucide-react';
import { BangladeshOMRGenerator } from '@/app/components/omr/BangladeshOMRGenerator';

export default function ExamPrintHubPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'blank_omr' | 'select_exam'>('blank_omr');

  useEffect(() => {
    async function loadRecentExams() {
      try {
        const res = await fetch('/api/exams?limit=15');
        if (res.ok) {
          const data = await res.json();
          setExams(Array.isArray(data) ? data : data.exams || []);
        }
      } catch (err) {
        console.error('Failed to load exams', err);
      } finally {
        setLoading(false);
      }
    }
    loadRecentExams();
  }, []);

  const filteredExams = exams.filter(e => {
    const title = e.title?.toLowerCase() || '';
    const subject = e.subject?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return title.includes(q) || subject.includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
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
                World-Class B&W
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              মেডিকেল অ্যাডমিশন মাস্টার (A3/A4), বোর্ড OMR, এবং পূর্ণাঙ্গ প্রশ্নপত্র প্রিন্ট ও ম্যানেজমেন্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/bulk-print"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>বাল্ক প্রিন্ট</span>
          </Link>
          <Link
            href="/exams"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            পরীক্ষা তালিকা
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('blank_omr')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'blank_omr'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <ScanLine className="w-4 h-4 text-indigo-300" />
            <span>অফিসিয়াল OMR শিট টেমপ্লেট গ্যালারি</span>
          </button>

          <button
            onClick={() => setActiveTab('select_exam')}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${
              activeTab === 'select_exam'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>পরীক্ষার প্রশ্নপত্র ও OMR প্রিন্ট নির্বাচন</span>
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
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">
                        ক্লাস: {exam.class || exam.grade || 'সকল'} | সময়: {exam.duration || 60} মি.
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
            {/* Quick Master Templates Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    মেডিকেল মাস্টার
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1.5">১০০-প্রশ্ন মেডিকেল ভর্তি OMR</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    ক্যান্ডিডেট বক্স, রোল ৮ ডিজিট, সিরিয়াল, ২ কলাম ৫০-প্রশ্ন ও স্কোর স্ট্রিপ
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ৪-কোণা অপটিক্যাল ফিডুসিয়াল
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    শিক্ষা বোর্ড
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1.5">এইচএসসি/এসএসসি ৫০-প্রশ্ন OMR</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    রোল ৬ ডিজিট, রেজি ১০ ডিজিট, বিষয় কোড ৩ ডিজিট ও সেট ক/খ/গ/ঘ
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-purple-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> বোর্ড স্ট্যান্ডার্ড সাইজিং
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    বিশ্ববিদ্যালয় ভর্তি
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1.5">ঢাবি ও জিএসটি গুচ্ছ ১০০-প্রশ্ন</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    নেগেটিভ মার্কিং সতর্কবার্তা, ৪ কলাম গ্রিড ও সার্বজনীন সেট অপশন
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> বারকোড ও সিকিউরিটি মার্ক
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    মডেল টেস্ট
                  </span>
                  <h4 className="font-bold text-sm text-white mt-1.5">৫০-প্রশ্ন কম্প্যাক্ট শিট</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    কোচিং, সাপ্তাহিক টেস্ট ও দ্রুত ক্লাসরুম মূল্যায়নের জন্য নিখুঁত
                  </p>
                </div>
                <div className="mt-3">
                  <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> দ্রুত স্ক্যান ফ্রেন্ডলি
                  </span>
                </div>
              </div>
            </div>

            {/* OMR Customizer & Generator */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <BangladeshOMRGenerator
                onApplyGeneratedTemplate={(tpl) => {
                  console.log('Applied template', tpl);
                }}
                onNavigateToScanner={() => {
                  router.push('/exams');
                }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

