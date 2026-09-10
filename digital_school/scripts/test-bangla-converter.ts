import {
  toBengaliNumerals,
  toEnglishNumerals,
  toggleNumerals,
  detectAnswerFormat,
  translateEnglishToBangla,
  translateBanglaToEnglish,
  smartConvert
} from '../utils/banglaConverter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

console.log("==========================================================================");
console.log("   TESTING WORLD-CLASS BANGLA-ENGLISH TRANSLATION & CONVERTER");
console.log("==========================================================================");

// 1. Academic & Scientific Translations
assert(translateEnglishToBangla('velocity') === 'বেগ', 'velocity -> বেগ');
assert(translateEnglishToBangla('acceleration') === 'ত্বরণ', 'acceleration -> ত্বরণ');
assert(translateEnglishToBangla('force') === 'বল', 'force -> বল');
assert(translateEnglishToBangla('sulfuric acid') === 'সালফিউরিক এসিড', 'sulfuric acid -> সালফিউরিক এসিড');
assert(translateEnglishToBangla('carbon dioxide') === 'কার্বন ডাই অক্সাইড', 'carbon dioxide -> কার্বন ডাই অক্সাইড');
assert(translateEnglishToBangla('photosynthesis') === 'সালোকসংশ্লেষণ', 'photosynthesis -> সালোকসংশ্লেষণ');
assert(translateEnglishToBangla('cell') === 'কোষ', 'cell -> কোষ');
assert(translateEnglishToBangla('chloroplast') === 'ক্লোরোপ্লাস্ট', 'chloroplast -> ক্লোরোপ্লাস্ট');
assert(translateEnglishToBangla('science') === 'বিজ্ঞান', 'science -> বিজ্ঞান');
assert(translateEnglishToBangla('physics') === 'পদার্থবিজ্ঞান', 'physics -> পদার্থবিজ্ঞান');
assert(translateEnglishToBangla('mitochondria') === 'মাইটোকন্ড্রিয়া', 'mitochondria -> মাইটোকন্ড্রিয়া');
assert(translateEnglishToBangla('nephron') === 'নেফ্রন', 'nephron -> নেফ্রন');

// 2. Reverse Translation
assert(translateBanglaToEnglish('বেগ') === 'velocity', 'বেগ -> velocity');
assert(translateBanglaToEnglish('ত্বরণ') === 'acceleration', 'ত্বরণ -> acceleration');
assert(translateBanglaToEnglish('বল') === 'force', 'বল -> force');
assert(translateBanglaToEnglish('মাইটোকন্ড্রিয়া') === 'mitochondria', 'মাইটোকন্ড্রিয়া -> mitochondria');
assert(translateBanglaToEnglish('নেফ্রন') === 'nephron', 'নেফ্রন -> nephron');

// 3. Numerals
assert(toBengaliNumerals('123.45') === '১২৩.৪৫', '123.45 -> ১২৩.৪৫');
assert(toEnglishNumerals('১২৩.৪৫') === '123.45', '১২৩.৪৫ -> 123.45');
assert(toggleNumerals('123') === '১২৩', 'toggle 123 -> ১২৩');
assert(toggleNumerals('১২৩') === '123', 'toggle ১২৩ -> 123');

// 4. Smart toggle
assert(smartConvert('velocity') === 'বেগ', 'smartConvert velocity -> বেগ');
assert(smartConvert('বেগ') === 'velocity', 'smartConvert বেগ -> velocity');
assert(smartConvert('100') === '১০০', 'smartConvert 100 -> ১০০');
assert(smartConvert('১০০') === '100', 'smartConvert ১০০ -> 100');

console.log("\n🎉 ALL WORLD-CLASS TRANSLATION & CONVERTER TESTS PASSED!");
