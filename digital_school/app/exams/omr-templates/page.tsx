"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { BangladeshOMRGenerator } from '@/app/components/omr/BangladeshOMRGenerator';
import { ArrowLeft, Sparkles, ScanLine, Printer } from 'lucide-react';
import Link from 'next/link';

export default function OMRTemplatesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
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
              <span>বাংলাদেশ স্ট্যান্ডার্ড OMR শিট টেমপ্লেট গ্যালারি</span>
            </h1>
            <p className="text-xs text-slate-400">
              এইচএসসি/এসএসসি বোর্ড, মেডিকেল ভর্তি, ঢাবি, জিএসটি ও কৃষি গুচ্ছের অফিসিয়াল OMR প্রিন্ট ও এক্সপোর্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/exams/print"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট ও OMR হাব</span>
          </Link>
          <Link
            href="/exams"
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            পরীক্ষা তালিকা
          </Link>
        </div>
      </header>

      {/* Migration Notice Banner */}
      <div className="bg-indigo-950/40 border-b border-indigo-900/60 px-4 py-2.5 text-xs text-indigo-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            <strong>নতুন ফিচার:</strong> OMR টেমপ্লেট ও প্রিন্টিং এখন সরাসরি <strong>/exams/print</strong> এবং প্রতিটি পরীক্ষার <strong>/exams/[id]/print</strong> এ যুক্ত হয়েছে।
          </span>
        </div>
        <Link
          href="/exams/print"
          className="text-xs font-bold text-indigo-300 hover:text-white underline shrink-0"
        >
          প্রিন্ট হাবে যান &rarr;
        </Link>
      </div>

      {/* Main OMR Generator Workspace */}
      <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
        <BangladeshOMRGenerator
          onApplyGeneratedTemplate={(tpl) => {
            console.log('Generated Template:', tpl);
          }}
          onNavigateToScanner={() => {
            router.push('/exams');
          }}
        />
      </main>
    </div>
  );
}

