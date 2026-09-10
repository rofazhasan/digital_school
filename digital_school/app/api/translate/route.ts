import { NextRequest, NextResponse } from 'next/server';
import { translateEnglishToBangla, translateBanglaToEnglish } from '@/utils/banglaConverter';

// In-memory cache with size limit and TTL
interface CacheEntry {
  translation: string;
  timestamp: number;
}
const CACHE_LIMIT = 5000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const translationCache = new Map<string, CacheEntry>();

function getCacheKey(text: string, sl: string, tl: string): string {
  return `${sl}:${tl}:${text.trim().toLowerCase()}`;
}

/**
 * Primary neural translator: Google Translate Extension API
 */
async function translateWithGoogle(text: string, sl: string, tl: string): Promise<string | null> {
  try {
    const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=${tl}&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      return data[0].trim();
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Secondary neural translator: MyMemory API
 */
async function translateWithMyMemory(text: string, sl: string, tl: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sl}|${tl}&de=admin@digital-school.org`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DigitalSchool/1.0',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    if (translated && typeof translated === 'string' && !translated.startsWith('MYMEMORY WARNING')) {
      return translated.trim();
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, from, to } = body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ success: true, translation: '', provider: 'empty' });
    }

    const trimmed = text.trim();

    // Auto-detect direction if not explicitly given
    let source = from || 'auto';
    let target = to || 'bn';

    if (source === 'auto') {
      const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
      if (hasBengali) {
        source = 'bn';
        target = 'en';
      } else {
        source = 'en';
        target = 'bn';
      }
    }

    const cacheKey = getCacheKey(trimmed, source, target);
    const cached = translationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ success: true, translation: cached.translation, provider: 'cache' });
    }

    // 1. Try Google Translate Extension API
    let result = await translateWithGoogle(trimmed, source, target);
    let provider = 'google';

    // 2. Fallback to MyMemory
    if (!result) {
      result = await translateWithMyMemory(trimmed, source, target);
      provider = 'mymemory';
    }

    // 3. Fallback to offline academic lexicon
    if (!result) {
      if (target === 'bn') {
        result = translateEnglishToBangla(trimmed);
      } else {
        result = translateBanglaToEnglish(trimmed);
      }
      provider = 'lexicon';
    }

    // Save to cache
    if (result) {
      if (translationCache.size >= CACHE_LIMIT) {
        const firstKey = translationCache.keys().next().value;
        if (firstKey) translationCache.delete(firstKey);
      }
      translationCache.set(cacheKey, { translation: result, timestamp: Date.now() });
    }

    return NextResponse.json({
      success: true,
      translation: result || trimmed,
      provider,
      source,
      target
    });
  } catch (err: any) {
    console.error('Translation error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  const from = searchParams.get('from') || 'auto';
  const to = searchParams.get('to') || 'bn';

  return POST(new NextRequest(req.url, {
    method: 'POST',
    body: JSON.stringify({ text, from, to })
  }));
}
