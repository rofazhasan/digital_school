import {
  toBengaliNumerals,
  toEnglishNumerals,
  toggleNumerals,
  detectAnswerFormat,
  convertEnglishToBanglaPhonetic,
  convertBanglaToEnglishPhonetic,
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
console.log("   BANGLA-ENGLISH CONVERTER & FORMAT DETECTOR TEST SUITE");
console.log("==========================================================================");

// 1. Numeral conversions
assert(toBengaliNumerals('12345') === '১২৩৪৫', 'Convert 12345 to Bengali digits');
assert(toBengaliNumerals('3.1416') === '৩.১৪১৬', 'Convert decimal 3.1416 to Bengali digits');
assert(toBengaliNumerals('-9.8') === '-৯.৮', 'Convert negative -9.8 to Bengali digits');

assert(toEnglishNumerals('১২৩৪৫') === '12345', 'Convert ১২৩৪৫ to English digits');
assert(toEnglishNumerals('৩.১৪১৬') === '3.1416', 'Convert ৩.১৪১৬ to English digits');
assert(toEnglishNumerals('-৯.৮') === '-9.8', 'Convert -৯.৮ to English digits');

assert(toggleNumerals('123') === '১২৩', 'Toggle English 123 to Bengali ১২৩');
assert(toggleNumerals('১২৩') === '123', 'Toggle Bengali ১২৩ to English 123');

// 2. Format Detection
console.log("\nTesting Answer Format Detection:");
assert(detectAnswerFormat('20') === 'numeric', 'Format 20 -> numeric');
assert(detectAnswerFormat('২০') === 'numeric', 'Format ২০ -> numeric');
assert(detectAnswerFormat('3.1416') === 'numeric', 'Format 3.1416 -> numeric');
assert(detectAnswerFormat('10^5') === 'numeric', 'Format 10^5 -> numeric');
assert(detectAnswerFormat('-9.8') === 'numeric', 'Format -9.8 -> numeric');
assert(detectAnswerFormat('1/2') === 'numeric', 'Format 1/2 -> numeric');

assert(detectAnswerFormat('Mitochondria') === 'english', 'Format Mitochondria -> english');
assert(detectAnswerFormat('NEPHRON') === 'english', 'Format NEPHRON -> english');
assert(detectAnswerFormat('Chloroplast') === 'english', 'Format Chloroplast -> english');

assert(detectAnswerFormat('নেফ্রন') === 'bangla', 'Format নেফ্রন -> bangla');
assert(detectAnswerFormat('মাইটোকন্ড্রিয়া') === 'bangla', 'Format মাইটোকন্ড্রিয়া -> bangla');
assert(detectAnswerFormat('সালফিউরিক এসিড') === 'bangla', 'Format সালফিউরিক এসিড -> bangla');

assert(detectAnswerFormat('20 N') === 'mix', 'Format 20 N -> mix');
assert(detectAnswerFormat('5 m/s') === 'mix', 'Format 5 m/s -> mix');
assert(detectAnswerFormat('2x+1') === 'mix', 'Format 2x+1 -> mix');
assert(detectAnswerFormat('H2O') === 'mix', 'Format H2O -> mix');
assert(detectAnswerFormat('নেফ্রন (Nephron)') === 'mix', 'Format নেফ্রন (Nephron) -> mix');
assert(detectAnswerFormat('৩য় সূত্র') === 'mix', 'Format ৩য় সূত্র -> mix');

// Fallbacks
assert(detectAnswerFormat(undefined, 'integer') === 'numeric', 'Undefined integer -> numeric');
assert(detectAnswerFormat(null, 'expression') === 'numeric', 'Null expression -> numeric');

// 3. Transliterations
console.log("\nTesting Phonetic & Science Transliterations:");
assert(convertEnglishToBanglaPhonetic('nephron') === 'নেফ্রন', 'English nephron -> Bengali নেফ্রন');
assert(convertEnglishToBanglaPhonetic('mitochondria') === 'মাইটোকন্ড্রিয়া', 'English mitochondria -> Bengali মাইটোকন্ড্রিয়া');
assert(convertEnglishToBanglaPhonetic('glucose') === 'গ্লুকোজ', 'English glucose -> Bengali গ্লুকোজ');
assert(convertEnglishToBanglaPhonetic('oxygen') === 'অক্সিজেন', 'English oxygen -> Bengali অক্সিজেন');
assert(convertEnglishToBanglaPhonetic('acceleration') === 'ত্বরণ', 'English acceleration -> Bengali ত্বরণ');

assert(convertBanglaToEnglishPhonetic('নেফ্রন') === 'nephron', 'Bengali নেফ্রন -> English nephron');
assert(convertBanglaToEnglishPhonetic('মাইটোকন্ড্রিয়া') === 'mitochondria', 'Bengali মাইটোকন্ড্রিয়া -> English mitochondria');
assert(convertBanglaToEnglishPhonetic('গ্লুকোজ') === 'glucose', 'Bengali গ্লুকোজ -> English glucose');

// 4. Smart Convert
assert(smartConvert('100') === '১০০', 'Smart convert 100 -> ১০০');
assert(smartConvert('১০০') === '100', 'Smart convert ১০০ -> 100');
assert(smartConvert('nephron') === 'নেফ্রন', 'Smart convert nephron -> নেফ্রন');
assert(smartConvert('নেফ্রন') === 'nephron', 'Smart convert নেফ্রন -> nephron');

console.log("\n🎉 ALL BANGLA CONVERTER TESTS PASSED SUCCESSFULLY!");
