// Dynamic Math, Physics, Chemistry, Biology & Bengali Expression Parsing Engine
// Normalizes algebraic, chemical, physical & numerical expressions, handles implicit multiplication,
// commutativity of products (e.g. GMm == GmM), LaTeX superscripts (e.g. R^2 == $R^{2}$),
// fraction coefficients (e.g. 3v/2 == (3/2)*v == 1.5v),
// Bengali digits, danda, suffixes & partial stem containment (e.g. জনন কোষ == জনন, ৫ == 5, ৯ . ৮ == 9.8),
// science ontology knowledge graphs (H2O == পানি, CO2 == কার্বন ডাই অক্সাইড, g == অভিকর্ষজ ত্বরণ),
// renders clean LaTeX representations, and evaluates equivalence with fuzzy typo tolerance.

/**
 * Normalizes Bengali numerals, Bengali punctuation/danda, zero-width characters,
 * Unicode minus/dash signs, spaces around decimal dots, degree symbols, vectors,
 * and converts LaTeX / Greek symbols to unified standard ASCII identifiers.
 */
export function normalizeBengaliNumeralsAndText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let text = String(str).trim();
  if (!text) return '';

  // Zero-width characters & non-breaking spaces
  text = text.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');

  // All Unicode minus, dash, hyphen variations to standard ASCII '-'
  text = text.replace(/[\u2212\u2010\u2011\u2012\u2013\u2014\u2015\uFE63\uFF0D]/g, '-');

  // Normalize spaces around dots / decimals and Bengali danda (e.g. "9 . 8" or "৯ . ৮" -> "9.8" or "৯.৮")
  text = text.replace(/(\d|[\u09E6-\u09EF])\s*[\.\u0964\u0965]\s*(\d|[\u09E6-\u09EF])/g, '$1.$2');

  // Bengali digits 0-9 (০-৯) to standard ASCII 0-9
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  bnDigits.forEach((d, i) => {
    text = text.split(d).join(String(i));
  });

  // Leading plus on numbers: "+5" -> "5", "+ 9.8" -> "9.8"
  text = text.replace(/^\+\s*(\d+(?:\.\d+)?)$/, '$1');

  // Remaining Bengali danda between digits or as dot/space
  text = text.replace(/(\d)[\u0964\u0965](\d)/g, '$1.$2');
  text = text.replace(/[\u0964\u0965]/g, ' ');

  // Degree symbols: 90° -> 90 deg, 90^\circ -> 90 deg, 90 ডিগ্রি -> 90 deg
  text = text.replace(/(\d+(?:\.\d+)?)\s*(?:°|\^\\circ|\\circ|deg|degree|ডিগ্রি)\b/gi, '$1 deg');
  text = text.replace(/°/g, ' deg');

  // Unit vector notation: \hat{i} -> i, \hat{j} -> j, \hat{k} -> k
  text = text.replace(/\\hat\{([a-zA-Z])\}/g, '$1');
  text = text.replace(/\\vec\{([a-zA-Z])\}/g, '$1');

  // Replace LaTeX Greek letters (with 1 or more backslashes)
  text = text.replace(/\\+(pi|theta|lambda|mu|omega|alpha|beta|gamma|delta|rho|sigma|phi)\b/gi, '$1');

  // Greek letters & symbols
  const symbolMap: Record<string, string> = {
    'π': 'pi', 'Π': 'pi',
    'θ': 'theta', 'Θ': 'theta',
    'λ': 'lambda', 'Λ': 'lambda',
    'μ': 'mu',
    'ω': 'omega', 'Ω': 'omega',
    'α': 'alpha',
    'β': 'beta',
    'γ': 'gamma', 'Γ': 'gamma',
    'δ': 'delta', 'Δ': 'delta',
    'ρ': 'rho',
    'σ': 'sigma', 'Σ': 'sigma',
    'φ': 'phi', 'ϕ': 'phi', 'Φ': 'phi',
    '×': '*', '⋅': '*', '•': '*', '·': '*',
    '÷': '/'
  };

  for (const [sym, rep] of Object.entries(symbolMap)) {
    text = text.split(sym).join(rep);
  }

  // Normalize ya-fala and Bengali character variations
  text = text.replace(/য়/g, 'য়');

  return text.trim();
}

/**
 * Bengali suffixes (বিভক্তি ও বহুবচন প্রত্যয়) to strip for root stem matching.
 */
export const BENGALI_SUFFIXES: string[] = [
  'গুলো', 'গুলি', 'দের', 'দেরকে', 'দিগকে', 'সমূহ', 'গণ', 'বর্গ', 'মালা', 'বৃন্দ',
  'টিতে', 'টাতে', 'খানি', 'খানা', 'টি', 'টা',
  'দ্বারা', 'দিয়া', 'দিয়ে', 'হতে', 'থেকে', 'চেয়ে',
  'এর', 'র', 'কে', 'রে', 'তে', 'য়ে', 'এ', 'ই', 'ও'
];

/**
 * Strips common Bengali inflection suffixes from a word.
 */
export function stripBengaliSuffix(word: string): string {
  let w = word.trim();
  if (w.length <= 3) return w;
  for (const suf of BENGALI_SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= 2) {
      return w.slice(0, -suf.length).trim();
    }
  }
  return w;
}

/**
 * Comprehensive Science Knowledge Synonym & Canonical Term Mappings (Bengali <-> English <-> Formula).
 */
export const COMPREHENSIVE_SCIENCE_SYNONYMS: string[][] = [
  // General logic & choices
  ['yes', 'true', '1', 'হ্যাঁ', 'হাঁ', 'সঠিক', 'সত্য', 'রাইট', 'correct', 'right'],
  ['no', 'false', '0', 'না', 'নাই', 'ভুল', 'মিথ্যা', 'রং', 'incorrect', 'wrong'],
  ['increase', 'increases', 'increasing', 'বৃদ্ধি পাবে', 'বৃদ্ধি', 'বাড়বে', 'বাড়বে', 'উন্নতি', 'বেড়ে যাবে', 'বেড়ে যাবে', 'বৃদ্ধি পায়', 'বৃদ্ধি pay', 'বৃদ্ধি পায়'],
  ['decrease', 'decreases', 'decreasing', 'হ্রাস পাবে', 'হ্রাস', 'কমবে', 'কম', 'হ্রাস পায়', 'হ্রাস pay', 'হ্রাস pay', 'কমে যাবে'],
  ['constant', 'unchanged', 'same', 'সমান', 'অপরিবর্তিত', 'একই থাকবে', 'ধ্রুবক', 'একই', 'অপরিবর্তিত থাকবে', 'স্থির থাকবে', 'স্থির'],
  ['zero', '0', '০', 'শূন্য', 'শূণ্য', 'নিল', 'nil', 'none'],
  ['positive', '+', 'ধনাত্মক', 'পজিটিভ', 'পজেটিভ'],
  ['negative', '-', 'ঋণাত্মক', 'নেগেটিভ'],
  ['north', 'উত্তর', 'উত্তরমুখী', 'উত্তর দিকে'],
  ['south', 'দক্ষিণ', 'দক্ষিণমুখী', 'দক্ষিণ দিকে'],
  ['east', 'পূর্ব', 'পূর্বমুখী', 'পূর্ব দিকে'],
  ['west', 'পশ্চিম', 'পশ্চিমমুখী', 'পশ্চিম দিকে'],

  // Biology Terms & Organelles
  ['জনন কোষ', 'জননকোষ', 'জনন', 'গ্যামেট', 'gamete', 'germ cell', 'reproductive cell'],
  ['দেহ কোষ', 'দেহকোষ', 'somatic cell', 'body cell'],
  ['কোষ প্রাচীর', 'কোষপ্রাচীর', 'cell wall'],
  ['কোষ ঝিল্লি', 'কোষঝিল্লি', 'প্লাজমা মেমব্রেন', 'plasma membrane', 'cell membrane'],
  ['মাইটোসিস', 'মাইটোসিস বিভাজন', 'মাইটোসিস কোষ বিভাজন', 'সমীকরণিক বিভাজন', 'mitosis'],
  ['মিয়োসিস', 'মায়োসিস', 'মিয়োসিস', 'মায়োসিস', 'হ্রাসমূলক বিভাজন', 'meiosis'],
  ['সালোকসংশ্লেষণ', 'সালোক সংশ্লেষণ', 'photosynthesis'],
  ['শ্বসন', 'কোষীয় শ্বসন', 'কোষীয় শ্বসন', 'respiration', 'cellular respiration'],
  ['মাইটোকন্ড্রিয়া', 'মাইটোকন্ড্রিয়া', 'মাইটোকনড্রিয়া', 'mitochondria', 'শক্তিঘর', 'পাওয়ার হাউস', 'power house'],
  ['লাইসোজোম', 'লাইসোজম', 'lysosome', 'আত্মঘাতী থলিকা', 'suicide bag'],
  ['গলজি বস্তু', 'গলগি বডি', 'গলজি বডি', 'গলগি কমপ্লেক্স', 'golgi apparatus', 'golgi body'],
  ['এন্ডোপ্লাজমিক রেটিকুলাম', 'endoplasmic reticulum', 'er'],
  ['ক্লোরোপ্লাস্ট', 'ক্লোরোপ্লাস্টিড', 'chloroplast'],
  ['প্লাস্টিড', 'plastid'],
  ['নিউক্লিয়াস', 'নিউক্লিয়াস', 'nucleus'],
  ['ক্রোমোজোম', 'ক্রোমোজম', 'chromosome'],
  ['সেন্ট্রিওল', 'centriole', 'সেন্ট্রোজোম', 'centrosome'],
  ['ভ্যাকুওল', 'কোষ গহ্বর', 'vacuole'],
  ['প্লাজমিড', 'plasmid'],
  ['ডিএনএ', 'ডি এন এ', 'dna', 'deoxyribonucleic acid'],
  ['আরএনএ', 'আর এন এ', 'rna', 'ribonucleic acid'],
  ['জিন', 'gene', 'জিনোম', 'genome'],
  ['ফেনোটাইপ', 'phenotype', 'জিনোটাইপ', 'genotype'],
  ['রক্তকণিকা', 'blood corpuscle', 'blood cell'],
  ['লোহিত রক্তকণিকা', 'rbc', 'erythrocyte', 'red blood cell'],
  ['শ্বেত রক্তকণিকা', 'wbc', 'leukocyte', 'white blood cell'],
  ['অণুচক্রিকা', 'platelet', 'thrombocyte'],
  ['হিমোগ্লোবিন', 'haemoglobin', 'hemoglobin'],
  ['অ্যান্টিজেন', 'antigen', 'অ্যান্টিবডি', 'antibody'],
  ['এনজাইম', 'উৎসেচক', 'enzyme'],
  ['হরমোন', 'প্রনরস', 'hormone'],
  ['অ্যামিনো এসিড', 'অ্যামাইনো এসিড', 'amino acid'],
  ['প্রোটিন', 'আমিষ', 'protein'],
  ['লিপিড', 'স্নেহ', 'lipid', 'fat'],
  ['কার্বোহাইড্রেট', 'শর্করা', 'carbohydrate'],
  ['গ্লুকোজ', 'c6h12o6', 'glucose'],

  // Chemistry Terms & Formulas
  ['পানি', 'জল', 'h2o', 'h_2o', 'water', 'dihydrogen monoxide'],
  ['কার্বন ডাই অক্সাইড', 'কার্বন ডাইঅক্সাইড', 'কার্বন ডাই-অক্সাইড', 'co2', 'co_2', 'carbon dioxide'],
  ['অক্সিজেন', 'অক্সিজেন গ্যাস', 'o2', 'o_2', 'oxygen'],
  ['নাইট্রোজেন', 'n2', 'n_2', 'nitrogen'],
  ['হাইড্রোজেন', 'h2', 'h_2', 'hydrogen'],
  ['মিথেন', 'ch4', 'ch_4', 'methane', 'মার্শ গ্যাস', 'marsh gas'],
  ['হাইড্রোক্লোরিক এসিড', 'হাইড্রোক্লোরিক অ্যাসিড', 'hcl', 'hydrochloric acid'],
  ['সালফিউরিক এসিড', 'সালফিউরিক অ্যাসিড', 'h2so4', 'h_2so4', 'sulfuric acid'],
  ['নাইট্রিক এসিড', 'নাইট্রিক অ্যাসিড', 'hno3', 'h_no3', 'nitric acid'],
  ['সোডিয়াম ক্লোরাইড', 'সোডিয়াম ক্লোরাইড', 'nacl', 'খাবার লবণ', 'লবণ', 'sodium chloride', 'salt'],
  ['ক্যালসিয়াম কার্বনেট', 'ক্যালসিয়াম কার্বোনেট', 'caco3', 'চুনাপাথর', 'মার্বেল পাথর', 'calcium carbonate'],
  ['ক্যালসিয়াম অক্সাইড', 'cao', 'চুন', 'পোড়া চুন', 'calcium oxide', 'quicklime'],
  ['ক্যালসিয়াম হাইড্রোক্সাইড', 'ca(oh)2', 'কলিচুন', 'চুনের পানি', 'calcium hydroxide', 'slaked lime'],
  ['জারণ', 'oxidation', 'বিজারণ', 'reduction', 'জারণ-বিজারণ', 'রেডক্স', 'redox'],
  ['ক্ষার', 'ক্ষারক', 'base', 'alkali'],
  ['এসিড', 'অ্যাসিড', 'acid'],
  ['প্রশমন বিক্রিয়া', 'প্রশমন', 'neutralization'],
  ['পর্যায় সারণি', 'periodic table'],
  ['আইসোটোপ', 'isotope', 'আইসোবার', 'isobar', 'আইসোটোন', 'isotone'],

  // Physics Terms & Equations
  ['অভিকর্ষজ ত্বরণ', 'অভিকর্ষ ত্বরণ', 'অভিকর্ষজ', 'g', 'acceleration due to gravity', 'gravity'],
  ['মহাকর্ষীয় ধ্রুবক', 'মহাকর্ষ ধ্রুবক', 'G', 'gravitational constant'],
  ['আলোর বেগ', 'আলোর দ্রুতি', 'c', 'speed of light'],
  ['প্ল্যাঙ্কের ধ্রুবক', 'h', 'planck constant', "planck's constant"],
  ['গতিশক্তি', 'e_k', 'ek', 'kinetic energy'],
  ['বিভব শক্তি', 'স্থিতিশক্তি', 'e_p', 'ep', 'potential energy'],
  ['কাজ', 'w', 'work'],
  ['বল', 'f', 'force'],
  ['ক্ষমতা', 'p', 'power'],
  ['ত্বরণ', 'a', 'acceleration'],
  ['বেগ', 'v', 'velocity'],
  ['দ্রুতি', 'speed'],
  ['ভরবেগ', 'p', 'momentum'],
  ['তরঙ্গদৈর্ঘ্য', 'lambda', 'wavelength'],
  ['কম্পাঙ্ক', 'f', 'frequency'],
  ['পর্যায়কাল', 't', 'time period', 'period'],
  ['লেনজের সূত্র', "lenz's law", 'lenz law'],
  ['ফ্যারাডের সূত্র', "faraday's law", 'faraday law'],
  ['কুলম্বের সূত্র', "coulomb's law", 'coulomb law'],
  ['ওহমের সূত্র', "ohm's law", 'ohm law'],
  ['হুকের সূত্র', "hooke's law", 'hooke law'],
  ['প্যাসকেলের সূত্র', "pascal's law", 'pascal law'],
  ['আর্কিমিডিসের নীতি', 'archimedes principle'],
  ['ডপলার প্রভাব', 'ডপলার ক্রিয়া', 'doppler effect'],
  ['পূর্ণ অভ্যন্তরীণ প্রতিফলন', 'total internal reflection', 'tir'],
  ['সংকট কোণ', 'ক্রান্তি কোণ', 'critical angle'],
  ['প্লবতা', 'উর্ধ্বমুখী বল', 'buoyancy', 'buoyant force', 'upthrust'],
  ['সান্দ্রতা', 'সান্দ্রতা গুণাঙ্ক', 'viscosity', 'viscous force'],
  ['অর্ধায়ু', 'অর্ধ-জীবন', 'half life', 'half-life', 't_1/2', 't_{1/2}'],
  ['তেজস্ক্রিয়তা', 'radioactivity'],
  ['তড়িৎ প্রবাহ', 'তড়িৎ প্রবাহ', 'বিদ্যুৎ প্রবাহ', 'electric current', 'current', 'I'],
  ['বিভব পার্থক্য', 'ভোল্টেজ', 'potential difference', 'voltage', 'V'],
  ['তড়িৎচালক শক্তি', 'তড়িৎচালক বল', 'ইএমএফ', 'emf', 'electromotive force', 'E'],
  ['রোধ', 'তড়িৎ রোধ', 'বৈদ্যুতিক রোধ', 'resistance', 'R'],
  ['প্রতিসরাঙ্ক', 'প্রতিসরণাঙ্ক', 'refractive index', 'mu', 'n'],
  ['ফোকাস দূরত্ব', 'focal length', 'f'],
  ['ভরত্রুটি', 'ভর ত্রুটি', 'mass defect', 'delta m', 'Δm'],
  ['বন্ধন শক্তি', 'binding energy', 'BE'],
  ['কেপলারের সূত্র', "kepler's law", 'kepler law'],
  ['কার্শফের সূত্র', "kirchhoff's law", 'kirchhoff law', 'kcl', 'kvl'],
  ['বায়ো-সাভার্ট সূত্র', 'বায়ো সাভার্ট সূত্র', "biot-savart law", "biot savart law"],
  ['অ্যাম্পিয়ারের সূত্র', "ampere's law", 'ampere law', 'circuital law'],
  ['হাইগেনসের নীতি', 'হাইগেনসের নীতি ও তরঙ্গমুখ', "huygens principle"],
  ['ব্র্যাগ সূত্র', "bragg's law", 'bragg law'],
  ['স্টোকসের সূত্র', "stokes' law", 'stokes law'],
  ['বার্নোলির নীতি', 'বার্নোলির উপপাদ্য', "bernoulli's principle", 'bernoulli principle'],
  ['হেনরির সূত্র', "henry's law", 'henry law'],
  ['রাউল্টের সূত্র', "raoult's law", 'raoult law'],
  ['লে শাতেলীয়ার নীতি', 'লা শাতেলিয়ের নীতি', "le chatelier's principle", 'le chatelier principle'],
  ['মেন্ডেলের প্রথম সূত্র', "mendel's first law", 'পৃথকীকরণ সূত্র', 'law of segregation'],
  ['মেন্ডেলের দ্বিতীয় সূত্র', "mendel's second law", 'স্বাধীনভাবে সঞ্চারণের সূত্র', 'law of independent assortment'],
  ['ডিএনএ প্রতিলিপন', 'ডিএনএ রেপ্লিকেশন', 'dna replication'],
  ['ট্রান্সক্রিপশন', 'transcription'],
  ['ট্রান্সলেশন', 'translation']
];

export const BENGALI_SYNONYM_GROUPS = COMPREHENSIVE_SCIENCE_SYNONYMS;

/**
 * Levenshtein distance for fuzzy typo tolerance.
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy string matching with similarity ratio threshold.
 */
export function fuzzyStringMatch(s1: string, s2: string, threshold = 0.80): boolean {
  if (s1 === s2) return true;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen <= 2) return s1 === s2;
  const dist = levenshteinDistance(s1, s2);
  const similarity = (maxLen - dist) / maxLen;
  return similarity >= threshold;
}

/**
 * Cleans Bengali text for semantic matching.
 */
export function cleanBengaliText(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let s = String(str).toLowerCase().trim();
  s = s.replace(/য়/g, 'য়');
  s = s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
  s = s.replace(/[\u0964\u0965]/g, ' ');
  s = s.replace(/[,\.\-\_\:\;\'\"\(\)\[\]\{\}]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Checks if two text strings or scientific concepts are semantically equivalent.
 * Supports partial word containment (e.g. 'জনন' for 'জনন কোষ'), compound word joining,
 * science ontology dictionary, and fuzzy similarity.
 */
export function areConceptsEquivalent(textA: string | number | undefined | null, textB: string | number | undefined | null): boolean {
  if (textA === undefined || textA === null || textB === undefined || textB === null) return false;
  const rawA = String(textA).trim();
  const rawB = String(textB).trim();
  if (!rawA || !rawB) return false;
  if (rawA.toLowerCase() === rawB.toLowerCase()) return true;

  const cleanA = cleanBengaliText(rawA);
  const cleanB = cleanBengaliText(rawB);
  if (cleanA === cleanB) return true;

  // Check without spaces (compound word joining: জনন কোষ == জননকোষ)
  const noSpaceA = cleanA.replace(/\s+/g, '');
  const noSpaceB = cleanB.replace(/\s+/g, '');
  if (noSpaceA === noSpaceB) return true;

  // 1. Check Science Synonyms Knowledge Graph
  for (const group of COMPREHENSIVE_SCIENCE_SYNONYMS) {
    const hasA = group.some(item => {
      const c = cleanBengaliText(item);
      return c === cleanA || c.replace(/\s+/g, '') === noSpaceA;
    });
    const hasB = group.some(item => {
      const c = cleanBengaliText(item);
      return c === cleanB || c.replace(/\s+/g, '') === noSpaceB;
    });
    if (hasA && hasB) return true;
  }

  // If expressions contain algebraic operators, digits, or numbers, do not apply linguistic token overlap
  const isAlgebraicOrNumeric = /[+\-*/^=><(),;]|\d|[\u09E6-\u09EF]/.test(rawA) || /[+\-*/^=><(),;]|\d|[\u09E6-\u09EF]/.test(rawB);
  if (isAlgebraicOrNumeric) {
    return false;
  }

  // 2. Token Containment & Stemming (e.g. "জনন কোষ" vs "জনন", "মাইটোসিস কোষ বিভাজন" vs "মাইটোসিস")
  const tokensA = cleanA.split(' ').map(stripBengaliSuffix).filter(Boolean);
  const tokensB = cleanB.split(' ').map(stripBengaliSuffix).filter(Boolean);

  if (tokensA.length === 1 && tokensB.length >= 1) {
    const single = tokensA[0];
    if (single.length >= 2 && tokensB.some(t => t === single || fuzzyStringMatch(t, single, 0.85) || t.includes(single))) {
      return true;
    }
  }
  if (tokensB.length === 1 && tokensA.length >= 1) {
    const single = tokensB[0];
    if (single.length >= 2 && tokensA.some(t => t === single || fuzzyStringMatch(t, single, 0.85) || t.includes(single))) {
      return true;
    }
  }

  // Jaccard token overlap
  const setB = new Set(tokensB);
  const intersection = tokensA.filter(t => setB.has(t) || tokensB.some(tb => fuzzyStringMatch(t, tb, 0.85)));
  if (intersection.length > 0) {
    const overlapRatio = intersection.length / Math.min(tokensA.length, tokensB.length);
    if (overlapRatio >= 0.5) return true;
  }

  // Fuzzy match on full string without spaces
  if (noSpaceA.length >= 4 && noSpaceB.length >= 4) {
    if (fuzzyStringMatch(noSpaceA, noSpaceB, 0.82)) return true;
  }

  return false;
}

export function areSynonymsEquivalent(textA: string, textB: string): boolean {
  return areConceptsEquivalent(textA, textB);
}

/**
 * Strips LaTeX delimiters, style macros, fractions, roots, Unicode powers, and braces into clean ASCII.
 */
export function stripLatexAndMathFormatting(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  let s = String(str).trim();
  if (!s) return '';

  // Strip dollar signs & display math markers ($...$, $$...$$, \(...\), \[...\])
  s = s.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();
  s = s.replace(/^\\\(|^\\\[/, '').replace(/\\\)$|\\\]$/, '').trim();
  s = s.replace(/\$/g, '').trim();

  // Strip LaTeX style commands: \text{...}, \mathrm{...}, \mathbf{...}, \ce{...}, etc.
  let prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/\\+(text|mathrm|mathbf|mathit|textbf|textit|bm|mathbb|ce|pu|displaystyle|textstyle)\{([^{}]+)\}/g, '$2');
  }
  s = s.replace(/\\+(displaystyle|textstyle|mathrm|mathbf|mathit|bm|mathbb)\b/g, '');

  // Strip LaTeX spacing and bracket sizing commands
  s = s.replace(/\\+(left|right|Big|bigg|Bigg|quad|qquad)\b/g, '');
  s = s.replace(/\\+(!|,|;|:)/g, '');

  // Convert LaTeX operators \cdot, \times -> *
  s = s.replace(/\\+(cdot|times)/g, '*');
  s = s.replace(/\\+(div)/g, '/');

  // Convert LaTeX mixed fractions: 2\frac{1}{2} -> ((2)+(1)/(2))
  s = s.replace(/(\d+)\s*\\+(frac|dfrac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)+($3)/($4))');

  // Convert calculus derivatives & differential notation before general fraction conversion:
  s = s.replace(/\\+(?:frac|dfrac|tfrac)\{d\^?\{?2\}?y\}\{dx\^?\{?2\}?\}/g, "y''");
  s = s.replace(/\\+(?:frac|dfrac|tfrac)\{dy\}\{dx\}/g, "y'");
  s = s.replace(/\b(?:dy\/dx|\(dy\)\/\(dx\))\b/g, "y'");
  s = s.replace(/\b(?:d\^2y\/dx\^2|\(d\^2y\)\/\(dx\^2\))\b/g, "y''");

  // Convert empty set: \emptyset, \varnothing, {} -> empty_set
  s = s.replace(/\\+(emptyset|varnothing)\b/g, 'empty_set');
  s = s.replace(/^\{\s*\}$/g, 'empty_set');

  // Convert fractions \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b} -> (a)/(b)
  while (/\\+(frac|dfrac|tfrac)/.test(s)) {
    const nextS = s.replace(/\\+(frac|dfrac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '($2)/($3)');
    if (nextS === s) break;
    s = nextS;
  }

  // Convert binomial coefficients: \binom{n}{r}, \dbinom{n}{r}, \tbinom{n}{r} -> binom(n, r)
  while (/\\+(binom|dbinom|tbinom)/.test(s)) {
    const nextS = s.replace(/\\+(binom|dbinom|tbinom)\{([^{}]+)\}\{([^{}]+)\}/g, 'binom($2, $3)');
    if (nextS === s) break;
    s = nextS;
  }

  // Convert combinations and permutations notations:
  // ^{n+1}\mathrm{C}_{r} or ^{n}\mathrm{C}_r or ^nC_r or ^n\mathrm{C}_r -> binom(n, r)
  s = s.replace(/\^\{([^{}]+)\}\s*(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*_\{?([a-zA-Z0-9_\+\-]+)\}?/g, 'binom($1, $2)');
  s = s.replace(/\^\{([^{}]+)\}\s*(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*_\{?([a-zA-Z0-9_\+\-]+)\}?/g, 'perm($1, $2)');
  s = s.replace(/\^([a-zA-Z0-9]+)\s*(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*_\{?([a-zA-Z0-9_\+\-]+)\}?/g, 'binom($1, $2)');
  s = s.replace(/\^([a-zA-Z0-9]+)\s*(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*_\{?([a-zA-Z0-9_\+\-]+)\}?/g, 'perm($1, $2)');

  // Convert explicit function calls: C(n, r), P(n, r)
  s = s.replace(/\b(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'binom($1, $2)');
  s = s.replace(/\b(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'perm($1, $2)');

  // Convert (expr) C (expr) or (expr) P (expr)
  s = s.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1, $2)');
  s = s.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1, $2)');

  // Convert (expr) C token or (expr) P token
  s = s.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*([a-zA-Z0-9_]+)/g, 'binom($1, $2)');
  s = s.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*([a-zA-Z0-9_]+)/g, 'perm($1, $2)');

  // Convert token C (expr) or token P (expr)
  s = s.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1, $2)');
  s = s.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1, $2)');

  // Convert standard nCr, 5C2, nPr, 5P2 (where C/P is uppercase or \mathrm{C}/\mathrm{P})
  s = s.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Cc]\}|C)\s*(\d+|[rRkK])\b/g, 'binom($1, $2)');
  s = s.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Pp]\}|P)\s*(\d+|[rRkK])\b/g, 'perm($1, $2)');

  // Convert sqrt
  s = s.replace(/\\+sqrt\{([^{}]+)\}/g, 'sqrt($1)');
  s = s.replace(/\\+sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '(($2)^(1/($1)))');

  // Convert mixed fractions: 2\frac{1}{2} or 2 1/2 -> ((2)+(1)/(2))
  s = s.replace(/(\d+)\s*\\+(frac|dfrac|tfrac)\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)+($3)/($4))');
  s = s.replace(/\b(\d+)\s+(\d+)\/(\d+)\b/g, '(($1)+($2)/($3))');

  // Convert absolute values: \left| x \right| or |x| -> abs(x)
  s = s.replace(/\\left\|([^{|]+)\\right\|/g, 'abs($1)');
  s = s.replace(/(?<!\|)\|([^|\n]+)\|(?!\|)/g, 'abs($1)');

  // Convert trigonometric powers: \sin^2(x) or sin^2(x) -> ((sin(x))^2)
  s = s.replace(/\\+(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|asin|acos|atan)\^\{?(\d+)\}?\s*(\([^\(\)]+\)|[a-zA-Z0-9_]+)/g, '(($1($3))^$2)');
  s = s.replace(/\b(sin|cos|tan|cot|sec|csc)\^\{?(\d+)\}?\s*(\([^\(\)]+\)|[a-zA-Z0-9_]+)/g, '(($1($3))^$2)');

  // Convert logarithms: \log_{2}(8) -> (log(8)/log(2)), \ln(x) -> ln(x)
  s = s.replace(/\\+log_\{?([0-9a-zA-Z]+)\}?\s*\(([^()]+)\)/g, '(log($2)/log($1))');
  s = s.replace(/\\+(sin|cos|tan|cot|sec|csc|sinh|cosh|tanh|asin|acos|atan|exp|ln|log|abs)\b/g, '$1');

  // Convert recurring / repeating decimals: 0.\dot{3}, 0.3̇, 0.333... -> ((3)/9) = 1/3, 0.\dot{6} -> ((6)/9) = 2/3
  s = s.replace(/0\s*\.\s*\\dot\{?(\d)\}?/g, (m, d) => '((' + d + ')/9)');
  s = s.replace(/0\s*\.\s*(\d)\u0307/g, (m, d) => '((' + d + ')/9)');
  s = s.replace(/\b0\s*\.\s*(\d)\1{3,}(?:\.{3})?\b/g, (m, d) => '((' + d + ')/9)');

  // Convert calculus derivatives & differential notation:
  s = s.replace(/\\+(?:frac|dfrac|tfrac)\{d\^?\{?2\}?y\}\{dx\^?\{?2\}?\}/g, "y''");
  s = s.replace(/\\+(?:frac|dfrac|tfrac)\{dy\}\{dx\}/g, "y'");
  s = s.replace(/\\+(?:frac|dfrac|tfrac)\{\\partial\s*([^{}]+)\}\{\\partial\s*([^{}]+)\}/g, "del($1)/del($2)");
  s = s.replace(/\\+int\b/g, 'int');
  s = s.replace(/\\+lim_\{?([^{}]+)\}?/g, 'lim($1)');

  // Convert set operations & logic:
  s = s.replace(/\\+(cup|bigcup)\b/g, 'U');
  s = s.replace(/\\+(cap|bigcap)\b/g, 'cap');
  s = s.replace(/\\+(emptyset|varnothing)\b/g, 'empty_set');
  s = s.replace(/\\+(in)\b/g, 'in');
  s = s.replace(/\\+(notin)\b/g, 'notin');
  s = s.replace(/\\+(subset|subseteq)\b/g, 'subset');

  // Convert plus-minus & minus-plus: \pm, ± -> +-, \mp, ∓ -> -+
  s = s.replace(/\\+(pm|plusmn)\b|±/g, '+-');
  s = s.replace(/\\+mp\b|∓/g, '-+');

  // Convert LaTeX inequalities: \le, \leq -> <=, \ge, \geq -> >=, \ne, \neq -> !=
  s = s.replace(/\\+(le|leq)\b/g, '<=');
  s = s.replace(/\\+(ge|geq)\b/g, '>=');
  s = s.replace(/\\+(ne|neq)\b/g, '!=');

  // Convert Unicode superscripts & subscripts
  const unicodeMap: Record<string, string> = {
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '+', '⁻': '-', '⁼': '=', '⁽': '(', '⁾': ')',
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
    '₊': '_+', '₋': '_-'
  };
  for (const [u, r] of Object.entries(unicodeMap)) {
    s = s.split(u).join(r);
  }

  // Convert LaTeX power and subscript braces: ^{...} -> ^(...)
  s = s.replace(/\^\{([^{}]+)\}/g, '^($1)');
  s = s.replace(/_\{([^{}]+)\}/g, '_($1)');

  return s;
}

/**
 * Advanced canonical normalizer for math, chemical formulas, ion charges, superscripts, subscripts, and LaTeX.
 */
export function normalizeCanonicalMathOrChemical(raw: string | number | undefined | null): string {
  if (raw === undefined || raw === null) return '';
  let str = normalizeBengaliNumeralsAndText(raw);
  str = stripLatexAndMathFormatting(str);

  // Standardize combinations: C(n, r), nCr, (n+1)Cr, (n+1) choose r -> binom(n, r)
  str = str.replace(/\b(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'binom($1,$2)');
  str = str.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1,$2)');
  str = str.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*([a-zA-Z0-9_]+)/g, 'binom($1,$2)');
  str = str.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1,$2)');
  str = str.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Cc]\}|C)\s*(\d+|[rRkK])\b/g, 'binom($1,$2)');
  str = str.replace(/(.+?)\s+(?:choose|\\choose)\s+(.+?)/g, 'binom($1,$2)');

  // Standardize permutations: P(n, r), nPr, (n+1)Pr -> perm(n, r)
  str = str.replace(/\b(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'perm($1,$2)');
  str = str.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1,$2)');
  str = str.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*([a-zA-Z0-9_]+)/g, 'perm($1,$2)');
  str = str.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1,$2)');
  str = str.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Pp]\}|P)\s*(\d+|[rRkK])\b/g, 'perm($1,$2)');

  // Standardize ion charges and superscripts:
  // e.g. "D^2+", "D^(2+)", "D^+2" -> "D^{2+}"
  str = str.replace(/\^\(?\s*(\d+)\s*([+-])\s*\)?(?![a-zA-Z0-9_\(])/g, '^{$1$2}');
  str = str.replace(/\^\(?\s*([+-])\s*(\d+)\s*\)?(?![a-zA-Z0-9_\(])/g, '^{$2$1}');
  str = str.replace(/\^\(?\s*(\+\+)\s*\)?/g, '^{2+}');
  str = str.replace(/\^\(?\s*(--)\s*\)?/g, '^{2-}');
  str = str.replace(/\^\(?\s*([+-])\s*\)?(?![a-zA-Z0-9_\(])/g, '^{$1}');

  // Simple token superscript: x^2 -> x^{2}, a^b -> a^{b}
  str = str.replace(/\^([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '^{$1}');

  // Simple token subscript: H_2 -> H_{2}
  str = str.replace(/_([a-zA-Z0-9])(?![a-zA-Z0-9_{])/g, '_{$1}');

  return str.replace(/\s+/g, '');
}

/**
 * Creates a flattened representation of a math/chemical expression by stripping
 * non-semantic braces and whitespace so that "D^{2+}" and "D^2+" become identical "D^2+".
 */
export function flattenMathOrChemical(raw: string | number | undefined | null): string {
  const norm = normalizeCanonicalMathOrChemical(raw);
  return norm
    .replace(/[\{\}]/g, '')
    .replace(/\^([+-])(\d+)/g, '^$2$1')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Converts a raw mathematical string or LaTeX expression into a standardized ASCII expression.
 * Handles implicit multiplication, scientific notation (1.5x10^8 -> 1.5e8), juxtaposed variables (GMm -> G*M*m),
 * and fraction expressions (3v/2 -> (3*v)/2 -> 1.5*v).
 */
export function normalizeExpression(rawExpr: string | number | undefined | null): string {
  if (rawExpr === undefined || rawExpr === null) return '';
  const rawStr = String(rawExpr).trim();
  if (!rawStr) return '';

  let expr = normalizeBengaliNumeralsAndText(rawStr);
  expr = stripLatexAndMathFormatting(expr);

  // Standardize combinations and permutations
  expr = expr.replace(/\b(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'binom($1,$2)');
  expr = expr.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1,$2)');
  expr = expr.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*([a-zA-Z0-9_]+)/g, 'binom($1,$2)');
  expr = expr.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, 'binom($1,$2)');
  expr = expr.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Cc]\}|C)\s*(\d+|[rRkK])\b/g, 'binom($1,$2)');

  expr = expr.replace(/\b(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, 'perm($1,$2)');
  expr = expr.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1,$2)');
  expr = expr.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*([a-zA-Z0-9_]+)/g, 'perm($1,$2)');
  expr = expr.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, 'perm($1,$2)');
  expr = expr.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Pp]\}|P)\s*(\d+|[rRkK])\b/g, 'perm($1,$2)');

  // Convert scientific notation: 1.5x10^8 or 1.5*10^8 or 1.5*10^(8) or 1.5 \times 10^{8} -> 1.5e8
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*(?:\*|x|X)\s*10\^\(?([-+]?\d+)\)?/g, '$1e$2');

  // Convert degree angles: 30 deg, 30°, 30^\circ -> (30 * pi / 180)
  expr = expr.replace(/(\d+(?:\.\d+)?)\s*(?:deg|degree|\^\\circ|\\circ|°)\b/gi, '($1*pi/180)');

  // Standardize complex engineering imaginary unit 'j' into 'i': e.g. 4j -> 4*i
  expr = expr.replace(/(\d+)\s*j\b/g, '$1*i');
  expr = expr.replace(/\bj\b/g, 'i');

  // Multi-letter functions and named constants (pi, theta, sin, etc.)
  const funcKeywords = ['sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'ln', 'abs', 'prev', 'binom', 'perm'];
  const constKeywords = ['pi', 'theta', 'lambda', 'omega', 'delta', 'alpha', 'beta', 'gamma', 'rho', 'sigma', 'phi', 'mu'];
  const knownKeywords = [...funcKeywords, ...constKeywords];

  // Tokenize string to preserve multi-letter functions and add explicit multiplication between variables/tokens
  // e.g. "2pir" -> "2 * pi * r", "GMm" -> "G * M * m", "2 pi r" -> "2 * pi * r", "2x" -> "2 * x", "3v/2" -> "(3*v)/2"
  let formatted = '';
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    // Check if substring starts with a known keyword
    let matchedKw: string | null = null;
    for (const kw of knownKeywords) {
      if (expr.substring(i, i + kw.length).toLowerCase() === kw) {
        matchedKw = kw;
        break;
      }
    }

    if (matchedKw) {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        formatted += '*';
      }
      formatted += matchedKw;
      i += matchedKw.length;
      if (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        formatted += '*';
      } else if (i < expr.length && expr[i] === '(' && !funcKeywords.includes(matchedKw)) {
        formatted += '*';
      }
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        formatted += '*';
      }
      formatted += ch;
      i++;
      continue;
    }

    if (/\d/.test(ch)) {
      if (formatted.length > 0 && formatted[formatted.length - 1] === ')') {
        formatted += '*';
      }
      formatted += ch;
      i++;
      continue;
    }

    if (ch === '(') {
      if (formatted.length > 0 && /[a-zA-Z0-9_\)]/.test(formatted[formatted.length - 1])) {
        // Check if preceding token was a function keyword
        const isPrecededByFunc = funcKeywords.some(fn => formatted.endsWith(fn));
        if (!isPrecededByFunc) {
          formatted += '*';
        }
      }
      formatted += ch;
      i++;
      continue;
    }

    formatted += ch;
    i++;
  }

  // Clean syntax artifacts
  formatted = formatted.replace(/\*+/g, '*');
  formatted = formatted.replace(/\(\*/g, '(').replace(/\*\)/g, ')');
  formatted = formatted.replace(/\^\*/g, '^');
  formatted = formatted.replace(/\s+/g, '');

  return formatted;
}

/**
 * Converts ASCII math or raw student text into clean MathJax LaTeX syntax with automatic $...$ delimiters.
 */
export function formatExpressionToLatex(expr: string): string {
  if (!expr || typeof expr !== 'string') return '';

  let raw = normalizeBengaliNumeralsAndText(expr.trim());
  if (!raw) return '';

  // Strip leading/trailing dollar signs first for uniform processing
  let latex = raw.replace(/^\$\$([\s\S]*)\$\$$/, '$1').replace(/^\$([\s\S]*)\$$/, '$1').trim();

  // Convert combinations and permutations in ASCII:
  // binom(n+1, r) or C(n+1, r) or (n+1)Cr or nCr or n+1Cr -> \binom{n}{r}
  latex = latex.replace(/\\?binom\s*\(([^,]+),\s*([^)]+)\)/g, '\\binom{$1}{$2}');
  latex = latex.replace(/\b(?:\\mathrm\{[Cc]\}|\\text\{[Cc]\}|C)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, '\\binom{$1}{$2}');
  latex = latex.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, '\\binom{$1}{$2}');
  latex = latex.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Cc]\}|C)\s*([a-zA-Z0-9_]+)/g, '\\binom{$1}{$2}');
  latex = latex.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Cc]\}|C)\s*\(([^()]+)\)/g, '\\binom{$1}{$2}');
  latex = latex.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Cc]\}|C)\s*(\d+|[rRkK])\b/g, '\\binom{$1}{$2}');

  // perm(n+1, r) or P(n+1, r) or (n+1)Pr or nPr or n+1Pr -> ^{n}\mathrm{P}_{r}
  latex = latex.replace(/\\?perm\s*\(([^,]+),\s*([^)]+)\)/g, '^{$1}\\mathrm{P}_{$2}');
  latex = latex.replace(/\b(?:\\mathrm\{[Pp]\}|\\text\{[Pp]\}|P)\s*\(\s*([^(),]+)\s*,\s*([^(),]+)\s*\)/g, '^{$1}\\mathrm{P}_{$2}');
  latex = latex.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, '^{$1}\\mathrm{P}_{$2}');
  latex = latex.replace(/\(([^()]+)\)\s*(?:\\mathrm\{[Pp]\}|P)\s*([a-zA-Z0-9_]+)/g, '^{$1}\\mathrm{P}_{$2}');
  latex = latex.replace(/([a-zA-Z0-9_]+)\s*(?:\\mathrm\{[Pp]\}|P)\s*\(([^()]+)\)/g, '^{$1}\\mathrm{P}_{$2}');
  latex = latex.replace(/\b(\d+|[nNkKmM])\s*(?:\\mathrm\{[Pp]\}|P)\s*(\d+|[rRkK])\b/g, '^{$1}\\mathrm{P}_{$2}');

  // If it's already full LaTeX with commands
  if (!latex.includes('\\frac') && !latex.includes('\\sqrt') && !latex.includes('\\binom')) {
    latex = latex.replace(/(\d+)\*([a-zA-Z])/g, '$1$2');
    latex = latex.replace(/\*/g, ' \\cdot ');

    // Normalize ion charges and power superscripts: D^2+ -> D^{2+}, x^2 -> x^{2}
    latex = latex.replace(/\^\{?\s*(\d+)\s*([+-])\s*\}?(?![a-zA-Z0-9_\(])/g, '^{$1$2}');
    latex = latex.replace(/\^\{?\s*([+-])\s*(\d+)\s*\}?(?![a-zA-Z0-9_\(])/g, '^{$2$1}');
    latex = latex.replace(/\^\{?\s*(\+\+)\s*\}?/g, '^{2+}');
    latex = latex.replace(/\^\{?\s*(--)\s*\}?/g, '^{2-}');
    latex = latex.replace(/([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)/g, '$1^{$2}');

    // Format simple fractions: (num)/(den) -> \frac{num}{den}
    latex = latex.replace(/\(([^()]+)\)\/\(([^()]+)\)/g, '\\frac{$1}{$2}');
    latex = latex.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, '\\frac{$1}{$2}');

    // Format sqrt(val) -> \sqrt{val}
    latex = latex.replace(/sqrt\(([^()]+)\)/g, '\\sqrt{$1}');
  }

  return `$${latex}$`;
}

// Math evaluation helper functions for combinations, permutations, and factorials
function _calcFactorial(k: number): number {
  if (k < 0) return NaN;
  if (k <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= Math.min(k, 170); i++) res *= i;
  return res;
}

function _calcBinom(n: number, r: number): number {
  n = Math.round(n);
  r = Math.round(r);
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

function _calcPerm(n: number, r: number): number {
  n = Math.round(n);
  r = Math.round(r);
  if (r < 0 || r > n) return 0;
  let res = 1;
  for (let i = 0; i < r; i++) {
    res *= (n - i);
  }
  return res;
}

/**
 * Safely evaluates a simple numeric/algebraic expression for sample variables.
 */
export function evaluateExpressionAtSample(expr: string, vars: Record<string, number> = {}): number | null {
  try {
    let text = normalizeExpression(expr);
    if (!text) return null;

    // Substitute variables (longest variable name first to prevent partial replacements)
    const sortedVars = Object.entries(vars).sort((a, b) => b[0].length - a[0].length);
    for (const [varName, val] of sortedVars) {
      if (varName.toLowerCase() === 'pi') {
        text = text.replace(/(?<![a-zA-Z0-9_])pi(?![a-zA-Z0-9_])/gi, `(${Math.PI})`);
        continue;
      }
      const regex = new RegExp(`(?<![a-zA-Z0-9_])${varName}(?![a-zA-Z0-9_])`, 'g');
      const valStr = (typeof val === 'number' && val < 0) ? `(${val})` : String(val);
      text = text.replace(regex, valStr);
    }

    // Substitute pi constant
    text = text.replace(/(?<![a-zA-Z0-9_])pi(?![a-zA-Z0-9_])/gi, `(${Math.PI})`);

    // Degree angle conversion: 30 deg or 30° -> (30 * Math.PI / 180)
    text = text.replace(/(\d+(?:\.\d+)?)\s*(?:deg|degree|\^\\circ|\\circ|°)\b/gi, '($1 * Math.PI / 180)');

    // Euler's constant e (when not explicitly provided as a sample variable)
    if (!vars['e'] && !vars['E']) {
      text = text.replace(/(?<![a-zA-Z0-9_])e(?![a-zA-Z0-9_])/g, `(${Math.E})`);
    }

    // Convert binom(n, r) and perm(n, r)
    let norm = text.replace(/\bbinom\s*\(([^,]+),\s*([^)]+)\)/g, '_calcBinom($1, $2)');
    norm = norm.replace(/\bperm\s*\(([^,]+),\s*([^)]+)\)/g, '_calcPerm($1, $2)');

    // Convert factorials: (n)! or 5!
    norm = norm.replace(/(\d+|\([^\(\)]+\))!/g, '_calcFactorial($1)');

    // Convert powers: ^(...) or ^\d+ -> **(...) or **\d+
    norm = norm.replace(/\^/g, '**');

    // Convert sqrt and standard math functions
    norm = norm.replace(/\bsqrt\(([^()]+)\)/g, 'Math.sqrt($1)');
    norm = norm.replace(/\bsin\(/g, 'Math.sin(');
    norm = norm.replace(/\bcos\(/g, 'Math.cos(');
    norm = norm.replace(/\btan\(/g, 'Math.tan(');
    norm = norm.replace(/\bcot\(([^()]+)\)/g, '(1/Math.tan($1))');
    norm = norm.replace(/\bsec\(([^()]+)\)/g, '(1/Math.cos($1))');
    norm = norm.replace(/\bcsc\(([^()]+)\)/g, '(1/Math.sin($1))');
    norm = norm.replace(/\basin\(/g, 'Math.asin(');
    norm = norm.replace(/\bacos\(/g, 'Math.acos(');
    norm = norm.replace(/\batan\(/g, 'Math.atan(');
    norm = norm.replace(/\bsinh\(/g, 'Math.sinh(');
    norm = norm.replace(/\bcosh\(/g, 'Math.cosh(');
    norm = norm.replace(/\btanh\(/g, 'Math.tanh(');
    norm = norm.replace(/\bexp\(/g, 'Math.exp(');
    norm = norm.replace(/\bln\(/g, 'Math.log(');
    norm = norm.replace(/\blog\(/g, 'Math.log10(');
    norm = norm.replace(/\babs\(/g, 'Math.abs(');

    // Sanitize string to allow only numbers, operators, Math functions, _calcBinom, _calcPerm, _calcFactorial, scientific notation
    if (/[^0-9\.\+\*\/\(\)\,\sMath\.powsqrt\-eE_calcBinomPermFactorialsincostansecclgexpabsh]/.test(norm)) {
      return null;
    }

    // Do not evaluate comma-separated lists/tuples as JavaScript comma operators
    const commaWithoutFunc = norm.replace(/_calcBinom\([^()]+\)/g, '').replace(/_calcPerm\([^()]+\)/g, '');
    if (commaWithoutFunc.includes(',')) {
      return null;
    }

    // Function constructor safe evaluation
    const evalFunc = new Function('_calcBinom', '_calcPerm', '_calcFactorial', `return ${norm};`);
    const res = Number(evalFunc(_calcBinom, _calcPerm, _calcFactorial));
    return isFinite(res) && !isNaN(res) ? res : null;
  } catch {
    return null;
  }
}

/**
 * Dynamic Algorithm to check if two mathematical / chemical / physical expressions or Bengali text answers are equivalent.
 * 1. Checks direct string equality (case-insensitive & whitespace-free).
 * 2. Checks Bengali & scientific concept equivalence (synonyms, partial token containment, stem matching).
 * 3. Normalizes Bengali digits (০-৯ -> 0-9) and danda.
 * 4. Strips LaTeX formatting, delimiters, style commands, fractions, and root wrappers.
 * 5. Handles equation symmetry (LHS = RHS vs RHS = LHS).
 * 6. Checks numeric float tolerance (e.g., ±0.05).
 * 7. Checks normalized algebraic string equality.
 * 8. Evaluates algebraic equivalence across multiple independent sample points (e.g. 3v/2 == (3/2)*v == 1.5v).
 * 9. Handles product factor permutation (commutativity of multiplication: GMm == GmM == mGM, 2*pi*r == 2*r*pi).
 */
export function areExpressionsEquivalent(
  studentExpr: string | number | undefined | null,
  expectedExpr: string | number | undefined | null,
  tolerance: number = 0.01
): boolean {
  if (studentExpr === undefined || studentExpr === null || expectedExpr === undefined || expectedExpr === null) {
    return false;
  }

  let stuStr = String(studentExpr).trim();
  let expStr = String(expectedExpr).trim();

  if (!stuStr && !expStr) return true;
  if (!stuStr || !expStr) return false;

  // 1. Direct text equality
  if (stuStr.toLowerCase() === expStr.toLowerCase()) return true;

  // 2. Bengali & scientific concept equivalence (e.g. জনন কোষ == জনন, হ্যাঁ == yes, বৃদ্ধি পাবে == increase, শূন্য == 0)
  if (areConceptsEquivalent(stuStr, expStr)) return true;

  // 3. Bengali text & numeral normalization (৯ . ৮ -> 9.8)
  const bnStu = normalizeBengaliNumeralsAndText(stuStr);
  const bnExp = normalizeBengaliNumeralsAndText(expStr);
  if (bnStu.toLowerCase() === bnExp.toLowerCase()) return true;
  if (areConceptsEquivalent(bnStu, bnExp)) return true;

  // 4. Canonical Math & Chemical Normalization (e.g. D^2+ vs D^{2+} vs D²⁺, SO_4^{2-} vs SO_4^2-)
  const canonStu = normalizeCanonicalMathOrChemical(bnStu);
  const canonExp = normalizeCanonicalMathOrChemical(bnExp);
  if (canonStu && canonExp && (canonStu === canonExp || canonStu.toLowerCase() === canonExp.toLowerCase())) {
    return true;
  }

  // 5. Flattened brace-free comparison (strips non-semantic braces)
  const flatStu = flattenMathOrChemical(bnStu);
  const flatExp = flattenMathOrChemical(bnExp);
  if (flatStu && flatExp && flatStu === flatExp) {
    return true;
  }

  // 6. Strip LaTeX and formatting
  const cleanStu = stripLatexAndMathFormatting(bnStu);
  const cleanExp = stripLatexAndMathFormatting(bnExp);
  if (cleanStu.toLowerCase().replace(/\s+/g, '') === cleanExp.toLowerCase().replace(/\s+/g, '')) return true;
  if (areConceptsEquivalent(cleanStu, cleanExp)) return true;

  // 6.1 Physical Units Stripping & Dimensional Comparison (e.g. 9.8 m/s^2 == 9.8 ms^-2 == 9.8 \text{ m/s}^2 == 9.8)
  const UNIT_REGEX = /\s*(?:\\text\{)?(?:\\mathrm\{)?(m\/s\^2|ms\^-2|ms\^\{-2\}|m\/s|ms\^-1|ms\^\{-1\}|km\/h|km\/hr|m\^3|m\^2|cm\^3|cm\^2|mm|cm|km|m|kg\/m\^3|g\/cm\^3|kg|gm|g|mg|N\/m\^2|N\/m|N\*m|Nm|Newton|N|Joule|J\/s|J|kW|MW|Watt|W|kPa|Pascal|Pa|atm|bar|mmHg|Kelvin|K|deg\s*C|deg\s*F|mA|Ampere|Amp|A|kV|mV|Volt|V|k\\Omega|M\\Omega|\\Omega|ohm|Ohm|\\mu\s*C|nC|Coulomb|C|\\mu\s*F|nF|pF|Farad|F|mH|Henry|H|Tesla|T|Weber|Wb|kHz|MHz|GHz|Hertz|Hz|mole|mol|rad\/s|rpm|radian|rad|keV|MeV|eV|মিটার\/সেকেন্ড(?:\^[২2])?|মিটার\/সেকেন্ড|মিটার|সেমি|কিমি|কিলোমিটার|কেজি|গ্রাম|নিউটন|জুল|ওয়াট|ভোল্ট|অ্যাম্পিয়ার|ওহম|প্যাসকেল|হার্টজ|কেলভিন|কুলম্ব|ফ্যারাড)(?:\})?$/i;

  const stripUnit = (s: string) => {
    const trimmed = s.trim();
    const m = trimmed.match(UNIT_REGEX);
    if (m && m.index !== undefined && m.index > 0) {
      return { val: trimmed.slice(0, m.index).trim(), unit: m[1].toLowerCase() };
    }
    return { val: trimmed, unit: null };
  };

  const sUnit = stripUnit(cleanStu);
  const eUnit = stripUnit(cleanExp);
  if ((sUnit.unit || eUnit.unit) && (sUnit.val !== cleanStu || eUnit.val !== cleanExp)) {
    if (areExpressionsEquivalent(sUnit.val, eUnit.val, tolerance)) return true;
  }

  // 6.2 3D Unit Vectors to Coordinate Tuple Equivalence (e.g. 2i + 3j - k == (2, 3, -1))
  const vectorToTuple = (str: string): string | null => {
    const s = str.replace(/\s+/g, '').replace(/\^/g, '');
    const m = s.match(/^([+-]?\d*(?:\.\d+)?)[iî]\+?([+-]?\d*(?:\.\d+)?)[jĵ](?:\+?([+-]?\d*(?:\.\d+)?)[kḵ])?$/);
    if (m) {
      const parseCoeff = (c: string) => {
        if (c === '' || c === '+') return '1';
        if (c === '-') return '-1';
        return c;
      };
      const iVal = parseCoeff(m[1]);
      const jVal = parseCoeff(m[2]);
      const kVal = m[3] ? parseCoeff(m[3]) : '0';
      return `(${iVal}, ${jVal}, ${kVal})`;
    }
    return null;
  };

  const sVec = vectorToTuple(cleanStu);
  const eVec = vectorToTuple(cleanExp);
  if (sVec && areExpressionsEquivalent(sVec, cleanExp, tolerance)) return true;
  if (eVec && areExpressionsEquivalent(cleanStu, eVec, tolerance)) return true;
  if (sVec && eVec && areExpressionsEquivalent(sVec, eVec, tolerance)) return true;

  // 7. Coordinate, Tuple & Multi-Value List Comparison (e.g. (13/5, 0) == (2.6, 0), 13/5,0 == 2.6,0, (1/2, 3/4) == (0.5, 0.75))
  const splitTupleOrList = (str: string): string[] => {
    let s = str.trim();
    if ((s.startsWith('(') && s.endsWith(')')) || (s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      s = s.slice(1, -1).trim();
    }
    const items: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth--;
      else if ((ch === ',' || ch === ';') && depth === 0) {
        if (current.trim()) items.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    }
    if (current.trim()) items.push(current.trim());
    return items;
  };

  // Simultaneous variable assignments: e.g. x = 2, y = 3 vs y = 3, x = 2
  const parseAssignments = (str: string): Record<string, string> | null => {
    const items = splitTupleOrList(str);
    const map: Record<string, string> = {};
    for (const item of items) {
      const eqParts = item.split('=').map(p => p.trim());
      if (eqParts.length === 2 && /^[a-zA-Z_\u0980-\u09FF][a-zA-Z0-9_\u0980-\u09FF]*$/.test(eqParts[0])) {
        map[eqParts[0]] = eqParts[1];
      } else {
        return null;
      }
    }
    return Object.keys(map).length > 1 ? map : null;
  };

  const sAssign = parseAssignments(cleanStu);
  const eAssign = parseAssignments(cleanExp);
  if (sAssign && eAssign && Object.keys(sAssign).length === Object.keys(eAssign).length) {
    const keys = Object.keys(sAssign);
    const allKeysMatch = keys.every(k => eAssign[k] !== undefined && areExpressionsEquivalent(sAssign[k], eAssign[k], tolerance));
    if (allKeysMatch) return true;
  }

  // Plus-Minus (\pm / ±) expansion: e.g. \pm 3 == {3, -3} == 3, -3
  const expandPlusMinus = (str: string): string[] => {
    const s = str.trim();
    if (s.includes('+-')) {
      return [s.replace(/\+\-/g, '+').replace(/^\+/, '').replace(/\s+/g, ''), s.replace(/\+\-/g, '-').replace(/\s+/g, '')];
    }
    if (s.includes('-+')) {
      return [s.replace(/\-\+/g, '-').replace(/\s+/g, ''), s.replace(/\-\+/g, '+').replace(/^\+/, '').replace(/\s+/g, '')];
    }
    return [s];
  };

  const sPM = expandPlusMinus(cleanStu);
  const ePM = expandPlusMinus(cleanExp);
  const sTuple = sPM.length > 1 ? sPM : splitTupleOrList(cleanStu);
  const eTuple = ePM.length > 1 ? ePM : splitTupleOrList(cleanExp);

  if (sTuple.length > 1 && sTuple.length === eTuple.length) {
    const allMatch = sTuple.every((sEl, idx) => areExpressionsEquivalent(sEl, eTuple[idx], tolerance));
    if (allMatch) return true;

    // For set notation {a, b}, plus-minus sets, or unordered root lists, allow permutation matching
    const unmatched = [...eTuple];
    let setMatches = 0;
    for (const sEl of sTuple) {
      const foundIdx = unmatched.findIndex(eEl => areExpressionsEquivalent(sEl, eEl, tolerance));
      if (foundIdx !== -1) {
        setMatches++;
        unmatched.splice(foundIdx, 1);
      }
    }
    if (setMatches === sTuple.length) return true;
  }

  // 8. Inequality Symmetry & Direction Check (e.g. x > 5 vs 5 < x, x <= 10 vs 10 >= x)
  const ineqRegex = /^(.*?)\s*(<=|>=|<|>|!=)\s*(.*?)$/;
  const mStu = cleanStu.match(ineqRegex);
  const mExp = cleanExp.match(ineqRegex);
  if (mStu && mExp) {
    const [, sL, sOp, sR] = mStu;
    const [, eL, eOp, eR] = mExp;
    const flipOp: Record<string, string> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=', '!=': '!=' };
    if (sOp === eOp && areExpressionsEquivalent(sL, eL, tolerance) && areExpressionsEquivalent(sR, eR, tolerance)) {
      return true;
    }
    if (flipOp[sOp] === eOp && areExpressionsEquivalent(sL, eR, tolerance) && areExpressionsEquivalent(sR, eL, tolerance)) {
      return true;
    }
  }

  // 9. Equation Symmetry & Transposition Check (e.g. F = ma vs ma = F, a^3+b^3+c=0 vs c+a^3+b^3=0 vs a^3+b^3=-c)
  if (cleanStu.includes('=') && cleanExp.includes('=')) {
    const sParts = cleanStu.split('=').map(s => s.trim());
    const eParts = cleanExp.split('=').map(s => s.trim());
    if (sParts.length === 2 && eParts.length === 2) {
      if (
        (areExpressionsEquivalent(sParts[0], eParts[0], tolerance) && areExpressionsEquivalent(sParts[1], eParts[1], tolerance)) ||
        (areExpressionsEquivalent(sParts[0], eParts[1], tolerance) && areExpressionsEquivalent(sParts[1], eParts[0], tolerance))
      ) {
        return true;
      }

      // Check algebraic zero-form difference: (sLHS - sRHS) vs (eLHS - eRHS) and -(eLHS - eRHS)
      const sDiff = `(${sParts[0]}) - (${sParts[1]})`;
      const eDiff = `(${eParts[0]}) - (${eParts[1]})`;
      const eDiffNeg = `0 - ((${eParts[0]}) - (${eParts[1]}))`;
      if (areExpressionsEquivalent(sDiff, eDiff, tolerance) || areExpressionsEquivalent(sDiff, eDiffNeg, tolerance)) {
        return true;
      }
    }
  }

  // 8. Percentage and proportion comparison (e.g. 50% == 0.5 == ৫০% == ৫০ শতাংশ)
  const parsePercentOrNumber = (str: string): number | null => {
    if (!str) return null;
    const s = normalizeBengaliNumeralsAndText(str).toLowerCase().trim();
    const m = s.match(/^([\+\-]?\d+(?:\.\d+)?)\s*(?:%|শতাংশ|ভাগ|percent|percentage)$/);
    if (m) {
      return parseFloat(m[1]) / 100;
    }
    const num = parseFloat(s);
    if (!isNaN(num) && (s === String(num) || s === `+${num}`)) {
      return num;
    }
    return null;
  };

  const pStu = parsePercentOrNumber(cleanStu);
  const pExp = parsePercentOrNumber(cleanExp);
  if (pStu !== null && pExp !== null) {
    if (Math.abs(pStu - pExp) <= (tolerance || 0.01)) return true;
  }

  // 9. Direct numeric comparison (with tolerance) for purely numeric values or evaluated formulas (e.g. 5C2 == 10, 5P2 == 20)
  const evalStuDirect = evaluateExpressionAtSample(stuStr);
  const evalExpDirect = evaluateExpressionAtSample(expectedExpr);
  if (evalStuDirect !== null && evalExpDirect !== null) {
    if (Math.abs(evalStuDirect - evalExpDirect) <= (tolerance || 0.01)) return true;
  }

  const numStu = parseFloat(cleanStu.replace(/[$,]/g, ''));
  const numExp = parseFloat(cleanExp.replace(/[$,]/g, ''));
  if (!isNaN(numStu) && !isNaN(numExp) && String(numStu) === cleanStu.trim() && String(numExp) === cleanExp.trim()) {
    if (Math.abs(numStu - numExp) <= tolerance) return true;
  }

  // 10. Normalized algebraic string comparison
  const normStu = normalizeExpression(stuStr);
  const normExp = normalizeExpression(expectedExpr);
  if (normStu && normExp && normStu.toLowerCase() === normExp.toLowerCase()) {
    return true;
  }

  // 11. Multi-point sample point evaluation for variable expressions (e.g. 3v/2 == (3/2)*v == 1.5v, nCr vs binom(n,r))
  const varNames = Array.from(new Set([
    ...(normStu.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []),
    ...(normExp.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [])
  ])).filter(w => !['sqrt', 'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'log', 'ln', 'abs', 'Math', 'pow', 'pi', 'binom', 'perm', '_calcBinom', '_calcPerm', '_calcFactorial'].includes(w.toLowerCase()));

  if (varNames.length > 0) {
    // For combinations/permutations (n, r), test on integer samples as well as primes
    const integerSamples = [
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: [8, 3, 5, 2, 7, 4][i % 6] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: [9, 2, 6, 3, 8, 4][i % 6] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: [10, 4, 7, 2, 9, 3][i % 6] }), {} as Record<string, number>)
    ];

    const primes1 = [2.3, 3.7, 1.9, 4.1, 5.3, 2.9, 3.1, 4.7];
    const primes2 = [5.1, 1.7, 3.3, 2.7, 4.3, 1.3, 5.7, 2.1];
    const primes3 = [3.9, 4.5, 2.1, 1.5, 6.1, 3.5, 4.9, 2.7];

    const primeSamples = [
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes1[i % primes1.length] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes2[i % primes2.length] }), {} as Record<string, number>),
      varNames.reduce((acc, v, i) => ({ ...acc, [v]: primes3[i % primes3.length] }), {} as Record<string, number>)
    ];

    const sampleSets = [...integerSamples, ...primeSamples];

    let allSamplesMatch = true;
    let validSampleCount = 0;

    for (const samples of sampleSets) {
      const valStu = evaluateExpressionAtSample(stuStr, samples);
      const valExp = evaluateExpressionAtSample(expectedExpr, samples);

      if (valStu !== null && valExp !== null && !isNaN(valStu) && !isNaN(valExp) && isFinite(valStu) && isFinite(valExp)) {
        validSampleCount++;
        const diff = Math.abs(valStu - valExp);
        const relativeDiff = Math.abs(valExp) > 1e-6 ? diff / Math.abs(valExp) : diff;
        if (diff > (tolerance || 0.05) && relativeDiff > 0.01) {
          allSamplesMatch = false;
          break;
        }
      } else {
        allSamplesMatch = false;
        break;
      }
    }

    if (validSampleCount >= 2 && allSamplesMatch) {
      return true;
    }
  }

  // 11. Permutation of product factors (e.g. GMm vs GmM vs mGM)
  const extractFactors = (expr: string) => {
    return normalizeExpression(expr).split('*').sort();
  };
  const factorsStu = extractFactors(stuStr);
  const factorsExp = extractFactors(expectedExpr);
  if (factorsStu.length > 1 && factorsStu.join('*') === factorsExp.join('*')) {
    return true;
  }
  if (factorsStu.length > 1 && factorsStu.map(s => s.toLowerCase()).sort().join('*') === factorsExp.map(s => s.toLowerCase()).sort().join('*')) {
    return true;
  }

  return false;
}
