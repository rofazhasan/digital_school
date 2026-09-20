'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  QuranReflection,
  HadithReflection,
  HijriDateInfo,
  AsmaUlHusnaItem,
  AuthenticDuaItem,
  PrayerTimesInfo,
} from '../../types';
import {
  Sparkles,
  BookOpen,
  Share2,
  Compass,
  Play,
  Pause,
  Volume2,
  Moon,
  Clock,
  HeartHandshake,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getFreshDuaAction } from '../../actions/reflection-actions';

interface ReflectionCardProps {
  quran: QuranReflection;
  hadith: HadithReflection;
  dayNumber?: number;
  hijriDate?: HijriDateInfo | null;
  asmaUlHusna?: AsmaUlHusnaItem[];
  dua?: AuthenticDuaItem | null;
  prayerTimes?: PrayerTimesInfo | null;
}

export function ReflectionCard({
  quran,
  hadith,
  dayNumber,
  hijriDate,
  asmaUlHusna = [],
  dua: initialDua,
  prayerTimes,
}: ReflectionCardProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'asma' | 'dua' | 'prayer'>('daily');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentDua, setCurrentDua] = useState<AuthenticDuaItem | null>(initialDua || null);
  const [isRefreshingDua, setIsRefreshingDua] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup audio listener when audioUrl changes
  useEffect(() => {
    if (!quran.audioUrl) return;

    const audio = new Audio(quran.audioUrl);
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setAudioProgress(0);
    };

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [quran.audioUrl]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.error('Audio playback error', err);
        toast.error('তেলাওয়াত অডিও চালু করা সম্ভব হয়নি।');
      });
      setIsPlayingAudio(true);
    }
  };

  const handleRefreshDua = async () => {
    setIsRefreshingDua(true);
    try {
      const res = await getFreshDuaAction();
      if (res.success && res.dua) {
        setCurrentDua(res.dua);
        toast.success('নতুন দোয়া লোড হয়েছে');
      }
    } catch {
      toast.error('দোয়া লোড করা যায়নি');
    } finally {
      setIsRefreshingDua(false);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `[আজকের আয়াত]\n${quran.arabicText}\n"${quran.banglaMeaning}"\n(সূরা ${quran.surahNameBangla}: ${quran.ayahNumber})\n\n[আজকের হাদিস]\n"${hadith.banglaText}"\n— ${hadith.sourceBook} (${hadith.hadithNumber})\n\nসদকায়ে জারিয়া: UmmahAPI`
      );
      toast.success('আজকের আয়াত ও হাদিস কপি করা হয়েছে!');
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur-md overflow-hidden transition-all">
      {/* Top Header with Hijri Date & UmmahAPI Badge */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/40 shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                ইসলামিক তাদাব্বুর ও আত্মশুদ্ধি
              </h3>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                UmmahAPI লাইভ
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              {hijriDate ? (
                <span className="font-medium text-cyan-600 dark:text-cyan-400">
                  {hijriDate.hijriFormatted} ({hijriDate.hijriMonthArabic})
                </span>
              ) : (
                <span>{dayNumber ? `বছরের ${dayNumber}তম দিন` : 'আজকের প্রতিচ্ছবি'}</span>
              )}
              <span>•</span>
              <span>{hijriDate?.gregorianDate || new Date().toLocaleDateString('bn-BD')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {quran.audioUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAudio}
              className={`h-8 px-3 rounded-full text-xs font-semibold gap-1.5 transition-all ${
                isPlayingAudio
                  ? 'bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600'
                  : 'text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>থামুন</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>তেলাওয়াত শুনুন</span>
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8 rounded-full text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
            title="কপি করুন"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Audio Progress Bar */}
      {isPlayingAudio && (
        <div className="w-full bg-cyan-100 dark:bg-cyan-950/50 h-1">
          <div
            className="bg-cyan-500 h-1 transition-all duration-200"
            style={{ width: `${audioProgress}%` }}
          />
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
        {[
          { id: 'daily', label: 'আয়াত ও হাদিস', icon: BookOpen },
          { id: 'asma', label: 'আসমাউল হুসনা (৯৯ নাম)', icon: Sparkles },
          { id: 'dua', label: 'দৈনিক দোয়া', icon: HeartHandshake },
          { id: 'prayer', label: 'নামাজের সময়সূচি', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="p-6 sm:p-7">
        {/* TAB 1: AYAH & HADITH */}
        {activeTab === 'daily' && (
          <div className="space-y-7">
            {/* Quran Ayah Section */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                    আজকের আয়াত
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    সূরা {quran.surahNameBangla} ({quran.surahNameEnglish}) • আয়াত {quran.ayahNumber}
                  </span>
                </div>
                {quran.reciterName && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    ক্বারী: {quran.reciterName}
                  </span>
                )}
              </div>

              {/* Arabic Text with RTL Calligraphy */}
              <div className="p-4 sm:p-6 rounded-2xl bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-100/70 dark:border-cyan-900/30 text-right">
                <p className="font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-cyan-100 leading-loose tracking-wide">
                  {quran.arabicText}
                </p>
              </div>

              {/* Bangla Pronunciation & Meaning */}
              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="text-slate-500 dark:text-slate-400 italic">
                  উচ্চারণ: {quran.banglaPronunciation}
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-100 leading-relaxed text-sm sm:text-base">
                  অর্থ: {quran.banglaMeaning}
                </p>
                {quran.englishMeaning && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                    "{quran.englishMeaning}"
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800" />

            {/* Hadith Section */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  আজকের হাদিস
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {hadith.sourceBook} (হাদিস নং {hadith.hadithNumber})
                </span>
              </div>

              {hadith.arabicText && (
                <div className="p-4 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 text-right">
                  <p className="font-arabic text-xl sm:text-2xl text-slate-800 dark:text-indigo-200 leading-loose">
                    {hadith.arabicText}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
                  "{hadith.banglaText}"
                </p>
                {hadith.englishText && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 pt-1 italic">
                    "{hadith.englishText}"
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1.5">
                  <span>সূত্র: {hadith.sourceBook}</span>
                  {hadith.chapter && <span>• অধ্যায়: {hadith.chapter}</span>}
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">• মান: {hadith.grade}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASMA-UL-HUSNA */}
        {activeTab === 'asma' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  আজকের জন্য আল্লাহর মোবারক নামসমূহ
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রতিদিনের যিকির ও ভাবনায় আল্লাহর গুণবাচক নাম স্মরণ করুন
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {asmaUlHusna.length} টি গুণবাচক নাম
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {asmaUlHusna.map((name) => (
                <div
                  key={name.number}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300">
                      {name.number}
                    </span>
                    <span className="font-arabic text-xl font-bold text-slate-900 dark:text-cyan-200">
                      {name.arabic}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {name.transliteration} ({name.english})
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {name.banglaMeaning || name.meaning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUTHENTIC DUA */}
        {activeTab === 'dua' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  দৈনিক বিশেষ দোয়া ও মুনাজাত
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  জ্ঞান বৃদ্ধি, মানসিক প্রশান্তি এবং পড়ালেখার বরকতের জন্য দোয়া
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshDua}
                disabled={isRefreshingDua}
                className="h-8 text-xs font-semibold gap-1.5 rounded-full"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingDua ? 'animate-spin' : ''}`} />
                <span>অন্য দোয়া</span>
              </Button>
            </div>

            {currentDua && (
              <div className="p-5 sm:p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {currentDua.categoryNameBangla || currentDua.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {currentDua.title}
                  </span>
                </div>

                <div className="text-right p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-indigo-100/50 dark:border-indigo-900/30">
                  <p className="font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-indigo-100 leading-loose">
                    {currentDua.arabic}
                  </p>
                </div>

                {currentDua.transliteration && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    উচ্চারণ: {currentDua.transliteration}
                  </p>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                    অর্থ: {currentDua.banglaTranslation || currentDua.translation}
                  </p>
                  {currentDua.source && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                      সূত্র: {currentDua.source}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRAYER TIMES */}
        {activeTab === 'prayer' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  আজকের নামাজের সময়সূচি (ঢাকা ও বাংলাদেশ)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  সময়মতো সালাত আদায় পড়াশোনায় বরকত ও একাগ্রতা বৃদ্ধি করে
                </p>
              </div>
              {prayerTimes?.nextPrayer && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                  পরবর্তী ওয়াক্ত: {prayerTimes.nextPrayer.toUpperCase()} ({prayerTimes.timeUntilNext})
                </span>
              )}
            </div>

            {prayerTimes && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'ফজর', time: prayerTimes.fajr, key: 'fajr' },
                  { name: 'সূর্যোদয়', time: prayerTimes.sunrise, key: 'sunrise' },
                  { name: 'যোহর', time: prayerTimes.dhuhr, key: 'dhuhr' },
                  { name: 'আসর', time: prayerTimes.asr, key: 'asr' },
                  { name: 'মাগরিব', time: prayerTimes.maghrib, key: 'maghrib' },
                  { name: 'এশা', time: prayerTimes.isha, key: 'isha' },
                ].map((item) => {
                  const isCurrent = prayerTimes.currentPrayer?.toLowerCase() === item.key;
                  const isNext = prayerTimes.nextPrayer?.toLowerCase() === item.key;
                  return (
                    <div
                      key={item.key}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        isNext
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 shadow-xs'
                          : isCurrent
                          ? 'border-cyan-400 bg-cyan-50/30 dark:bg-cyan-950/20 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        {item.name}
                      </p>
                      <p className="text-lg font-black tracking-tight">{item.time}</p>
                      {isNext && (
                        <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          পরবর্তী
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Acknowledgement */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
        <span>সদকায়ে জারিয়া: উম্মাহ এপিআই (UmmahAPI)</span>
        <a
          href="https://ummahapi.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-cyan-600 transition-colors"
        >
          <span>ummahapi.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
