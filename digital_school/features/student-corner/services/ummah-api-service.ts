import {
  QuranReflection,
  HadithReflection,
  HijriDateInfo,
  AsmaUlHusnaItem,
  AuthenticDuaItem,
  PrayerTimesInfo,
} from '../types';
import { getQuranReflectionForDay } from '../data/quran-365';
import { getHadithReflectionForDay } from '../data/hadith-365';

const UMMAH_API_BASE = 'https://ummahapi.com';

// Bengali meanings for Asma-ul-Husna attributes
const ASMA_BANGLA_MAP: Record<number, string> = {
  1: 'পরম দয়ালু, অফুরন্ত অনুগ্রহশীল',
  2: 'অসীম করুণাময়, নিরন্তর কৃপাবর্ষী',
  3: 'সার্বভৌম অধিপতি, প্রকৃত বাদশাহ',
  4: 'পরম পবিত্র, ত্রুটিমুক্ত সত্তা',
  5: 'শান্তি ও নিরাপত্তার মূল উৎস',
  6: 'নিরাপত্তা ও ঈমান প্রদানকারী',
  7: 'সকল কিছুর রক্ষক ও অভিভাবক',
  8: 'মহাপরাক্রমশালী, চির অপরাজিত',
  9: 'দুর্নিবার শক্তিধর, বাধ্যকারী',
  10: 'মহিমান্বিত, সর্বশ্রেষ্ঠ অহংকারবান',
  11: 'একমাত্র স্রষ্টা, রূপকার',
  12: 'অনস্তিত্ব থেকে অস্তিত্বদানকারী',
  13: 'আকৃতি দানকারী, সুন্দরতম নির্মাতা',
  14: 'মহাক্ষমাশীল, পাপ মোচনকারী',
  15: 'মহাপ্রতাপশালী, দমনকারী',
};

// Bengali translations for common authentic duas
const DUAS_BANGLA_MAP: Record<string, { titleBangla: string; translationBangla: string }> = {
  knowledge: {
    titleBangla: 'জ্ঞান ও প্রজ্ঞা বৃদ্ধির দোয়া',
    translationBangla: 'হে আমার প্রতিপালক! আমার জ্ঞান বাড়িয়ে দিন। (সূরা ত্বা-হা: ১১৪)',
  },
  anxiety: {
    titleBangla: 'উদ্বেগ, হতাশা ও ঋণমুক্তি লাভের দোয়া',
    translationBangla: 'হে আল্লাহ! আমি আপনার আশ্রয় প্রার্থনা করছি উৎকণ্ঠা, বিষণ্ণতা, অক্ষমতা, অলসতা, ভীরুতা, কৃপণতা, ঋণের বোঝা এবং মানুষের দমন-পীড়ন হতে। (বুখারী)',
  },
  morning: {
    titleBangla: 'সকালের বরকত ও কল্যাণের দোয়া',
    translationBangla: 'আমরা এবং নিখিল সৃষ্টি এই সকালে উপনীত হয়েছি মহান আল্লাহর জন্য। সকল প্রশংসা আল্লাহর যিনি আমাদের পুনরুজ্জীবিত করেছেন।',
  },
  study: {
    titleBangla: 'পড়াশোনা ও পরীক্ষার জটিলতা সহজ করার দোয়া',
    translationBangla: 'হে আল্লাহ! আপনি যা সহজ করে দেন তা ছাড়া কোনো কিছুই সহজ নয়; আর আপনি চাইলে কঠিন কাজকেও সহজ করে দিতে পারেন। (ইবনে হিব্বান)',
  },
};

// In-memory cache for Hijri Date to prevent repeated external network requests
let cachedHijri: { data: HijriDateInfo; expiresAt: number } | null = null;

/**
 * Fetch wrapper with aggressive timeout and error handling
 */
async function fetchUmmahApi<T>(endpoint: string, revalidateSeconds = 3600): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

  try {
    const res = await fetch(`${UMMAH_API_BASE}${endpoint}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: revalidateSeconds },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.success && json?.data ? (json.data as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch today's Quran Ayah with live Mishary Alafasy audio and native Bangla translation
 */
export async function getLiveQuranReflection(dayOfYear: number): Promise<QuranReflection> {
  // Always get offline backup first as guarantee
  const localFallback = getQuranReflectionForDay(dayOfYear);

  try {
    const data = await fetchUmmahApi<any>(
      `/api/quran/surah/${localFallback.surahNumber}/ayah/${localFallback.ayahNumber}`,
      86400
    );

    if (data?.verse) {
      const verse = data.verse;
      const translations = verse.translations || {};
      const audioList = data.audio || [];
      const primaryAudio = audioList[0]; // Mishary Rashid Alafasy by default

      return {
        ...localFallback,
        arabicText: verse.arabic || localFallback.arabicText,
        banglaPronunciation: verse.transliteration || localFallback.banglaPronunciation,
        // UmmahAPI natively provides `bengali` translation!
        banglaMeaning: translations.bengali || localFallback.banglaMeaning,
        englishMeaning: translations.sahih_international || localFallback.englishMeaning,
        audioUrl: primaryAudio?.ayah_audio || undefined,
        reciterName: primaryAudio?.reciter || 'Mishary Rashid Alafasy',
      };
    }
  } catch (err) {
    console.warn('UmmahAPI Quran fetch fallback to local data', err);
  }

  return localFallback;
}

/**
 * Fetch today's Hadith from UmmahAPI collections or fallback to curated 365 Hadiths
 */
export async function getLiveHadithReflection(dayOfYear: number): Promise<HadithReflection> {
  const localFallback = getHadithReflectionForDay(dayOfYear);

  try {
    // Map some known collections from UmmahAPI
    const collectionKey = localFallback.sourceBook.toLowerCase().includes('bukhari')
      ? 'bukhari'
      : localFallback.sourceBook.toLowerCase().includes('muslim')
      ? 'muslim'
      : localFallback.sourceBook.toLowerCase().includes('tirmidhi')
      ? 'tirmidhi'
      : 'bukhari';

    const hadithNum = parseInt(localFallback.hadithNumber.replace(/\D/g, ''), 10) || 1;
    const data = await fetchUmmahApi<any>(`/api/hadith/${collectionKey}/${hadithNum}`, 86400);

    if (data) {
      return {
        ...localFallback,
        arabicText: data.arabic || localFallback.arabicText,
        englishText: data.english || localFallback.englishText,
        grade: data.grade || localFallback.grade,
      };
    }
  } catch (err) {
    console.warn('UmmahAPI Hadith fetch fallback to local data', err);
  }

  return localFallback;
}

/**
 * Fetch today's Hijri Islamic calendar date
 */
export async function getLiveHijriDate(): Promise<HijriDateInfo> {
  const now = new Date();
  const defaultFallback: HijriDateInfo = {
    gregorianDate: now.toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    hijriFormatted: '১৪৪৮ হিজরি',
    hijriDay: now.getDate(),
    hijriMonth: 'রবিউস সানি',
    hijriMonthArabic: 'رَبِيع الثَّانِي',
    hijriYear: 1448,
  };

  // Return cached result immediately (0ms) if valid
  if (cachedHijri && cachedHijri.expiresAt > Date.now()) {
    return cachedHijri.data;
  }

  try {
    const data = await fetchUmmahApi<any>('/api/today-hijri', 3600);
    if (data?.hijri) {
      const result: HijriDateInfo = {
        gregorianDate: data.gregorian?.formatted || defaultFallback.gregorianDate,
        hijriFormatted: data.hijri.formatted || defaultFallback.hijriFormatted,
        hijriDay: data.hijri.day || defaultFallback.hijriDay,
        hijriMonth: data.hijri.month_name || defaultFallback.hijriMonth,
        hijriMonthArabic: data.hijri.month_name_arabic || defaultFallback.hijriMonthArabic,
        hijriYear: data.hijri.year || defaultFallback.hijriYear,
      };

      // Cache in memory for 12 hours
      cachedHijri = {
        data: result,
        expiresAt: Date.now() + 12 * 3600 * 1000,
      };

      return result;
    }
  } catch (err) {
    console.warn('UmmahAPI Hijri fetch error', err);
  }

  // Cache fallback for 1 hour so failure does not repeatedly retry on every click
  cachedHijri = {
    data: defaultFallback,
    expiresAt: Date.now() + 3600 * 1000,
  };

  return defaultFallback;
}

/**
 * Fetch today's 99 Names of Allah (Asma-ul-Husna)
 */
export async function getLiveAsmaUlHusna(): Promise<AsmaUlHusnaItem[]> {
  try {
    const dayOfWeek = new Date().getDay() + 1; // 1 to 7
    const data = await fetchUmmahApi<any>(`/api/asma-ul-husna/daily/${dayOfWeek}`, 86400);

    if (data?.names && Array.isArray(data.names)) {
      return data.names.map((item: any) => ({
        number: item.number,
        arabic: item.arabic,
        transliteration: item.transliteration,
        english: item.english,
        meaning: item.meaning,
        banglaMeaning: ASMA_BANGLA_MAP[item.number] || item.meaning,
      }));
    }
  } catch (err) {
    console.warn('UmmahAPI Asma-ul-Husna fetch error', err);
  }

  // Default fallback to first 5 names of Allah
  return [
    { number: 1, arabic: 'الرَّحْمٰنُ', transliteration: 'Ar-Rahman', english: 'The Most Merciful', meaning: 'The Entirely Merciful', banglaMeaning: 'পরম দয়ালু, অসীম অনুগ্রহশীল' },
    { number: 2, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Raheem', english: 'The Most Compassionate', meaning: 'The Especially Merciful', banglaMeaning: 'অসীম করুণাময়, নিরন্তর কৃপাবর্ষী' },
    { number: 3, arabic: 'المَلِكُ', transliteration: 'Al-Malik', english: 'The King', meaning: 'The Sovereign Lord', banglaMeaning: 'সার্বভৌম অধিপতি, প্রকৃত বাদশাহ' },
    { number: 4, arabic: 'القُدُّوسُ', transliteration: 'Al-Quddoos', english: 'The Most Holy', meaning: 'The Pure and Flawless', banglaMeaning: 'পরম পবিত্র, সকল ত্রুটিমুক্ত' },
    { number: 5, arabic: 'السَّلاَمُ', transliteration: 'As-Salaam', english: 'The Source of Peace', meaning: 'The Perfection and Giver of Peace', banglaMeaning: 'শান্তি ও নিরাপত্তার মূল উৎস' },
  ];
}

/**
 * Fetch authentic study / life Dua from UmmahAPI
 */
export async function getLiveRandomDua(category?: string): Promise<AuthenticDuaItem> {
  const defaultDua: AuthenticDuaItem = {
    id: 'study-1',
    category: 'knowledge',
    categoryNameBangla: 'জ্ঞান ও প্রজ্ঞা',
    title: 'জ্ঞান বৃদ্ধির দোয়া',
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ilma',
    translation: 'My Lord, increase me in knowledge.',
    banglaTranslation: 'হে আমার প্রতিপালক! আমার জ্ঞান বাড়িয়ে দিন। (সূরা ত্বা-হা: ১১৪)',
    source: 'সূরা ত্বা-হা (২০:১১৪)',
  };

  try {
    const endpoint = category ? `/api/duas/category/${category}` : '/api/duas/random';
    const data = await fetchUmmahApi<any>(endpoint, 1800);

    if (data) {
      const item = Array.isArray(data) ? data[0] : data;
      const catKey = item.category || 'knowledge';
      const banglaInfo = DUAS_BANGLA_MAP[catKey] || {
        titleBangla: item.title,
        translationBangla: item.translation,
      };

      return {
        id: item.id || 'dua-live',
        category: catKey,
        categoryNameBangla: banglaInfo.titleBangla,
        title: item.title || banglaInfo.titleBangla,
        arabic: item.arabic,
        transliteration: item.transliteration,
        translation: item.translation,
        banglaTranslation: banglaInfo.translationBangla,
        source: item.source || 'সহিহ হাদিস / আল-কুরআন',
      };
    }
  } catch (err) {
    console.warn('UmmahAPI Dua fetch error', err);
  }

  return defaultDua;
}

/**
 * Fetch prayer times for Dhaka (default) or given lat/lng
 */
export async function getLivePrayerTimes(lat = 23.8103, lng = 90.4125): Promise<PrayerTimesInfo> {
  const defaultFallback: PrayerTimesInfo = {
    date: new Date().toISOString().split('T')[0],
    timezone: 'Asia/Dhaka',
    fajr: '04:31',
    sunrise: '05:46',
    dhuhr: '11:53',
    asr: '15:18',
    maghrib: '17:57',
    isha: '19:08',
    currentPrayer: 'dhuhr',
    nextPrayer: 'asr',
    timeUntilNext: '৩ ঘণ্টা ২৫ মিনিট',
  };

  try {
    const data = await fetchUmmahApi<any>(
      `/api/prayer-times?latitude=${lat}&longitude=${lng}&madhab=Hanafi`,
      3600
    );

    if (data?.prayer_times) {
      const pt = data.prayer_times;
      const cs = data.current_status || {};
      return {
        date: data.date || defaultFallback.date,
        timezone: data.timezone || defaultFallback.timezone,
        fajr: pt.fajr || defaultFallback.fajr,
        sunrise: pt.sunrise || defaultFallback.sunrise,
        dhuhr: pt.dhuhr || defaultFallback.dhuhr,
        asr: pt.asr || defaultFallback.asr,
        maghrib: pt.maghrib || defaultFallback.maghrib,
        isha: pt.isha || defaultFallback.isha,
        currentPrayer: cs.current_prayer,
        nextPrayer: cs.next_prayer,
        timeUntilNext: cs.time_until_next,
      };
    }
  } catch (err) {
    console.warn('UmmahAPI Prayer Times fetch error', err);
  }

  return defaultFallback;
}

/**
 * Composite function fetching the complete daily spiritual package concurrently
 */
export async function getFullSpiritualPackage(dayOfYear: number) {
  const [quranRes, hadithRes, hijriRes, asmaRes, duaRes, prayerRes] = await Promise.allSettled([
    getLiveQuranReflection(dayOfYear),
    getLiveHadithReflection(dayOfYear),
    getLiveHijriDate(),
    getLiveAsmaUlHusna(),
    getLiveRandomDua(),
    getLivePrayerTimes(),
  ]);

  return {
    quran: quranRes.status === 'fulfilled' ? quranRes.value : getQuranReflectionForDay(dayOfYear),
    hadith: hadithRes.status === 'fulfilled' ? hadithRes.value : getHadithReflectionForDay(dayOfYear),
    hijriDate: hijriRes.status === 'fulfilled' ? hijriRes.value : null,
    asmaUlHusna: asmaRes.status === 'fulfilled' ? asmaRes.value : [],
    dua: duaRes.status === 'fulfilled' ? duaRes.value : null,
    prayerTimes: prayerRes.status === 'fulfilled' ? prayerRes.value : null,
    source: 'UmmahAPI (সদকায়ে জারিয়া) & Local Hybrid Sync',
  };
}
