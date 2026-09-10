/**
 * High-performance, zero-latency Bangla <-> English converter and answer format detector.
 * 100% client-side with 0ms network latency.
 */

// ==========================================
// 1. Numerals Conversion
// ==========================================

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ASCII_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const EN_TO_BN_MAP: Record<string, string> = {
  '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
  '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
};

const BN_TO_EN_MAP: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Converts Arabic numerals (0-9) to Bengali numerals (০-৯).
 */
export function toBengaliNumerals(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.replace(/[0-9]/g, (d) => EN_TO_BN_MAP[d] || d);
}

/**
 * Converts Bengali numerals (০-৯) to Arabic numerals (0-9).
 */
export function toEnglishNumerals(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str.replace(/[\u09E6-\u09EF]/g, (d) => BN_TO_EN_MAP[d] || d);
}

/**
 * Smart numeral toggle: If text contains Bengali digits, convert to English;
 * otherwise if it contains English digits, convert to Bengali.
 */
export function toggleNumerals(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  const hasBengali = /[\u09E6-\u09EF]/.test(str);
  if (hasBengali) {
    return toEnglishNumerals(str);
  }
  const hasEnglish = /[0-9]/.test(str);
  if (hasEnglish) {
    return toBengaliNumerals(str);
  }
  return str;
}

// ==========================================
// 2. Answer Format Detection
// ==========================================

export type AnswerFormatHint = 'numeric' | 'bangla' | 'english' | 'mix';

export interface FormatHintConfig {
  type: AnswerFormatHint;
  labelBn: string;
  labelEn: string;
  badgeClass: string;
  iconName: 'hash' | 'type' | 'languages' | 'sparkles';
  example: string;
}

export const FORMAT_HINT_CONFIGS: Record<AnswerFormatHint, FormatHintConfig> = {
  numeric: {
    type: 'numeric',
    labelBn: 'সংখ্যা',
    labelEn: 'Numeric',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/80',
    iconName: 'hash',
    example: '123, 3.14, 10^5'
  },
  bangla: {
    type: 'bangla',
    labelBn: 'বাংলা',
    labelEn: 'Bangla',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
    iconName: 'languages',
    example: 'যেমন: নেফ্রন, মাইটোকন্ড্রিয়া'
  },
  english: {
    type: 'english',
    labelBn: 'ইংরেজি',
    labelEn: 'English',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80',
    iconName: 'type',
    example: 'e.g. Nephron, Mitochondria'
  },
  mix: {
    type: 'mix',
    labelBn: 'মিশ্র',
    labelEn: 'Mix',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/80',
    iconName: 'sparkles',
    example: 'e.g. 20 N, 2x+1, H2O'
  }
};

/**
 * Detects whether the expected answer is numeric, Bengali, English, or mix.
 * Inspects expected answer, model answer, type, or units without leaking the answer itself.
 */
export function detectAnswerFormat(expectedAnswer: any, partType?: string): AnswerFormatHint {
  const pType = String(partType || '').trim().toLowerCase();

  // If part type explicitly implies numbers
  const numericTypes = ['integer', 'decimal', 'numeric', 'int', 'fraction', 'number', 'math', 'equation'];
  if (numericTypes.includes(pType)) {
    if (expectedAnswer === undefined || expectedAnswer === null || String(expectedAnswer).trim() === '') {
      return 'numeric';
    }
  }

  if (expectedAnswer === undefined || expectedAnswer === null) {
    return 'numeric';
  }

  const str = String(expectedAnswer).trim();
  if (!str) {
    if (numericTypes.includes(pType)) return 'numeric';
    return 'numeric';
  }

  // Check character compositions
  // Bengali alphabet letters (excluding Bengali digits)
  const hasBengaliAlpha = /[\u0980-\u09E5\u09F0-\u09FF]/.test(str);
  // Bengali digits
  const hasBengaliDigits = /[\u09E6-\u09EF]/.test(str);
  // Latin letters
  const hasLatinLetters = /[a-zA-Z]/.test(str);
  // ASCII digits
  const hasAsciiDigits = /[0-9]/.test(str);

  const hasDigits = hasAsciiDigits || hasBengaliDigits;
  const hasLetters = hasBengaliAlpha || hasLatinLetters;

  // Check if string contains only digits, whitespace, and common mathematical notation
  // Allow symbols: . , / * + - ^ ( ) [ ] % \pi \pm \times \cdot \sqrt e E
  const mathCharsRegex = /^[0-9\u09E6-\u09EF\s\.\,\/\*\+\-\^\(\)\[\]\%\\eEpiPISQRTsqrt]+$/;
  if (mathCharsRegex.test(str)) {
    const cleanedOfMath = str.replace(/[0-9\u09E6-\u09EF\s\.\,\/\*\+\-\^\(\)\[\]\%\\]/g, '').toLowerCase();
    if (['', 'pi', 'e', 'sqrt', 'sqrt()'].includes(cleanedOfMath)) {
      return 'numeric';
    }
  }

  // If it contains both letters and digits -> 'mix' (e.g. "20 N", "2x+1", "H2O", "৩য় পর্যায়")
  if (hasLetters && hasDigits) {
    return 'mix';
  }

  // If it has both Bengali letters and English letters -> 'mix'
  if (hasBengaliAlpha && hasLatinLetters) {
    return 'mix';
  }

  // Pure Bengali text
  if (hasBengaliAlpha && !hasLatinLetters && !hasDigits) {
    return 'bangla';
  }

  // Pure English text
  if (hasLatinLetters && !hasBengaliAlpha && !hasDigits) {
    return 'english';
  }

  // Pure digits / numbers
  if (hasDigits && !hasLetters) {
    return 'numeric';
  }

  return 'mix';
}

// ==========================================
// 3. Science Synonym & Transliteration Mappings
// ==========================================

const SCIENCE_SYNONYMS: [string, string][] = [
  ['mitochondria', 'মাইটোকন্ড্রিয়া'],
  ['nephron', 'নেফ্রন'],
  ['chloroplast', 'ক্লোরোপ্লাস্ট'],
  ['plastid', 'প্লাস্টিড'],
  ['nucleus', 'নিউক্লিয়াস'],
  ['chromosome', 'ক্রোমোজোম'],
  ['centriole', 'সেন্ট্রিওল'],
  ['lysosome', 'লাইসোজোম'],
  ['ribosome', 'রাইবোজোম'],
  ['photosynthesis', 'সালোকসংশ্লেষণ'],
  ['respiration', 'শ্বসন'],
  ['glucose', 'গ্লুকোজ'],
  ['oxygen', 'অক্সিজেন'],
  ['nitrogen', 'নাইট্রোজেন'],
  ['hydrogen', 'হাইড্রোজেন'],
  ['carbon', 'কার্বন'],
  ['methane', 'মিথেন'],
  ['sulfuric acid', 'সালফিউরিক এসিড'],
  ['hydrochloric acid', 'হাইড্রোক্লোরিক এসিড'],
  ['nitric acid', 'নাইট্রিক এসিড'],
  ['acceleration', 'ত্বরণ'],
  ['velocity', 'বেগ'],
  ['speed', 'দ্রুতি'],
  ['force', 'বল'],
  ['work', 'কাজ'],
  ['power', 'ক্ষমতা'],
  ['energy', 'শক্তি'],
  ['kinetic energy', 'গতিশক্তি'],
  ['potential energy', 'বিভব শক্তি'],
  ['momentum', 'ভরবেগ'],
  ['mass', 'ভর'],
  ['gravity', 'অভিকর্ষ'],
  ['friction', 'ঘর্ষণ'],
  ['density', 'ঘনত্ব'],
  ['pressure', 'চাপ'],
  ['temperature', 'তাপমাত্রা'],
  ['heat', 'তাপ'],
  ['current', 'তড়িৎ প্রবাহ'],
  ['voltage', 'ভোল্টেজ'],
  ['resistance', 'রোধ'],
  ['wavelength', 'তরঙ্গদৈর্ঘ্য'],
  ['frequency', 'কম্পাঙ্ক'],
  ['period', 'পর্যায়কাল'],
  ['cell', 'কোষ'],
  ['tissue', 'টিস্যু'],
  ['organ', 'অঙ্গ'],
  ['enzyme', 'এনজাইম'],
  ['hormone', 'হরমোন'],
  ['protein', 'আমিষ'],
  ['lipid', 'স্নেহ'],
  ['carbohydrate', 'শর্করা'],
  ['acid', 'এসিড'],
  ['base', 'ক্ষার'],
  ['salt', 'লবণ'],
  ['water', 'পানি'],
  ['newton', 'নিউটন'],
  ['pascal', 'প্যাসকেল'],
  ['joule', 'জুল'],
  ['watt', 'ওয়াট'],
  ['volt', 'ভোল্ট'],
  ['ampere', 'অ্যাম্পিয়ার'],
  ['coulomb', 'কুলম্ব'],
  ['ohm', 'ওহম'],
];

const EN_TO_BN_SCIENCE = new Map<string, string>();
const BN_TO_EN_SCIENCE = new Map<string, string>();

SCIENCE_SYNONYMS.forEach(([en, bn]) => {
  EN_TO_BN_SCIENCE.set(en.toLowerCase().trim(), bn);
  BN_TO_EN_SCIENCE.set(bn.trim(), en);
});

// ==========================================
// 4. Phonetic English <-> Bengali Transliteration (Avro-Style)
// ==========================================

const VOWEL_INDEPENDENT: [string, string][] = [
  ['aa', 'আ'], ['oi', 'ঐ'], ['ou', 'ঔ'], ['ee', 'ঈ'], ['oo', 'ঊ'],
  ['ri', 'ঋ'],
  ['a', 'আ'], ['A', 'আ'], ['i', 'ই'], ['I', 'ঈ'], ['u', 'উ'], ['U', 'ঊ'],
  ['e', 'এ'], ['E', 'এ'], ['o', 'ও'], ['O', 'ও']
];

const VOWEL_KAR: Record<string, string> = {
  'a': 'া', 'aa': 'া', 'A': 'া',
  'i': 'ি', 'I': 'ী', 'ee': 'ী',
  'u': 'ু', 'U': 'ূ', 'oo': 'ূ',
  'ri': 'ৃ',
  'e': 'ে', 'E': 'ে',
  'oi': 'ৈ',
  'o': 'ো', 'O': 'ো',
  'ou': 'ৌ'
};

const CONSONANTS: [string, string][] = [
  ['kkh', 'ক্ষ'], ['cch', 'চ্ছ'], ['kkhn', 'ক্ষ্ণ'],
  ['kkhm', 'ক্ষ্ম'], ['gdh', 'গ্ধ'], ['gdh', 'গ্ধ'],
  ['kh', 'খ'], ['gh', 'ঘ'], ['Ng', 'ঙ'], ['ng', 'ং'],
  ['ch', 'চ'], ['chh', 'ছ'], ['jh', 'ঝ'], ['NG', 'ঞ'],
  ['Th', 'ঠ'], ['Dh', 'ঢ'],
  ['th', 'থ'], ['dh', 'ধ'],
  ['ph', 'ফ'], ['bh', 'ভ'],
  ['sh', 'শ'], ['Sh', 'ষ'], ['Rh', 'ঢ়'],
  ['k', 'ক'], ['g', 'গ'], ['c', 'চ'], ['j', 'জ'],
  ['T', 'ট'], ['D', 'ড'], ['N', 'ণ'],
  ['t', 'ত'], ['d', 'দ'], ['n', 'ন'],
  ['p', 'প'], ['f', 'ফ'], ['b', 'ব'], ['v', 'ভ'], ['m', 'ম'],
  ['z', 'য'], ['y', 'য়'], ['Y', 'য়'], ['r', 'র'], ['l', 'ল'],
  ['s', 'স'], ['S', 'ষ'], ['h', 'হ'], ['R', 'ড়'],
  ['w', 'ও'], ['q', 'ক'], ['x', 'ক্স']
];

/**
 * Converts English phonetic text into Bengali script.
 * Prioritizes scientific terms, followed by standard Avro-style phonetics and numeral conversion.
 */
export function convertEnglishToBanglaPhonetic(input: string): string {
  if (!input) return '';

  // Process word-by-word to match science terms and maintain layout/spacing
  return input.replace(/([A-Za-z0-9\.\-\^]+)/g, (token) => {
    // 1. Direct science term lookup
    const lower = token.toLowerCase();
    if (EN_TO_BN_SCIENCE.has(lower)) {
      return EN_TO_BN_SCIENCE.get(lower)!;
    }

    // 2. If it's a pure number or decimal, convert to Bengali numerals
    if (/^[0-9]+(\.[0-9]+)?$/.test(token)) {
      return toBengaliNumerals(token);
    }

    // 3. Phonetic transliteration
    return transliterateEnToBnWord(token);
  });
}

function transliterateEnToBnWord(word: string): string {
  let res = '';
  let i = 0;
  const n = word.length;
  let prevIsConsonant = false;

  while (i < n) {
    const ch = word[i];

    // Numbers
    if (/[0-9]/.test(ch)) {
      res += EN_TO_BN_MAP[ch] || ch;
      prevIsConsonant = false;
      i++;
      continue;
    }

    // Try multi-character consonant match
    let matchedConsonant: string | null = null;
    let consLen = 0;
    for (const [latin, bn] of CONSONANTS) {
      if (word.startsWith(latin, i)) {
        matchedConsonant = bn;
        consLen = latin.length;
        break;
      }
    }

    if (matchedConsonant) {
      if (prevIsConsonant) {
        // Form conjunct using hasant (্)
        res += '\u09CD' + matchedConsonant;
      } else {
        res += matchedConsonant;
      }
      prevIsConsonant = true;
      i += consLen;
      continue;
    }

    // Try multi-character vowel match
    let matchedVowel: string | null = null;
    let vowelLen = 0;
    for (const [latin, bn] of VOWEL_INDEPENDENT) {
      if (word.startsWith(latin, i)) {
        matchedVowel = latin;
        vowelLen = latin.length;
        break;
      }
    }

    if (matchedVowel) {
      if (prevIsConsonant) {
        // Vowel after consonant -> apply Kar (if not inherent 'a')
        const kar = VOWEL_KAR[matchedVowel];
        if (kar) {
          res += kar;
        }
      } else {
        // Independent vowel
        const entry = VOWEL_INDEPENDENT.find(([lat]) => lat === matchedVowel);
        res += entry ? entry[1] : matchedVowel;
      }
      prevIsConsonant = false;
      i += vowelLen;
      continue;
    }

    // Fallback for symbols / unknown chars
    res += ch;
    prevIsConsonant = false;
    i++;
  }

  return res;
}

/**
 * Converts Bengali script back to phonetic English representation.
 */
export function convertBanglaToEnglishPhonetic(input: string): string {
  if (!input) return '';

  return input.replace(/([\u0980-\u09FF0-9]+)/g, (token) => {
    // 1. Direct science term lookup
    if (BN_TO_EN_SCIENCE.has(token)) {
      return BN_TO_EN_SCIENCE.get(token)!;
    }

    // 2. If it's Bengali numerals, convert to English numerals
    if (/^[\u09E6-\u09EF]+(\.[\u09E6-\u09EF]+)?$/.test(token)) {
      return toEnglishNumerals(token);
    }

    // 3. Reverse phonetic mapping
    return transliterateBnToEnWord(token);
  });
}

const BN_TO_EN_CHAR_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ng',
  'ট': 'T', 'ঠ': 'Th', 'ড': 'D', 'ঢ': 'Dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
  'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': '',
  '্': ''
};

function transliterateBnToEnWord(word: string): string {
  let res = '';
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (BN_TO_EN_MAP[ch]) {
      res += BN_TO_EN_MAP[ch];
    } else if (BN_TO_EN_CHAR_MAP[ch] !== undefined) {
      res += BN_TO_EN_CHAR_MAP[ch];
    } else {
      res += ch;
    }
  }
  return res;
}

// ==========================================
// 5. High-Level Smart Converter
// ==========================================

export type ConversionMode = 
  | 'toggle_numerals'
  | 'en_to_bn_digits'
  | 'bn_to_en_digits'
  | 'en_to_bn_phonetic'
  | 'bn_to_en_phonetic'
  | 'smart_toggle';

/**
 * Universal conversion entry point with zero latency and high performance.
 */
export function smartConvert(text: string, mode: ConversionMode = 'smart_toggle'): string {
  if (!text) return '';

  switch (mode) {
    case 'en_to_bn_digits':
      return toBengaliNumerals(text);
    case 'bn_to_en_digits':
      return toEnglishNumerals(text);
    case 'toggle_numerals':
      return toggleNumerals(text);
    case 'en_to_bn_phonetic':
      return convertEnglishToBanglaPhonetic(text);
    case 'bn_to_en_phonetic':
      return convertBanglaToEnglishPhonetic(text);
    case 'smart_toggle':
    default: {
      const hasBnDigits = /[\u09E6-\u09EF]/.test(text);
      const hasEnDigits = /[0-9]/.test(text);
      const hasBnAlpha = /[\u0980-\u09E5\u09F0-\u09FF]/.test(text);
      const hasEnAlpha = /[a-zA-Z]/.test(text);

      // If it has Bengali numerals or Bengali text, convert to English
      if (hasBnDigits || hasBnAlpha) {
        if (hasBnDigits && !hasBnAlpha) {
          return toEnglishNumerals(text);
        }
        return convertBanglaToEnglishPhonetic(text);
      }

      // If it has English digits or English text, convert to Bengali
      if (hasEnDigits || hasEnAlpha) {
        if (hasEnDigits && !hasEnAlpha) {
          return toBengaliNumerals(text);
        }
        return convertEnglishToBanglaPhonetic(text);
      }

      return text;
    }
  }
}
