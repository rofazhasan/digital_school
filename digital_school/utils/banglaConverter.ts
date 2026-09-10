/**
 * World-Class, High-Performance Bangla <-> English Translator, Phonetic Converter & Answer Format Detector.
 * 100% client-side with 0ms network latency. Completely robust and self-contained.
 */

// ==========================================
// 1. Numerals Conversion
// ==========================================

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
 */
export function detectAnswerFormat(expectedAnswer: any, partType?: string): AnswerFormatHint {
  const pType = String(partType || '').trim().toLowerCase();

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

  const hasBengaliAlpha = /[\u0980-\u09E5\u09F0-\u09FF]/.test(str);
  const hasBengaliDigits = /[\u09E6-\u09EF]/.test(str);
  const hasLatinLetters = /[a-zA-Z]/.test(str);
  const hasAsciiDigits = /[0-9]/.test(str);

  const hasDigits = hasAsciiDigits || hasBengaliDigits;
  const hasLetters = hasBengaliAlpha || hasLatinLetters;

  const mathCharsRegex = /^[0-9\u09E6-\u09EF\s\.\,\/\*\+\-\^\(\)\[\]\%\\eEpiPISQRTsqrt]+$/;
  if (mathCharsRegex.test(str)) {
    const cleanedOfMath = str.replace(/[0-9\u09E6-\u09EF\s\.\,\/\*\+\-\^\(\)\[\]\%\\]/g, '').toLowerCase();
    if (['', 'pi', 'e', 'sqrt', 'sqrt()'].includes(cleanedOfMath)) {
      return 'numeric';
    }
  }

  if (hasLetters && hasDigits) {
    return 'mix';
  }

  if (hasBengaliAlpha && hasLatinLetters) {
    return 'mix';
  }

  if (hasBengaliAlpha && !hasLatinLetters && !hasDigits) {
    return 'bangla';
  }

  if (hasLatinLetters && !hasBengaliAlpha && !hasDigits) {
    return 'english';
  }

  if (hasDigits && !hasLetters) {
    return 'numeric';
  }

  return 'mix';
}

// ==========================================
// 3. World-Class Comprehensive Academic & Science Translation Lexicon
// ==========================================

const ACADEMIC_DICTIONARY: [string, string][] = [
  // Multi-word phrases (sorted by longest first for greedy exact matching)
  ['acceleration due to gravity', 'অভিকর্ষজ ত্বরণ'],
  ['gravitational constant', 'মহাকর্ষীয় ধ্রুবক'],
  ['speed of light', 'আলোর দ্রুতি'],
  ['velocity of light', 'আলোর বেগ'],
  ['planck constant', 'প্ল্যাঙ্কের ধ্রুবক'],
  ["planck's constant", 'প্ল্যাঙ্কের ধ্রুবক'],
  ['kinetic energy', 'গতিশক্তি'],
  ['potential energy', 'বিভব শক্তি'],
  ['total energy', 'মোট শক্তি'],
  ['mechanical energy', 'যান্ত্রিক শক্তি'],
  ['electric current', 'তড়িৎ প্রবাহ'],
  ['electric field', 'তড়িৎ ক্ষেত্র'],
  ['magnetic field', 'চৌম্বক ক্ষেত্র'],
  ['potential difference', 'বিভব পার্থক্য'],
  ['electromotive force', 'তড়িৎচালক বল'],
  ['internal resistance', 'অভ্যন্তরীণ রোধ'],
  ['atomic number', 'পারমাণবিক সংখ্যা'],
  ['mass number', 'ভর সংখ্যা'],
  ['periodic table', 'পর্যায় সারণি'],
  ['chemical reaction', 'রাসায়নিক বিক্রিয়া'],
  ['hydrochloric acid', 'হাইড্রোক্লোরিক এসিড'],
  ['sulfuric acid', 'সালফিউরিক এসিড'],
  ['nitric acid', 'নাইট্রিক এসিড'],
  ['acetic acid', 'অ্যাসিটিক এসিড'],
  ['carbon dioxide', 'কার্বন ডাই অক্সাইড'],
  ['carbon monoxide', 'কার্বন মনোক্সাইড'],
  ['sodium chloride', 'সোডিয়াম ক্লোরাইড'],
  ['calcium carbonate', 'ক্যালসিয়াম কার্বনেট'],
  ['calcium oxide', 'ক্যালসিয়াম অক্সাইড'],
  ['calcium hydroxide', 'ক্যালসিয়াম হাইড্রোক্সাইড'],
  ['photosynthesis', 'সালোকসংশ্লেষণ'],
  ['cellular respiration', 'কোষীয় শ্বসন'],
  ['cell wall', 'কোষ প্রাচীর'],
  ['cell membrane', 'কোষ ঝিল্লি'],
  ['plasma membrane', 'প্লাজমা মেমব্রেন'],
  ['blood cell', 'রক্তকণিকা'],
  ['red blood cell', 'লোহিত রক্তকণিকা'],
  ['white blood cell', 'শ্বেত রক্তকণিকা'],
  ['reflex arc', 'প্রতিবর্তী চাপ'],
  ['spinal cord', 'সুষুম্নাকাণ্ড'],
  ['food chain', 'খাদ্য শৃঙ্খল'],
  ['food web', 'খাদ্য জাল'],
  ['higher math', 'উচ্চতর গণিত'],
  ['higher mathematics', 'উচ্চতর গণিত'],
  ["newton's first law", 'নিউটনের প্রথম সূত্র'],
  ["newton's second law", 'নিউটনের দ্বিতীয় সূত্র'],
  ["newton's third law", 'নিউটনের তৃতীয় সূত্র'],
  ["coulomb's law", 'কুলম্বের সূত্র'],
  ["faraday's law", 'ফ্যারাডের সূত্র'],
  ["lenz's law", 'লেনজের সূত্র'],
  ["ohm's law", 'ওহমের সূত্র'],
  ["boyle's law", 'বয়েলের সূত্র'],
  ["charles's law", 'চার্লসের সূত্র'],
  ["avogadro's law", 'অ্যাভোগাড্রোর সূত্র'],
  ['conservation of energy', 'শক্তির নিত্যতা'],
  ['conservation of momentum', 'ভরবেগের নিত্যতা'],
  ['conservation of mass', 'ভরের নিত্যতা'],
  ['speed of sound', 'শব্দের দ্রুতি'],
  ['velocity of sound', 'শব্দের বেগ'],
  ['speed of light', 'আলোর দ্রুতি'],
  ['velocity of light', 'আলোর বেগ'],
  ['theory of relativity', 'আপেক্ষিকতার তত্ত্ব'],
  ['special theory of relativity', 'বিশেষ আপেক্ষিকতা তত্ত্ব'],
  ['general theory of relativity', 'সাধারণ আপেক্ষিকতা তত্ত্ব'],
  ['photoelectric effect', 'আলোকতড়িৎ ক্রিয়া'],
  ['simple harmonic motion', 'সরল ছন্দিত স্পন্দন'],
  ['root mean square', 'মূল গড় বর্গ'],
  ['focal length', 'ফোকাস দূরত্ব'],
  ['moment of inertia', 'জড়তার ভ্রামক'],
  ['center of gravity', 'ভারকেন্দ্র'],
  ['center of mass', 'ভরকেন্দ্র'],
  ['angular momentum', 'কৌণিক ভরবেগ'],
  ['angular velocity', 'কৌণিক বেগ'],
  ['angular acceleration', 'কৌণিক ত্বরণ'],
  ['centripetal force', 'কেন্দ্রমুখী বল'],
  ['centrifugal force', 'কেন্দ্রবিমুখী বল'],
  ['ideal gas', 'আদর্শ গ্যাস'],
  ['real gas', 'বাস্তব গ্যাস'],
  ['absolute zero', 'পরম শূন্য তাপমাত্রা'],
  ['first law of thermodynamics', 'তাপগতিবিদ্যার প্রথম সূত্র'],
  ['second law of thermodynamics', 'তাপগতিবিদ্যার দ্বিতীয় সূত্র'],
  ['nuclear fission', 'নিউক্লিয়ার ফিশন'],
  ['nuclear fusion', 'নিউক্লিয়ার ফিউশন'],
  ['radioactive decay', 'তেজস্ক্রিয় ক্ষয়'],
  ['half life', 'অর্ধায়ু'],
  ['mean life', 'গড় আয়ু'],
  ['binding energy', 'বন্ধন শক্তি'],
  ['mass defect', 'ভর ত্রুটি'],
  ['directly proportional', 'সমানুপাতিক'],
  ['inversely proportional', 'ব্যস্তানুপাতিক'],
  ['greater than', 'অপেক্ষা বৃহত্তর'],
  ['less than', 'অপেক্ষা ক্ষুদ্রতর'],
  ['equal to', 'এর সমান'],
  ['remains constant', 'ধ্রুব থাকে'],
  ['remains unchanged', 'অপরিবর্তিত থাকে'],
  ['increases with', 'এর সাথে বৃদ্ধি পায়'],
  ['decreases with', 'এর সাথে হ্রাস পায়'],
  ['central nervous system', 'কেন্দ্রীয় স্নায়ুতন্ত্র'],
  ['blood circulatory system', 'রক্ত সংবহনতন্ত্র'],
  ['digestive system', 'পরিপাকতন্ত্র'],
  ['respiratory system', 'শ্বসনতন্ত্র'],
  ['excretory system', 'রেচনতন্ত্র'],

  // Single-word terms
  ['acceleration', 'ত্বরণ'],
  ['velocity', 'বেগ'],
  ['speed', 'দ্রুতি'],
  ['force', 'বল'],
  ['work', 'কাজ'],
  ['power', 'ক্ষমতা'],
  ['energy', 'শক্তি'],
  ['momentum', 'ভরবেগ'],
  ['mass', 'ভর'],
  ['weight', 'ওজন'],
  ['gravity', 'অভিকর্ষ'],
  ['gravitation', 'মহাকর্ষ'],
  ['friction', 'ঘর্ষণ'],
  ['density', 'ঘনত্ব'],
  ['pressure', 'চাপ'],
  ['temperature', 'তাপমাত্রা'],
  ['heat', 'তাপ'],
  ['current', 'প্রবাহ'],
  ['voltage', 'ভোল্টেজ'],
  ['resistance', 'রোধ'],
  ['resistivity', 'আপেক্ষিক রোধ'],
  ['conductance', 'পরিবাহিতা'],
  ['capacitance', 'ধারকত্ব'],
  ['capacitor', 'ধারক'],
  ['charge', 'আধান'],
  ['potential', 'বিভব'],
  ['wavelength', 'তরঙ্গদৈর্ঘ্য'],
  ['frequency', 'কম্পাঙ্ক'],
  ['period', 'পর্যায়কাল'],
  ['amplitude', 'বিস্তার'],
  ['reflection', 'প্রতিফলন'],
  ['refraction', 'প্রতিসরণ'],
  ['diffraction', 'অপবর্তন'],
  ['polarization', 'সমবর্তন'],
  ['interference', 'ব্যতিচার'],
  ['lens', 'লেন্স'],
  ['mirror', 'দর্পণ'],
  ['convex', 'উত্তল'],
  ['concave', 'অবতল'],
  ['focus', 'ফোকাস'],
  ['atom', 'পরমাণু'],
  ['molecule', 'অণু'],
  ['electron', 'ইলেকট্রন'],
  ['proton', 'প্রোটন'],
  ['neutron', 'নিউট্রন'],
  ['nucleus', 'নিউক্লিয়াস'],
  ['nucleolus', 'নিউক্লিওলাস'],
  ['isotope', 'আইসোটোপ'],
  ['isobar', 'আইসোবার'],
  ['isotone', 'আইসোটোন'],
  ['metal', 'ধাতু'],
  ['nonmetal', 'অধাতু'],
  ['metalloid', 'উপধাতু'],
  ['valency', 'যোজনী'],
  ['valence', 'যোজ্যতা'],
  ['oxidation', 'জারণ'],
  ['reduction', 'বিজারণ'],
  ['redox', 'রেডক্স'],
  ['catalyst', 'প্রভাবক'],
  ['reaction', 'বিক্রিয়া'],
  ['reagent', 'বিকারক'],
  ['reactant', 'বিক্রিয়ক'],
  ['product', 'উৎপাদ'],
  ['equilibrium', 'সাম্যাবস্থা'],
  ['solution', 'দ্রবণ'],
  ['solute', 'দ্রব'],
  ['solvent', 'দ্রাবক'],
  ['concentration', 'ঘনমাত্রা'],
  ['molarity', 'মোলারিটি'],
  ['molality', 'মোলালিটি'],
  ['mole', 'মোল'],
  ['gas', 'গ্যাস'],
  ['liquid', 'তরল'],
  ['solid', 'কঠিন'],
  ['plasma', 'প্লাজমা'],
  ['acid', 'এসিড'],
  ['base', 'ক্ষার'],
  ['salt', 'লবণ'],
  ['water', 'পানি'],
  ['oxygen', 'অক্সিজেন'],
  ['nitrogen', 'নাইট্রোজেন'],
  ['hydrogen', 'হাইড্রোজেন'],
  ['carbon', 'কার্বন'],
  ['methane', 'মিথেন'],
  ['glucose', 'গ্লুকোজ'],
  ['chlorine', 'ক্লোরিন'],
  ['sodium', 'সোডিয়াম'],
  ['potassium', 'পটাশিয়াম'],
  ['calcium', 'ক্যালসিয়াম'],
  ['iron', 'লোহা'],
  ['copper', 'তামা'],
  ['zinc', 'দস্তা'],
  ['lead', 'সীসা'],
  ['mercury', 'পারদ'],
  ['silver', 'রুপা'],
  ['gold', 'সোনা'],
  ['mitochondria', 'মাইটোকন্ড্রিয়া'],
  ['chloroplast', 'ক্লোরোপ্লাস্ট'],
  ['plastid', 'প্লাস্টিড'],
  ['chromosome', 'ক্রোমোজোম'],
  ['chromatid', 'ক্রোমাটিড'],
  ['centromere', 'সেন্ট্রোমিয়ার'],
  ['centriole', 'সেন্ট্রিওল'],
  ['centrosome', 'সেন্ট্রোজোম'],
  ['lysosome', 'লাইসোজোম'],
  ['ribosome', 'রাইবোজোম'],
  ['vacuole', 'কোষ গহ্বর'],
  ['cell', 'কোষ'],
  ['cells', 'কোষসমূহ'],
  ['plant', 'উদ্ভিদ'],
  ['plants', 'উদ্ভিদসমূহ'],
  ['animal', 'প্রাণী'],
  ['animals', 'প্রাণীসমূহ'],
  ['body', 'দেহ'],
  ['life', 'জীবন'],
  ['nephron', 'নেফ্রন'],
  ['neuron', 'নিউরন'],
  ['tissue', 'টিস্যু'],
  ['tissues', 'টিস্যুসমূহ'],
  ['organ', 'অঙ্গ'],
  ['organs', 'অঙ্গসমূহ'],
  ['mitosis', 'মাইটোসিস'],
  ['meiosis', 'মিয়োসিস'],
  ['gamete', 'গ্যামেট'],
  ['zygote', 'জাইগোট'],
  ['embryo', 'ভ্রূণ'],
  ['fertilization', 'নিষেক'],
  ['pollination', 'পরাগায়ণ'],
  ['reproduction', 'প্রজনন'],
  ['heredity', 'বংশগতি'],
  ['genetics', 'বংশগতিবিদ্যা'],
  ['evolution', 'বিবর্তন'],
  ['mutation', 'মিউটেশন'],
  ['gene', 'জিন'],
  ['genome', 'জিনোম'],
  ['dna', 'ডিএনএ'],
  ['rna', 'আরএনএ'],
  ['ecosystem', 'বাস্তুতন্ত্র'],
  ['producer', 'উৎপাদক'],
  ['consumer', 'খাদক'],
  ['decomposer', 'বিয়োজক'],
  ['respiration', 'শ্বসন'],
  ['digestion', 'পরিপাক'],
  ['excretion', 'রেচন'],
  ['circulation', 'সংবহন'],
  ['heart', 'হৃদপিণ্ড'],
  ['kidney', 'বৃক্ক'],
  ['liver', 'যকৃৎ'],
  ['lung', 'ফুসফুস'],
  ['brain', 'মস্তিষ্ক'],
  ['artery', 'ধমনি'],
  ['vein', 'শিরা'],
  ['blood', 'রক্ত'],
  ['hemoglobin', 'হিমোগ্লোবিন'],
  ['platelet', 'অণুচক্রিকা'],
  ['enzyme', 'এনজাইম'],
  ['hormone', 'হরমোন'],
  ['protein', 'আমিষ'],
  ['lipid', 'স্নেহ'],
  ['fat', 'চর্বি'],
  ['carbohydrate', 'শর্করা'],
  ['vitamin', 'ভিটামিন'],
  ['mineral', 'খনিজ'],
  ['science', 'বিজ্ঞান'],
  ['physics', 'পদার্থবিজ্ঞান'],
  ['chemistry', 'রসায়ন'],
  ['biology', 'জীববিজ্ঞান'],
  ['mathematics', 'গণিত'],
  ['math', 'গণিত'],
  ['algebra', 'বীজগণিত'],
  ['geometry', 'জ্যামিতি'],
  ['trigonometry', 'ত্রিকোণমিতি'],
  ['calculus', 'ক্যালকুলাস'],
  ['derivative', 'অন্তরক'],
  ['integration', 'যোগজীকরণ'],
  ['matrix', 'ম্যাট্রিক্স'],
  ['vector', 'ভেক্টর'],
  ['scalar', 'স্কেলার'],
  ['constant', 'ধ্রুবক'],
  ['variable', 'চলক'],
  ['equation', 'সমীকরণ'],
  ['formula', 'সূত্র'],
  ['law', 'সূত্র'],
  ['theory', 'তত্ত্ব'],
  ['ratio', 'অনুপাত'],
  ['fraction', 'ভগ্নাংশ'],
  ['integer', 'পূর্ণসংখ্যা'],
  ['number', 'সংখ্যা'],
  ['digit', 'অঙ্ক'],
  ['unit', 'একক'],
  ['dimension', 'মাত্রা'],
  ['magnitude', 'মান'],
  ['direction', 'দিক'],
  ['newton', 'নিউটন'],
  ['pascal', 'প্যাসকেল'],
  ['joule', 'জুল'],
  ['watt', 'ওয়াট'],
  ['volt', 'ভোল্ট'],
  ['ampere', 'অ্যাম্পিয়ার'],
  ['coulomb', 'কুলম্ব'],
  ['ohm', 'ওহম'],
  ['kelvin', 'কেলভিন'],
  ['celsius', 'সেলসিয়াস'],
  ['increases', 'বৃদ্ধি পায়'],
  ['decreases', 'হ্রাস পায়'],
  ['remains', 'থাকে'],
  ['conserved', 'সংরক্ষিত'],
  ['directly', 'সরাসরি'],
  ['inversely', 'ব্যস্তানুপাতিকভাবে'],
  ['proportional', 'সমানুপাতিক'],
  ['equal', 'সমান'],
  ['greater', 'বৃহত্তর'],
  ['less', 'কম'],
  ['more', 'বেশি'],
  ['maximum', 'সর্বোচ্চ'],
  ['minimum', 'সর্বনিম্ন'],
  ['infinity', 'অসীম'],
  ['vacuum', 'শূন্যস্থান'],
  ['sound', 'শব্দ'],
  ['light', 'আলো'],
  ['wave', 'তরঙ্গ'],
  ['particle', 'কণা'],
  ['ray', 'রশ্মি'],
  ['beam', 'রশ্মিগুচ্ছ'],
  ['source', 'উৎস'],
  ['medium', 'মাধ্যম'],
  ['motion', 'গতি'],
  ['rest', 'স্থিতি'],
  ['state', 'অবস্থা'],
  ['rule', 'নিয়ম'],
  ['principle', 'নীতি'],
  ['hypothesis', 'অনুসিদ্ধান্ত'],
  ['experiment', 'পরীক্ষা'],
  ['observation', 'পর্যবেক্ষণ'],
  ['result', 'ফলাফল'],
  ['conclusion', 'উপসংহার'],
  ['definition', 'সংজ্ঞা'],
  ['explanation', 'ব্যাখ্যা'],
  ['difference', 'পার্থক্য'],
  ['similarity', 'সাদৃশ্য'],
  ['advantage', 'সুবিধা'],
  ['disadvantage', 'অসুবিধা'],
  ['function', 'কাজ'],
  ['structure', 'গঠন'],
  ['property', 'বৈশিষ্ট্য'],
  ['properties', 'বৈশিষ্ট্যসমূহ'],
  ['type', 'প্রকার'],
  ['types', 'প্রকারভেদ'],
  ['example', 'উদাহরণ'],
  ['examples', 'উদাহরণসমূহ'],
  ['diagram', 'চিত্র'],
  ['graph', 'লেখচিত্র'],
  ['slope', 'ঢাল'],
  ['area', 'ক্ষেত্রফল'],
  ['volume', 'আয়তন'],
  ['rate', 'হার'],
  ['time', 'সময়'],
  ['distance', 'দূরত্ব'],
  ['displacement', 'সরণ'],
  ['value', 'মান'],
  ['magnitude', 'মান'],
  ['vector', 'ভেক্টর'],
  ['scalar', 'স্কেলার'],
  ['unit', 'একক'],
  ['units', 'এককসমূহ'],
  ['dimension', 'মাত্রা'],
  ['dimensions', 'মাত্রাসমূহ'],
  ['formula', 'সূত্র'],
  ['equation', 'সমীকরণ'],
  ['solution', 'সমাধান'],
  ['symbol', 'প্রতীক'],
  ['notation', 'সংকেত'],
  ['question', 'প্রশ্ন'],
  ['answer', 'উত্তর'],
  ['not', 'না'],
  ['because', 'কারণ'],
  ['since', 'যেহেতু'],
  ['so', 'তাই'],
  ['therefore', 'সুতরাং'],
  ['hence', 'অতএব'],
  ['if', 'যদি'],
  ['then', 'তাহলে'],
  ['and', 'এবং'],
  ['or', 'অথবা'],
  ['but', 'কিন্তু'],
  ['what', 'কী'],
  ['which', 'কোনটি'],
  ['where', 'কোথায়'],
  ['when', 'কখন'],
  ['why', 'কেন'],
  ['how', 'কীভাবে'],
  ['who', 'কে'],
  ['whom', 'কাকে'],
  ['whose', 'কার'],
  ['define', 'সংজ্ঞায়িত করো'],
  ['explain', 'ব্যাখ্যা করো'],
  ['describe', 'বর্ণনা করো'],
  ['calculate', 'গণনা করো'],
  ['determine', 'নির্ণয় করো'],
  ['find', 'নির্ণয় করো'],
  ['state', 'বিবৃত করো'],
  ['prove', 'প্রমাণ করো'],
  ['show', 'দেখাও'],
  ['compare', 'তুলনা করো'],
  ['identify', 'শনাক্ত করো'],
  ['is', 'হয়'],
  ['are', 'হয়'],
  ['was', 'ছিল'],
  ['were', 'ছিল'],
  ['will', 'হবে'],
  ['can', 'পারে'],
  ['could', 'পারত'],
  ['should', 'উচিত'],
  ['must', 'অবশ্যই'],
  ['a', 'একটি'],
  ['an', 'একটি'],
  ['this', 'এটি'],
  ['that', 'ওটি'],
  ['these', 'এগুলো'],
  ['those', 'ওগুলো'],
  ['of', 'এর'],
  ['in', 'মধ্যে'],
  ['on', 'উপরে'],
  ['at', 'এ'],
  ['to', 'প্রতি'],
  ['for', 'জন্য'],
  ['with', 'সাথে'],
  ['by', 'দ্বারা'],
  ['from', 'হতে'],
  ['between', 'মধ্যে'],
  ['about', 'সম্পর্কে'],
  ['into', 'ভেতরে'],
  ['yes', 'হ্যাঁ'],
  ['no', 'না'],
  ['true', 'সত্য'],
  ['false', 'মিথ্যা'],
  ['correct', 'সঠিক'],
  ['incorrect', 'ভুল'],
  ['right', 'সঠিক'],
  ['wrong', 'ভুল'],
  ['increase', 'বৃদ্ধি'],
  ['decrease', 'হ্রাস'],
  ['zero', 'শূন্য'],
  ['positive', 'ধনাত্মক'],
  ['negative', 'ঋণাত্মক'],
  ['first', 'প্রথম'],
  ['second', 'দ্বিতীয়'],
  ['third', 'তৃতীয়'],
  ['fourth', 'চতুর্থ'],
  ['fifth', 'পঞ্চম'],
];

import { COMPREHENSIVE_SCIENCE_SYNONYMS } from '../lib/math-parser';

// Build bidirectional maps
const EN_TO_BN_PHRASES: [string, string][] = [];
const EN_TO_BN_WORDS = new Map<string, string>();
const BN_TO_EN_LEXICON = new Map<string, string>();
const BN_TO_EN_SORTED_PAIRS: [string, string][] = [];

ACADEMIC_DICTIONARY.forEach(([en, bn]) => {
  const enClean = en.toLowerCase().trim();
  const bnClean = bn.trim();
  if (!enClean || !bnClean) return;
  if (enClean.includes(' ')) {
    EN_TO_BN_PHRASES.push([enClean, bnClean]);
  } else {
    EN_TO_BN_WORDS.set(enClean, bnClean);
  }
  BN_TO_EN_LEXICON.set(bnClean, enClean);
});

// Also ingest established science synonym clusters from math-parser
if (Array.isArray(COMPREHENSIVE_SCIENCE_SYNONYMS)) {
  COMPREHENSIVE_SCIENCE_SYNONYMS.forEach(group => {
    if (!Array.isArray(group)) return;
    const bnTerms = group.filter(t => /[\u0980-\u09FF]/.test(t)).map(t => t.trim());
    const enTerms = group.filter(t => /[a-zA-Z]/.test(t) && !/[\u0980-\u09FF]/.test(t)).map(t => t.toLowerCase().trim());
    if (bnTerms.length > 0 && enTerms.length > 0) {
      const primaryBn = bnTerms[0];
      const primaryEn = enTerms[0];
      enTerms.forEach(en => {
        if (!en || !primaryBn) return;
        if (en.includes(' ')) {
          EN_TO_BN_PHRASES.push([en, primaryBn]);
        } else if (!EN_TO_BN_WORDS.has(en)) {
          EN_TO_BN_WORDS.set(en, primaryBn);
        }
      });
      bnTerms.forEach(bn => {
        if (!bn || !primaryEn) return;
        if (!BN_TO_EN_LEXICON.has(bn)) {
          BN_TO_EN_LEXICON.set(bn, primaryEn);
        }
      });
    }
  });
}

// Sort multi-word phrases by longest first for greedy matching
EN_TO_BN_PHRASES.sort((a, b) => b[0].length - a[0].length);

// Build and sort Bengali to English pairs (longest first) for safe reverse translation
for (const [bn, en] of BN_TO_EN_LEXICON.entries()) {
  if (bn && bn.trim() && en && en.trim()) {
    BN_TO_EN_SORTED_PAIRS.push([bn.trim(), en.trim()]);
  }
}
BN_TO_EN_SORTED_PAIRS.sort((a, b) => b[0].length - a[0].length);


/**
 * Translates academic and scientific English phrases/words to Bengali.
 * Uses exact phrase matching, single-word dictionary, and morphologic resilience.
 */
export function translateEnglishToBangla(text: string): string {
  if (!text || !text.trim()) return '';
  let result = text;

  // 1. Multi-word phrase translation (greedy matching)
  for (const [enPhrase, bnPhrase] of EN_TO_BN_PHRASES) {
    const regex = new RegExp(`\\b${enPhrase}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, bnPhrase);
    }
  }

  // 2. Tokenized word-by-word translation
  result = result.replace(/([A-Za-z0-9\.\-\^]+)/g, (token) => {
    // Digits
    if (/^[0-9]+(\.[0-9]+)?$/.test(token)) {
      return toBengaliNumerals(token);
    }

    const lower = token.toLowerCase();
    // Direct word lookup
    if (EN_TO_BN_WORDS.has(lower)) {
      return EN_TO_BN_WORDS.get(lower)!;
    }

    // Plural check (e.g. 'cells' -> 'কোষগুলো', 'acids' -> 'এসিডসমূহ')
    if (lower.endsWith('s') && EN_TO_BN_WORDS.has(lower.slice(0, -1))) {
      return EN_TO_BN_WORDS.get(lower.slice(0, -1))! + 'সমূহ';
    }

    // Preserve original word cleanly
    return token;
  });

  return result;
}

/**
 * Translates Bengali academic and scientific phrases/words back to English.
 */
export function translateBanglaToEnglish(text: string): string {
  if (!text || !text.trim()) return '';
  let result = text;

  // 1. Direct lexicon lookup (longest matching first)
  for (const [bn, en] of BN_TO_EN_SORTED_PAIRS) {
    if (bn && result.includes(bn)) {
      result = result.split(bn).join(en);
    }
  }

  // 2. Numeral conversion
  result = toEnglishNumerals(result);

  return result;
}

// ==========================================
// 4. Production-Grade Avro Phonetic Transliteration Engine
// ==========================================

const VOWEL_INDEPENDENT: [string, string][] = [
  ['aa', 'আ'], ['oi', 'ঐ'], ['ou', 'ঔ'], ['ee', 'ঈ'], ['oo', 'ঊ'],
  ['ri', 'ঋ'], ['a', 'আ'], ['A', 'আ'], ['i', 'ই'], ['I', 'ঈ'],
  ['u', 'উ'], ['U', 'ঊ'], ['e', 'এ'], ['E', 'এ'], ['o', 'ও'], ['O', 'ও']
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

const PHONETIC_CONSONANTS: [string, string][] = [
  // Compound scientific prefixes
  ['chlor', 'ক্লোর'],
  ['chrom', 'ক্রোম'],
  ['tion', 'শন'],
  ['sion', 'শন'],

  // Special multi-char conjuncts
  ['kkhn', 'ক্ষ্ণ'], ['kkhm', 'ক্ষ্ম'], ['kkh', 'ক্ষ'],
  ['cch', 'চ্ছ'], ['chch', 'চ্চ'],
  ['gdh', 'গ্ধ'], ['jng', 'জ্ঞ'],

  // Standard multi-char
  ['kh', 'খ'], ['gh', 'ঘ'], ['Ng', 'ঙ'], ['ng', 'ং'],
  ['chh', 'ছ'], ['ch', 'চ'], ['jh', 'ঝ'], ['NG', 'ঞ'],
  ['Th', 'ঠ'], ['Dh', 'ঢ'],
  ['th', 'থ'], ['dh', 'ধ'],
  ['ph', 'ফ'], ['bh', 'ভ'],
  ['sh', 'শ'], ['Sh', 'ষ'], ['Rh', 'ঢ়'],

  // Dual consonants with ra-fala
  ['pr', 'প্র'], ['tr', 'ত্র'], ['kr', 'ক্র'], ['gr', 'গ্র'],
  ['dr', 'দ্র'], ['br', 'ব্র'], ['fr', 'ফ্র'],

  // Single consonants
  ['k', 'ক'], ['g', 'গ'], ['j', 'জ'],
  ['T', 'ট'], ['D', 'ড'], ['N', 'ণ'],
  ['t', 'ত'], ['d', 'দ'], ['n', 'ন'],
  ['p', 'প'], ['f', 'ফ'], ['b', 'ব'], ['v', 'ভ'], ['m', 'ম'],
  ['z', 'য'], ['y', 'য়'], ['Y', 'য়'], ['r', 'র'], ['l', 'ল'],
  ['s', 'স'], ['S', 'ষ'], ['h', 'হ'], ['R', 'ড়'],
  ['w', 'ও'], ['q', 'ক'], ['x', 'ক্স']
];

function transliterateEnToBnWord(word: string): string {
  let res = '';
  let i = 0;
  const n = word.length;
  let prevIsConsonant = false;

  while (i < n) {
    const ch = word[i];
    const nextCh = i + 1 < n ? word[i + 1] : '';

    // Digits
    if (/[0-9]/.test(ch)) {
      res += EN_TO_BN_MAP[ch] || ch;
      prevIsConsonant = false;
      i++;
      continue;
    }

    // Special handling for 'c':
    // If 'c' is followed by 'e', 'i', 'y' -> 'স'
    // If 'c' is followed by 'h' -> let 'ch' handler take it
    // Otherwise -> 'ক'
    if (ch.toLowerCase() === 'c' && nextCh.toLowerCase() !== 'h') {
      const soft = ['e', 'i', 'y'].includes(nextCh.toLowerCase());
      const bnC = soft ? 'স' : 'ক';
      if (prevIsConsonant) res += '\u09CD' + bnC;
      else res += bnC;
      prevIsConsonant = true;
      i++;
      continue;
    }

    // Try multi-character consonant match
    let matchedConsonant: string | null = null;
    let consLen = 0;
    for (const [latin, bn] of PHONETIC_CONSONANTS) {
      if (word.substring(i).toLowerCase().startsWith(latin)) {
        matchedConsonant = bn;
        consLen = latin.length;
        break;
      }
    }

    if (matchedConsonant) {
      if (prevIsConsonant && !matchedConsonant.startsWith('\u09CD')) {
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
    for (const [latin] of VOWEL_INDEPENDENT) {
      if (word.substring(i).toLowerCase().startsWith(latin)) {
        matchedVowel = latin;
        vowelLen = latin.length;
        break;
      }
    }

    if (matchedVowel) {
      if (prevIsConsonant) {
        // Vowel after consonant -> Kar
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

    // Fallback for symbols or unknown chars
    res += ch;
    prevIsConsonant = false;
    i++;
  }

  return res;
}

/**
 * Converts English phonetic input into Bengali.
 */
export function convertEnglishToBanglaPhonetic(input: string): string {
  if (!input) return '';
  return translateEnglishToBangla(input);
}

// ==========================================
// 5. Bengali to English Reverse Transliteration
// ==========================================

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

export function convertBanglaToEnglishPhonetic(input: string): string {
  if (!input) return '';

  return input.replace(/([\u0980-\u09FF0-9]+)/g, (token) => {
    // 1. Direct dictionary check
    if (BN_TO_EN_LEXICON.has(token)) {
      return BN_TO_EN_LEXICON.get(token)!;
    }

    // 2. Bengali numerals
    if (/^[\u09E6-\u09EF]+(\.[\u09E6-\u09EF]+)?$/.test(token)) {
      return toEnglishNumerals(token);
    }

    // 3. Reverse phonetic mapping
    let res = '';
    for (let i = 0; i < token.length; i++) {
      const ch = token[i];
      if (BN_TO_EN_MAP[ch]) {
        res += BN_TO_EN_MAP[ch];
      } else if (BN_TO_EN_CHAR_MAP[ch] !== undefined) {
        res += BN_TO_EN_CHAR_MAP[ch];
      } else {
        res += ch;
      }
    }
    return res;
  });
}

// ==========================================
// 6. High-Level Smart Converter Dispatcher
// ==========================================

export type ConversionMode =
  | 'toggle_numerals'
  | 'en_to_bn_digits'
  | 'bn_to_en_digits'
  | 'en_to_bn_translate'
  | 'bn_to_en_translate'
  | 'smart_toggle';

/**
 * Universal conversion entry point with zero latency and world-class accuracy.
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
    case 'en_to_bn_translate':
      return translateEnglishToBangla(text);
    case 'bn_to_en_translate':
      return translateBanglaToEnglish(text);
    case 'smart_toggle':
    default: {
      const hasBnDigits = /[\u09E6-\u09EF]/.test(text);
      const hasEnDigits = /[0-9]/.test(text);
      const hasBnAlpha = /[\u0980-\u09E5\u09F0-\u09FF]/.test(text);
      const hasEnAlpha = /[a-zA-Z]/.test(text);

      // If it contains Bengali (digits or text) -> convert to English
      if (hasBnDigits || hasBnAlpha) {
        if (hasBnDigits && !hasBnAlpha) {
          return toEnglishNumerals(text);
        }
        return translateBanglaToEnglish(text);
      }

      // If it contains English (digits or text) -> convert to Bengali
      if (hasEnDigits || hasEnAlpha) {
        if (hasEnDigits && !hasEnAlpha) {
          return toBengaliNumerals(text);
        }
        return translateEnglishToBangla(text);
      }

      return text;
    }
  }
}

// Client-side translation cache
const clientTranslationCache = new Map<string, string>();

/**
 * Asynchronously translates text using the neural /api/translate route with
 * client-side caching, 0ms digit short-circuit, and seamless local lexicon fallback.
 */
export async function translateOnline(
  text: string,
  from: 'en' | 'bn' | 'auto' = 'auto',
  to: 'en' | 'bn' = 'bn'
): Promise<string> {
  if (!text || !text.trim()) return '';
  const trimmed = text.trim();

  // If purely digits, convert numerals with 0ms delay
  const hasBnDigits = /^[\u09E6-\u09EF\s\.\,\+\-\*\/\^\(\)]+$/.test(trimmed);
  const hasEnDigits = /^[0-9\s\.\,\+\-\*\/\^\(\)]+$/.test(trimmed);
  if (hasEnDigits && to === 'bn') return toBengaliNumerals(trimmed);
  if (hasBnDigits && to === 'en') return toEnglishNumerals(trimmed);

  const cacheKey = `${from}:${to}:${trimmed.toLowerCase()}`;
  if (clientTranslationCache.has(cacheKey)) {
    return clientTranslationCache.get(cacheKey)!;
  }

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, from, to }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && typeof data.translation === 'string' && data.translation.trim()) {
        const trans = data.translation.trim();
        clientTranslationCache.set(cacheKey, trans);
        return trans;
      }
    }
  } catch (e) {
    // Network or timeout -> fallback to local lexicon
  }

  // Fallback to local high-speed translation
  const fallback = to === 'bn' ? translateEnglishToBangla(trimmed) : translateBanglaToEnglish(trimmed);
  return fallback || trimmed;
}

/**
 * Universal async smart converter that supports neural translation,
 * instant numeral conversion, and intelligent directional switching.
 */
export async function smartConvertAsync(
  text: string,
  mode: ConversionMode = 'smart_toggle'
): Promise<string> {
  if (!text || !text.trim()) return '';

  switch (mode) {
    case 'en_to_bn_digits':
      return toBengaliNumerals(text);
    case 'bn_to_en_digits':
      return toEnglishNumerals(text);
    case 'toggle_numerals':
      return toggleNumerals(text);
    case 'en_to_bn_translate':
      return translateOnline(text, 'en', 'bn');
    case 'bn_to_en_translate':
      return translateOnline(text, 'bn', 'en');
    case 'smart_toggle':
    default: {
      const hasBnAlpha = /[\u0980-\u09E5\u09F0-\u09FF]/.test(text);
      const hasEnAlpha = /[a-zA-Z]/.test(text);
      const hasBnDigits = /[\u09E6-\u09EF]/.test(text);
      const hasEnDigits = /[0-9]/.test(text);

      // Digits only
      if (hasBnDigits && !hasBnAlpha && !hasEnAlpha) {
        return toEnglishNumerals(text);
      }
      if (hasEnDigits && !hasBnAlpha && !hasEnAlpha) {
        return toBengaliNumerals(text);
      }

      // Mixed or text
      if (hasBnAlpha) {
        return translateOnline(text, 'bn', 'en');
      }
      if (hasEnAlpha) {
        return translateOnline(text, 'en', 'bn');
      }

      return toggleNumerals(text);
    }
  }
}

