#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Replace Beyond-Syllabus / Esoteric Questions with 100% Core HSC Syllabus Questions
Ensures all questions across the 21 chapters strictly align with NCTB Class 11-12 curriculum.
"""

import openpyxl
import os

BASE_DIR = '/Users/md.rofazhasanrafiu/coding'

REPLACEMENTS = {
    'HSC_Physics_1st_Paper_Chapter_01_Physical_World_and_Measurement.xlsx': {
        2: {
            'topic': 'মাত্রা বিশ্লেষণের মাধ্যমে সমীকরণের শুদ্ধতা যাচাই',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'মাত্রা বিশ্লেষণের সাহায্যে প্রমাণ কর যে, সমত্বরণে গতিশীল বস্তুর সরণের সমীকরণ $s = ut + \\frac{1}{2}at^2$ মাত্রাগতভাবে শুদ্ধ।',
            'modelAnswer': 'বামপক্ষ ও ডানপক্ষের উভয় পদের মাত্রা $[L]$, সুতরাং সমীকরণটি মাত্রাগতভাবে সঠিক।',
            'explanation': 'বামপক্ষের মাত্রা: $[s] = [L]$\nডানপক্ষের ১ম পদের মাত্রা: $[ut] = [LT^{-1}][T] = [L]$\n২য় পদের মাত্রা: $[\\frac{1}{2}at^2] = [LT^{-2}][T^2] = [L]$\nযেহেতু সমীকরণের প্রতিটি পদের মাত্রা সমান $[L]$, তাই সমজাতীয়তার নীতি অনুসারে সমীকরণটি শুদ্ধ।',
            'primaryImage': None
        },
        3: {
            'topic': 'মাত্রা বিশ্লেষণের সাহায্যে সূত্রের প্রতিপাদন',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': 'ধরা যাক একটি সরল দোলকের পর্যায়কাল ($T$), কার্যকরী দৈর্ঘ্য ($l$) এবং অভিকর্ষজ ত্বরণ ($g$)-এর ওপর নির্ভরশীল। মাত্রিক পদ্ধতির সাহায্যে পর্যায়কালের সমীকরণ প্রতিপাদন কর।',
            'modelAnswer': '$T = k\\sqrt{\\frac{l}{g}}$ (যেখানে $k = 2\\pi$ একটি মাত্রাহীন ধ্রুবক)',
            'explanation': 'ধরি, $T \\propto l^a g^b \\implies T = k l^a g^b$\nউভয়পক্ষের মাত্রা বসিয়ে পাই, $[T] = [L]^a [LT^{-2}]^b = [L]^{a+b} [T]^{-2b}$\nউভয়পক্ষের ঘাত তুলনা করে পাই:\n$a + b = 0$ এবং $-2b = 1 \\implies b = -1/2, a = 1/2$\n$\\therefore T = k l^{1/2} g^{-1/2} = k \\sqrt{\\frac{l}{g}}$। পরীক্ষায় প্রাপ্ত মান $k = 2\\pi$।',
            'primaryImage': None
        },
        4: {
            'topic': 'স্টোকসের সান্দ্র বলের মাত্রা বিশ্লেষণ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'সান্দ্র তরলে গতিশীল ক্ষুদ্র গোলকের ওপর প্রযুক্ত সান্দ্র বল ($F$) তরলের সান্দ্রতাঙ্ক ($\\eta$), গোলকের ব্যাসার্ধ ($r$) ও প্রান্তিক বেগ ($v$)-এর ওপর নির্ভর করে। মাত্রিক উপায়ে সান্দ্র বলের সমীকরণ প্রতিষ্ঠা কর।',
            'modelAnswer': '$F = k \\eta r v$ (যেখানে $k = 6\\pi$)',
            'explanation': 'ধরি, $F = k \\eta^a r^b v^c$\nমাত্রা সমীকরণ: $[MLT^{-2}] = [ML^{-1}T^{-1}]^a [L]^b [LT^{-1}]^c = [M]^a [L]^{-a+b+c} [T]^{-a-c}$\nতুলনা করে পাই: $a = 1, -a-c = -2 \\implies c = 1, -1+b+1 = 1 \\implies b = 1$\n$\\therefore F = k \\eta r v$। স্টোকসের সূত্রানুসারে $k = 6\\pi$।',
            'primaryImage': None
        },
        8: {
            'topic': 'স্লাইড ক্যালিপার্সে ভার্নিয়ার ধ্রুবক ও যান্ত্রিক ত্রুটি',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'একটি স্লাইড ক্যালিপার্সের প্রধান স্কেলের ক্ষুদ্রতম এক ঘরের মান $1\\text{ mm}$ এবং ভার্নিয়ার স্কেলের $20$ ভাগ প্রধান স্কেলের $19$ ভাগের সমান। ভার্নিয়ার ধ্রুবক ($VC$) নির্ণয় কর। যদি যন্ত্রটিতে $+0.02\\text{ cm}$ ধনাত্মক যান্ত্রিক ত্রুটি থাকে, তবে প্রকৃত পাঠের সাথে এর সম্পর্ক ব্যাখ্যা কর।',
            'modelAnswer': '$VC = 0.05\\text{ mm} = 0.005\\text{ cm}$ (প্রকৃত পাঠ = প্রাপ্ত পাঠ - ধনাত্মক ত্রুটি)',
            'explanation': 'ভার্নিয়ার ধ্রুবক: $VC = \\frac{s}{n} = \\frac{1\\text{ mm}}{20} = 0.05\\text{ mm} = 0.005\\text{ cm}$\nধনাত্মক যান্ত্রিক ত্রুটির ক্ষেত্রে ভার্নিয়ারের শূন্য দাগ প্রধান স্কেলের শূন্য দাগের ডানে থাকে।\n$\\therefore$ প্রকৃত পাঠ = প্রাপ্ত পাঠ - যান্ত্রিক ত্রুটি $= M + (V \\times VC) - (+0.02\\text{ cm})$।',
            'primaryImage': None
        },
        46: {
            'topic': 'স্ফেরোমিটার দ্বারা গোলীয় তলের বক্রতার ব্যাসার্ধ',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': 'একটি স্ফেরোমিটারের তিন পায়ের মধ্যবর্তী গড় দূরত্ব $d$ এবং উত্তল তলের জন্য কেন্দ্রীয় স্ক্রুর উল্লম্ব সরণ $h$ হলে, গোলীয় তলের বক্রতার ব্যাসার্ধের সমীকরণ $R = \\frac{d^2}{6h} + \\frac{h}{2}$ প্রতিপাদন কর।',
            'modelAnswer': '$R = \\frac{d^2}{6h} + \\frac{h}{2}$',
            'explanation': 'স্ফেরোমিটারের তিন পা সমবাহু ত্রিভুজ গঠন করে যার পরিলিখিত বৃত্তের ব্যাসার্ধ $r = \\frac{d}{\\sqrt{3}}$।\nগোলকের জ্যামিতি হতে পাই: $r^2 = h(2R - h) \\implies 2Rh - h^2 = r^2$\n$\\implies 2Rh = r^2 + h^2 = \\frac{d^2}{3} + h^2 \\implies R = \\frac{d^2}{6h} + \\frac{h}{2}$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_1st_Paper_Chapter_03_Dynamics.xlsx': {
        44: {
            'topic': 'খাড়া উপরের দিকে নিক্ষিপ্ত বস্তুর সর্বোচ্চ উচ্চতা ও উড্ডয়নকাল',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'একটি বস্তুকে $v_0$ বেগে খাড়া উপরের দিকে নিক্ষেপ করা হলে দেখাও যে, এর সর্বোচ্চ উচ্চতা $H = \\frac{v_0^2}{2g}$ এবং মোট উড্ডয়নকাল $T = \\frac{2v_0}{g}$।',
            'modelAnswer': '$H = \\frac{v_0^2}{2g}$, $T = \\frac{2v_0}{g}$',
            'explanation': 'সর্বোচ্চ বিন্দুতে শেষ বেগ $v = 0$।\nগতি সমীকরণ: $v^2 = v_0^2 - 2gH \\implies 0 = v_0^2 - 2gH \\implies H = \\frac{v_0^2}{2g}$\nসর্বোচ্চ বিন্দুতে ওঠার সময়: $v = v_0 - gt_1 \\implies t_1 = \\frac{v_0}{g}$\nপতনের সময় $t_2 = t_1$ হওয়ায় মোট উড্ডয়নকাল $T = t_1 + t_2 = \\frac{2v_0}{g}$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_1st_Paper_Chapter_04_Newtonian_Mechanics.xlsx': {
        40: {
            'topic': 'একমাত্রিক স্থিতিস্থাপক সংঘর্ষে সংঘর্ষ পরবর্তী বেগ প্রতিপাদন',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': '$m_1$ ও $m_2$ ভরের দুটি বস্তু যথাক্রমে $u_1$ ও $u_2$ আদিবেগে চলে একমাত্রিক স্থিতিস্থাপক সংঘর্ষে লিপ্ত হলো। ভরবেগ ও গতিশক্তির সংরক্ষণশীলতা প্রয়োগ করে সংঘর্ষ পরবর্তী বেগ $v_1$ ও $v_2$-এর রাশিমালা প্রতিপাদন কর।',
            'modelAnswer': '$v_1 = \\frac{m_1 - m_2}{m_1 + m_2}u_1 + \\frac{2m_2}{m_1 + m_2}u_2$, $v_2 = \\frac{2m_1}{m_1 + m_2}u_1 + \\frac{m_2 - m_1}{m_1 + m_2}u_2$',
            'explanation': 'রৈখিক ভরবেগের নিত্যতা: $m_1(u_1 - v_1) = m_2(v_2 - u_2)$ ... (১)\nগতিশক্তির নিত্যতা: $m_1(u_1^2 - v_1^2) = m_2(v_2^2 - u_2^2)$ ... (২)\n(২) কে (১) দ্বারা ভাগ করে পাই: $u_1 + v_1 = v_2 + u_2 \\implies u_1 - u_2 = v_2 - v_1$ (আপেক্ষিক বেগ সমান ও বিপরীত)\nএই সম্পর্ক (১)-এ বসিয়ে প্রতিপাদিত হয়:\n$v_1 = \\frac{m_1 - m_2}{m_1 + m_2}u_1 + \\frac{2m_2}{m_1 + m_2}u_2$ এবং $v_2 = \\frac{2m_1}{m_1 + m_2}u_1 + \\frac{m_2 - m_1}{m_1 + m_2}u_2$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_1st_Paper_Chapter_05_Work_Energy_and_Power.xlsx': {
        19: {
            'topic': 'স্প্রিং বল দ্বারা কৃতকাজ ও স্থিতিশক্তি প্রতিপাদন',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'একটি আদর্শ স্প্রিংকে সাম্যাবস্থা হতে $x$ পরিমাণ প্রসারিত করতে স্প্রিং বলের বিরুদ্ধে বাহ্যিক বল দ্বারা কৃতকাজের রাশিমালা $W = \\frac{1}{2}kx^2$ সমাকলন পদ্ধতির সাহায্যে প্রতিপাদন কর।',
            'modelAnswer': '$W = \\frac{1}{2}kx^2$',
            'explanation': 'হুকের সূত্রানুসারে প্রসারণ $x$-এর জন্য প্রত্যয়নী বল $F_s = -kx$।\nবাহ্যিক প্রযুক্ত বল $F_{ext} = kx$।\nক্ষুদ্র সরণ $dx$-এর জন্য কৃতকাজ $dW = F_{ext} dx = kx dx$\nমোট কৃতকাজ: $W = \\int_0^x kx dx = k \\left[\\frac{x^2}{2}\\right]_0^x = \\frac{1}{2}kx^2$। এই কাজই স্প্রিং-এ স্থিতিশক্তি হিসেবে জমা থাকে।',
            'primaryImage': None
        },
        44: {
            'topic': 'উল্লম্ব বৃত্তাকার পথে ঘূর্ণায়মান বস্তুর সুতার টান',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': 'একটি উলম্ব বৃত্তাকার পথে $m$ ভরের বস্তু $r$ ব্যাসার্ধের সুতায় ঘুরছে। গতিশক্তির নিত্যতা ব্যবহার করে দেখাও যে, ঘূর্ণন অক্ষুণ্ণ রাখতে সর্বনিম্ন বিন্দু ও সর্বোচ্চ বিন্দুতে সুতার টানের পার্থক্য সর্বদা $6mg$।',
            'modelAnswer': '$T_L - T_T = 6mg$',
            'explanation': 'সর্বনিম্ন বিন্দুতে: $T_L - mg = \\frac{m v_L^2}{r} \\implies T_L = mg + \\frac{m v_L^2}{r}$\nসর্বোচ্চ বিন্দুতে: $T_T + mg = \\frac{m v_T^2}{r} \\implies T_T = \\frac{m v_T^2}{r} - mg$\nশক্তির নিত্যতা: $\\frac{1}{2}mv_L^2 = \\frac{1}{2}mv_T^2 + mg(2r) \\implies v_L^2 - v_T^2 = 4gr$\nটানের পার্থক্য: $T_L - T_T = 2mg + \\frac{m(v_L^2 - v_T^2)}{r} = 2mg + \\frac{m(4gr)}{r} = 6mg$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_1st_Paper_Chapter_07_Structural_Properties_of_Matter.xlsx': {
        21: {
            'topic': 'টানা তারে স্থিতিস্থাপক স্থিতিশক্তি ও শক্তি ঘনত্ব প্রতিপাদন',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'প্রমাণ কর যে, দৈর্ঘ্য বিকৃতির ক্ষেত্রে টানা তারের একক আয়তনে সঞ্চিত স্থিতিস্থাপক বিভব শক্তি (শক্তি ঘনত্ব) $u = \\frac{1}{2} \\times \\text{পীড়ন} \\times \\text{বিকৃতি} = \\frac{1}{2} Y \\times (\\text{বিকৃতি})^2$।',
            'modelAnswer': '$u = \\frac{1}{2} \\times \\text{পীড়ন} \\times \\text{বিকৃতি}$',
            'explanation': 'দৈর্ঘ্য $L$ ও প্রস্থচ্ছেদ $A$ বিশিষ্ট তারে $x$ প্রসারণের জন্য প্রযুক্ত বল $F = \\frac{YA x}{L}$।\nমোট কৃতকাজ: $W = \\int_0^l F dx = \\frac{YA}{L} \\int_0^l x dx = \\frac{1}{2} \\frac{YA l^2}{L} = \\frac{1}{2} F l$\nতারের আয়তন $V = A L$।\n$\\therefore$ একক আয়তনে সঞ্চিত শক্তি: $u = \\frac{W}{V} = \\frac{1}{2} \\frac{F l}{A L} = \\frac{1}{2} \\left(\\frac{F}{A}\\right) \\left(\\frac{l}{L}\\right) = \\frac{1}{2} \\times \\text{পীড়ন} \\times \\text{বিকৃতি}$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_1st_Paper_Chapter_08_Periodic_Motion.xlsx': {
        16: {
            'topic': 'সরল ছন্দিত গতির ব্যবকলনীয় সমীকরণ ও সরণের রাশিমালা',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': 'সরল ছন্দিত স্পন্দনের মৌলিক ব্যবকলনীয় সমীকরণ $\\frac{d^2x}{dt^2} + \\omega^2 x = 0$ সমাধান করে সরণের সাধারণ সমীকরণ $x = A\\sin(\\omega t + \\delta)$ প্রতিপাদন কর।',
            'modelAnswer': '$x = A\\sin(\\omega t + \\delta)$',
            'explanation': 'ব্যবকলনীয় সমীকরণ: $\\frac{d^2x}{dt^2} = -\\omega^2 x$\nধরি $v = \\frac{dx}{dt}$, তাহলে $\\frac{d^2x}{dt^2} = v\\frac{dv}{dx} = -\\omega^2 x$\n$\\implies v dv = -\\omega^2 x dx \\implies \\frac{v^2}{2} = -\\frac{\\omega^2 x^2}{2} + C$\n$x = A$ হলে $v = 0 \\implies C = \\frac{\\omega^2 A^2}{2} \\implies v = \\frac{dx}{dt} = \\omega\\sqrt{A^2 - x^2}$\n$\\implies \\frac{dx}{\\sqrt{A^2 - x^2}} = \\omega dt \\implies \\sin^{-1}\\left(\\frac{x}{A}\\right) = \\omega t + \\delta \\implies x = A\\sin(\\omega t + \\delta)$।',
            'primaryImage': None
        },
        17: {
            'topic': 'সরল ছন্দিত স্পন্দনে যান্ত্রিক শক্তির নিত্যতা প্রমাণ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'দেখাও যে, সরল ছন্দিত স্পন্দনে যেকোনো বিন্দুতে গতিশক্তি ও স্থিতিশক্তির সমষ্টি ধ্রুবক এবং তা $E = \\frac{1}{2}m\\omega^2 A^2 = \\frac{1}{2}kA^2$-এর সমান।',
            'modelAnswer': '$E_{tot} = E_k + E_p = \\frac{1}{2}kA^2 = \\text{ধ্রুবক}$',
            'explanation': 'সরণ $x$ হলে গতিশক্তি: $E_k = \\frac{1}{2}mv^2 = \\frac{1}{2}m\\omega^2 (A^2 - x^2)$\nস্থিতিশক্তি: $E_p = \\frac{1}{2}kx^2 = \\frac{1}{2}m\\omega^2 x^2$\nমোট যান্ত্রিক শক্তি: $E_{tot} = E_k + E_p = \\frac{1}{2}m\\omega^2 A^2 - \\frac{1}{2}m\\omega^2 x^2 + \\frac{1}{2}m\\omega^2 x^2 = \\frac{1}{2}m\\omega^2 A^2 = \\frac{1}{2}kA^2$\nযেহেতু $k$ ও বিস্তার $A$ ধ্রুবক, তাই মোট শক্তি সময়ের সাথে বা সরণের পরিবর্তনে ধ্রুব থাকে।',
            'primaryImage': None
        },
        44: {
            'topic': 'স্প্রিং-এর শ্রেণি ও সমান্তরাল সমবায়ের তুল্য ধ্রুবক',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': '$k_1$ ও $k_2$ স্প্রিং ধ্রুবক বিশিষ্ট দুটি স্প্রিং-এর (ক) শ্রেণি সমবায় এবং (খ) সমান্তরাল সমবায়ের তুল্য স্প্রিং ধ্রুবকের রাশিমালা প্রতিপাদন কর।',
            'modelAnswer': 'শ্রেণি: $\\frac{1}{k_s} = \\frac{1}{k_1} + \\frac{1}{k_2}$, সমান্তরাল: $k_p = k_1 + k_2$',
            'explanation': '(ক) শ্রেণি সমবায়ে উভয় স্প্রিং-এ বল $F$ একই থাকে এবং মোট প্রসারণ $x = x_1 + x_2$:\n$\\frac{F}{k_s} = \\frac{F}{k_1} + \\frac{F}{k_2} \\implies \\frac{1}{k_s} = \\frac{1}{k_1} + \\frac{1}{k_2} \\implies k_s = \\frac{k_1 k_2}{k_1 + k_2}$\n(খ) সমান্তরাল সমবায়ে উভয় স্প্রিং-এর প্রসারণ $x$ সমান থাকে এবং মোট বল $F = F_1 + F_2$:\n$k_p x = k_1 x + k_2 x \\implies k_p = k_1 + k_2$।',
            'primaryImage': None
        },
        50: {
            'topic': 'সরল দোলকের সাহায্যে g নির্ণয়ের তত্ত্ব ও লেখচিত্র',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'একটি সরল দোলকের কার্যকরী দৈর্ঘ্য $L$ এবং পর্যায়কাল $T$ হলে, $T^2$ বনাম $L$ লেখচিত্র ব্যবহার করে অভিকর্ষজ ত্বরণ $g$ নির্ণয়ের নীতি ব্যাখ্যা কর।',
            'modelAnswer': '$g = \\frac{4\\pi^2}{m}$ (যেখানে $m$ হলো $T^2$ বনাম $L$ লেখচিত্রের ঢাল)',
            'explanation': 'সরল দোলকের পর্যায়কাল: $T = 2\\pi \\sqrt{\\frac{L}{g}} \\implies T^2 = \\left(\\frac{4\\pi^2}{g}\\right) L$\nএটি $y = mx$ আকারের মূলবিন্দুগামী সরলরেখা নির্দেশ করে, যেখানে ঢাল $m = \\frac{\\Delta(T^2)}{\\Delta L} = \\frac{4\\pi^2}{g}$।\n$\\therefore$ অভিকর্ষজ ত্বরণ: $g = \\frac{4\\pi^2}{\\text{ঢাল (Slope)}} = \\frac{4\\pi^2}{m}$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_2nd_Paper_Chapter_03_Current_Electricity.xlsx': {
        11: {
            'topic': 'তড়িৎ প্রবাহ ও তাড়ন বেগের মধ্যে সম্পর্ক প্রতিপাদন',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'একটি পরিবাহীর প্রস্থচ্ছেদের ক্ষেত্রফল $A$, মুক্ত ইলেকট্রন ঘনত্ব $n$, ইলেকট্রনের আধান $e$ এবং তাড়ন বেগ $v_d$ হলে প্রমাণ কর যে, তড়িৎ প্রবাহ $I = nAev_d$ এবং প্রবাহ ঘনত্ব $J = nev_d$।',
            'modelAnswer': '$I = nAev_d$, $J = nev_d$',
            'explanation': '$t$ সময়ে পরিবাহীর $l = v_d t$ দৈর্ঘ্যের মধ্যকার সমস্ত মুক্ত ইলেকট্রন কোনো প্রস্থচ্ছেদ অতিক্রম করে।\nউক্ত অংশের আয়তন $V = A l = A v_d t$\nমোট মুক্ত ইলেকট্রনের সংখ্যা $N = n V = n A v_d t$\nপ্রবাহিত মোট আধান $Q = N e = n A e v_d t$\n$\\therefore$ তড়িৎ প্রবাহ $I = \\frac{Q}{t} = \\frac{n A e v_d t}{t} = nAev_d$\nপ্রবাহ ঘনত্ব $J = \\frac{I}{A} = nev_d$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_2nd_Paper_Chapter_04_Magnetic_Effects_of_Current_and_Magnetism.xlsx': {
        25: {
            'topic': 'চৌম্বক ক্ষেত্রে স্থাপিত বিদ্যুৎবাহী তারের ওপর প্রযুক্ত বল',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': '$B$ মানের সুষম চৌম্বক ক্ষেত্রে স্থাপিত $L$ দৈর্ঘ্যের পরিবাহী তারে $I$ তড়িৎ প্রবাহিত হলে প্রযুক্ত লরেন্টজ বল $F = BIL\\sin\\theta$ প্রতিপাদন কর।',
            'modelAnswer': '$F = BIL\\sin\\theta$',
            'explanation': 'একটি মুক্ত ইলেকট্রনের ওপর ক্রিয়াশীল চৌম্বক বল: $f = e(v_d \\times B) \\implies f = e v_d B \\sin\\theta$\nতারের মোট মুক্ত ইলেকট্রন সংখ্যা $N = n A L$\nতারের ওপর প্রযুক্ত মোট বল: $F = N f = (n A L) (e v_d B \\sin\\theta) = (n A e v_d) L B \\sin\\theta$\nযেহেতু তড়িৎ প্রবাহ $I = nAev_d$, সুতরাং $F = I L B \\sin\\theta = BIL\\sin\\theta$।\nভেক্টর রূপে: $\\vec{F} = I(\\vec{L} \\times \\vec{B})$।',
            'primaryImage': None
        }
    },
    'HSC_Physics_2nd_Paper_Chapter_10_Semiconductor_and_Electronics.xlsx': {
        4: {
            'topic': 'শক্তি ব্যান্ড তত্ত্ব ও পদার্থের শ্রেণিবিভাগ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'শক্তি ব্যান্ড তত্ত্বের (যোজন ব্যান্ড, পরিবহন ব্যান্ড ও নিষিদ্ধ শক্তি ফাঁক $E_g$) ভিত্তিতে পরিবাহী, অর্ধপরিবাহী ও অপরিবাহীর মধ্যকার পার্থক্য চিত্রসহ ব্যাখ্যা কর।',
            'modelAnswer': 'পরিবাহী: $E_g = 0$ (ব্যান্ড ওভারল্যাপ), অর্ধপরিবাহী: $E_g \\approx 1.1\\text{ eV}$, অপরিবাহী: $E_g > 5\\text{ eV}$',
            'explanation': '(১) পরিবাহী: যোজন ও পরিবহন ব্যান্ড একে অপরকে উপরিপাতিত করে ($E_g = 0$), ফলে সাধারণ তাপমাত্রায় প্রচুর মুক্ত ইলেকট্রন থাকে।\n(২) অর্ধপরিবাহী: নিষিদ্ধ শক্তি ফাঁক অত্যন্ত সংকীর্ণ ($E_g \\approx 0.7 - 1.1\\text{ eV}$)। পরম শূন্য তাপমাত্রায় অপরিবাহী কিন্তু কক্ষ তাপমাত্রায় কিছু ইলেকট্রন পরিবহন ব্যান্ডে গিয়ে তড়িৎ পরিবহন করে।\n(৩) অপরিবাহী: নিষিদ্ধ শক্তি ফাঁক অত্যন্ত প্রশস্ত ($E_g > 5\\text{ eV}$), ফলে স্বাভাবিক অবস্থায় ইলেকট্রন যোজন ব্যান্ড হতে পরিবহন ব্যান্ডে যেতে পারে না।',
            'primaryImage': None
        },
        9: {
            'topic': 'অর্ধপরিবাহীতে ডোপায়ন ও P-টাইপ ও N-টাইপ গঠন',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'বিশুদ্ধ সিলিকনে (ক) ত্রিযোজী মৌল এবং (খ) পঞ্চযোজী মৌল ডোপায়ন করলে কীভাবে যথাক্রমে P-টাইপ এবং N-টাইপ অর্ধপরিবাহী গঠিত হয় তা ব্যাখ্যা কর। এতে গরিষ্ঠ ও লঘিষ্ঠ আধান বাহক কারা?',
            'modelAnswer': 'P-টাইপ: ত্রিযোজী ডোপান্ট (বোরন), গরিষ্ঠ বাহক হোল; N-টাইপ: পঞ্চযোজী ডোপান্ট (ফসফরাস), গরিষ্ঠ বাহক ইলেকট্রন।',
            'explanation': '(ক) বিশুদ্ধ সিলিকনে ত্রিযোজী অপদ্রব্য (যেমন B, Al) যোগ করলে চারটি সমযোজী বন্ধনের মধ্যে তিনটি পূর্ণ হয় এবং একটি ইলেকট্রনের ঘাটতি থেকে যায়, যাকে হোল (Hole) বলে। এটি P-টাইপ অর্ধপরিবাহী তৈরি করে যেখানে হোল হলো গরিষ্ঠ বাহক।\n(খ) পঞ্চযোজী অপদ্রব্য (যেমন P, As) যোগ করলে পঞ্চম ইলেকট্রনটি বন্ধনে অংশ না নিয়ে মুক্ত থাকে। এটি N-টাইপ অর্ধপরিবাহী তৈরি করে যেখানে ইলেকট্রন হলো গরিষ্ঠ বাহক।',
            'primaryImage': None
        },
        10: {
            'topic': 'পি-এন জাংশন ডায়োডের বায়াসিং ও ডিপ্লেশন স্তর',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'পি-এন জাংশনে সম্মুখী ঝোঁক (Forward Bias) এবং বিমুখী ঝোঁক (Reverse Bias) প্রয়োগ করলে নিঃশেষিত স্তর (Depletion Layer) ও বিভব প্রাচীরের কীরূপ পরিবর্তন ঘটে?',
            'modelAnswer': 'সম্মুখী ঝোঁকে ডিপ্লেশন স্তর ও বিভব প্রাচীর হ্রাস পায়; বিমুখী ঝোঁকে ডিপ্লেশন স্তর ও বিভব প্রাচীর বৃদ্ধি পায়।',
            'explanation': '(১) সম্মুখী ঝোঁক: P-প্রান্ত ব্যাটারির ধনাত্মক এবং N-প্রান্ত ঋণাত্মক প্রান্তের সাথে যুক্ত করলে বাহ্যিক তড়িৎক্ষেত্র অভ্যন্তরীণ বিভব প্রাচীরের বিপরীত ক্রিয়া করে। ফলে নিঃশেষিত স্তর সরু হয় এবং বিভব প্রাচীর হ্রাস পেয়ে সহজে তড়িৎ প্রবাহিত হয়।\n(২) বিমুখী ঝোঁক: P-প্রান্ত ঋণাত্মক ও N-প্রান্ত ধনাত্মক প্রান্তের সাথে যুক্ত করলে বাহ্যিক ক্ষেত্র বিভব প্রাচীরকে শক্তিশালী করে। ফলে নিঃশেষিত স্তর চওড়া হয় এবং কোনো গরিষ্ঠ প্রবাহ চলে না (শুধুমাত্র সামান্য লঘিষ্ঠ প্রবাহ থাকে)।',
            'primaryImage': None
        },
        12: {
            'topic': 'পূর্ণ-তরঙ্গ ব্রিজ একমুখীকারক (Full-Wave Bridge Rectifier)',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': 'চারটি পি-এন জাংশন ডায়োড দ্বারা গঠিত পূর্ণ-তরঙ্গ ব্রিজ একমুখীকারকের (Bridge Rectifier) বর্তনী চিত্র অঙ্কন করে পরিবর্তী প্রবাহকে (AC) একমুখী প্রবাহে (DC) রূপান্তরের কার্যপ্রণালী ব্যাখ্যা কর।',
            'modelAnswer': 'ধনাত্মক অর্ধচক্রে $D_1, D_3$ সম্মুখী এবং ঋণাত্মক অর্ধচক্রে $D_2, D_4$ সম্মুখী হয়ে লোডে একই দিকে ডিসি প্রবাহ তৈরি করে।',
            'explanation': 'ইনপুট এসির ধনাত্মক অর্ধচক্রে ডায়োড $D_1$ ও $D_3$ সম্মুখী বায়াসপ্রাপ্ত হয়ে বিদ্যুৎ সঞ্চালন করে এবং লোড $R_L$-এর মধ্য দিয়ে নির্দিষ্ট দিকে তড়িৎ প্রবাহিত হয়। ঋণাত্মক অর্ধচক্রে $D_2$ ও $D_4$ সম্মুখী বায়াসপ্রাপ্ত হয় এবং লোড $R_L$-এর মধ্য দিয়ে একই অভিমুখে তড়িৎ প্রবাহিত হয়। ফলে ইনপুট এসির উভয় অর্ধচক্রেই লোডে একমুখী স্পন্দিত ডিসি আউটপুট পাওয়া যায়।',
            'primaryImage': None
        }
    },
    'HSC_Physics_2nd_Paper_Chapter_11_Astronomy.xlsx': {
        10: {
            'topic': 'কেপলারের গ্রহের গতির ১ম সূত্র (কক্ষপথের সূত্র)',
            'difficulty': 'EASY',
            'marks': 2,
            'questionText': 'কেপলারের গ্রহের গতির ১ম সূত্রটি (কক্ষপথের সূত্র) বিবৃত কর এবং উপবৃত্তাকার কক্ষপথের দুটি নাভির একটিতে সূর্যের অবস্থানের জ্যামিতিক তাৎপর্য ব্যাখ্যা কর।',
            'modelAnswer': 'প্রতিটি গ্রহই সূর্যকে একটি নাভিতে (Focus) রেখে উপবৃত্তাকার কক্ষপথে প্রদক্ষিণ করে।',
            'explanation': 'সূত্র: প্রতিটি গ্রহ সূর্যকে একটি নাভিতে বা ফোকাসে রেখে উপবৃত্তাকার পথে প্রদক্ষিণ করে।\nতাৎপর্য: উপবৃত্তাকার কক্ষপথের কারণে সূর্য থেকে গ্রহের দূরত্ব সর্বদা সমান থাকে না। গ্রহ যখন সূর্যের নিকটতম অবস্থানে থাকে তাকে অনুসুর (Perihelion) এবং যখন দূরতম অবস্থানে থাকে তাকে অপসুর (Aphelion) বলে।',
            'primaryImage': None
        },
        11: {
            'topic': 'কেপলারের ২য় সূত্র হতে কৌণিক ভরবেগের সংরক্ষণশীলতা',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'কেপলারের গ্রহের গতির ২য় সূত্রটি (ক্ষেত্রফলের সূত্র) বিবৃত কর এবং দেখাও যে এটি কেন্দ্রীয় বলের অধীনে কৌণিক ভরবেগের সংরক্ষণশীলতার প্রত্যক্ষ ফলাফল।',
            'modelAnswer': 'গ্রহ ও সূর্যের সংযোগকারী সরলরেখা সমান সময়ে সমান ক্ষেত্রফল অতিক্রম করে ($\\frac{dA}{dt} = \\frac{L}{2m} = \\text{ধ্রুবক}$)।',
            'explanation': 'ক্ষেত্রফলের সূত্র: গ্রহ ও সূর্যের সংযোগকারী সরলরেখা সমান সময়ে সমান ক্ষেত্রফল অতিক্রম করে।\nক্ষুদ্র সময়ে অতিক্রান্ত ক্ষেত্রফল: $dA = \\frac{1}{2} r (r d\\theta) = \\frac{1}{2} r^2 d\\theta$\nক্ষেত্রীয় বেগ: $\\frac{dA}{dt} = \\frac{1}{2} r^2 \\frac{d\\theta}{dt} = \\frac{1}{2} r^2 \\omega = \\frac{m r^2 \\omega}{2m} = \\frac{L}{2m}$\nযেহেতু সূর্যের মহাকর্ষ বল কেন্দ্রীয় বল (ব্যাসার্ধ বরাবর ক্রিয়াশীল), তাই টর্ক $\\tau = 0$। ফলে কৌণিক ভরবেগ $L = \\text{ধ্রুবক}$। অতএব ক্ষেত্রীয় বেগ $\\frac{dA}{dt}$ ধ্রুবক থাকে।',
            'primaryImage': None
        },
        39: {
            'topic': 'জ্যোতির্বৈজ্ঞানিক দূরত্বের একক ও পারসেকের সংজ্ঞা',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': 'জ্যোতির্বিদ্যায় দূরত্বের একক হিসেবে পারসেক (Parsec)-এর সংজ্ঞা দাও এবং প্রমাণ কর যে $1\\text{ pc} \\approx 3.26\\text{ ly}$।',
            'modelAnswer': '$1\\text{ pc} = 3.08 \\times 10^{16}\\text{ m} \\approx 3.26\\text{ ly}$',
            'explanation': 'সংজ্ঞা: যে দূরত্ব থেকে পৃথিবী-সূর্য গড় দূরত্বের ($1\\text{ AU} = 1.496 \\times 10^{11}\\text{ m}$) ব্যাসার্ধ $1$ আর্ক-সেকেন্ড ($1\'\' = \\frac{1}{3600}^\\circ$) কোণ তৈরি করে, তাকে ১ পারসেক (Parsec) বলে।\n$d = \\frac{r}{\\theta} = \\frac{1.496 \\times 10^{11}\\text{ m}}{\\frac{1}{3600} \\times \\frac{\\pi}{180}\\text{ rad}} \\approx 3.0857 \\times 10^{16}\\text{ m}$\n১ আলোকবর্ষ ($1\\text{ ly}$) $= 3 \\times 10^8 \\times 365.25 \\times 86400 \\approx 9.46 \\times 10^{15}\\text{ m}$\n$\\therefore 1\\text{ pc} = \\frac{3.0857 \\times 10^{16}}{9.46 \\times 10^{15}}\\text{ ly} \\approx 3.26\\text{ ly}$।',
            'primaryImage': None
        }
    }
}

def apply_replacements():
    total_updated = 0
    for filename, row_dict in REPLACEMENTS.items():
        filepath = os.path.join(BASE_DIR, filename)
        if not os.path.exists(filepath):
            print(f"Skipping {filename} (not found)")
            continue

        wb = openpyxl.load_workbook(filepath)
        ws = wb['Template'] if 'Template' in wb.sheetnames else wb.active

        for row_num, data in row_dict.items():
            ws.cell(row=row_num, column=4, value=data['topic'])
            ws.cell(row=row_num, column=5, value=data['difficulty'])
            ws.cell(row=row_num, column=6, value=data['marks'])
            ws.cell(row=row_num, column=7, value=data['questionText'])
            ws.cell(row=row_num, column=8, value=data.get('primaryImage') or '')
            ws.cell(row=row_num, column=9, value=data['explanation'])
            ws.cell(row=row_num, column=10, value=data['modelAnswer'])
            total_updated += 1

        wb.save(filepath)
        print(f"[UPDATED] {filename}: {len(row_dict)} questions replaced with core HSC curriculum questions.")

    print(f"\nSuccessfully replaced {total_updated} beyond-syllabus questions with pure HSC syllabus questions!")

if __name__ == '__main__':
    apply_replacements()
