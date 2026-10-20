#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 1st Paper:
- Chapter 04: Newtonian Mechanics
- Chapter 05: Work, Energy and Power
"""

import math

def get_chapter_04_numericals():
    """Newtonian Mechanics - 50 Numerical Problems"""
    items = []
    
    # 1-15: Momentum, Impulse, Gun Recoil
    for i, (m_bullet, v_bullet, m_gun) in enumerate([
        (0.02, 400, 4.0), (0.015, 500, 3.5), (0.025, 360, 5.0), (0.01, 600, 3.0), (0.03, 350, 6.0),
        (0.012, 450, 3.2), (0.018, 480, 4.5), (0.022, 420, 4.8), (0.016, 520, 3.8), (0.028, 380, 5.5),
        (0.014, 460, 3.4), (0.024, 410, 5.2), (0.019, 470, 4.2), (0.011, 580, 3.1), (0.021, 430, 4.6)
    ], 1):
        v_recoil = round((m_bullet * v_bullet) / m_gun, 3)
        impulse = round(m_bullet * v_bullet, 2)
        items.append({
            'topic': 'ভরবেগের সংরক্ষণশীলতা ও বন্দুকের পশ্চাৎবেগ',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"${m_gun}\\text{{ kg}}$ ভরের একটি বন্দুক থেকে ${round(m_bullet*1000, 1)}\\text{{ g}}$ ভরের একটি গুলি ${v_bullet}\\text{{ m/s}}$ বেগে ছোঁড়া হলো। বন্দুকটির পশ্চাৎবেগ ($V$) এবং গুলির ঘাত ($J$) কত?",
            'modelAnswer': f"$V = {v_recoil}\\text{{ m/s}}$, $J = {impulse}\\text{{ N}}\\cdot\\text{{s}}$",
            'explanation': f"ভরবেগের সংরক্ষণ সূত্র: $m v + M V = 0 \\implies |V| = \\frac{{m v}}{{M}} = \\frac{{{m_bullet} \\times {v_bullet}}}{{{m_gun}}} = {v_recoil}\\text{{ m/s}}$\nবলের ঘাত $J = \\Delta p = m v = {m_bullet} \\times {v_bullet} = {impulse}\\text{{ N}}\\cdot\\text{{s}}$",
            'primaryImage': None
        })

    # 16-25: Atwood Machine & Pulley
    for i, (m1, m2) in enumerate([
        (6.0, 4.0), (5.0, 3.0), (7.0, 3.0), (8.0, 2.0), (5.5, 4.5),
        (9.0, 5.0), (6.5, 3.5), (4.5, 2.5), (10.0, 6.0), (7.5, 4.5)
    ], 16):
        g = 9.8
        a = round(((m1 - m2) / (m1 + m2)) * g, 2)
        t_tension = round(((2 * m1 * m2) / (m1 + m2)) * g, 2)
        items.append({
            'topic': 'অ্যাটউড মেশিন ও কপিকলের গতি',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি ঘর্ষণহীন কপিকলের উভয় পাশে দুটি ভর $m_1 = {m1}\\text{{ kg}}$ এবং $m_2 = {m2}\\text{{ kg}}$ ঝুলিয়ে দেওয়া হলো ($g = 9.8\\text{{ m/s}}^2$)। সংস্থাটির সাধারণ ত্বরণ ($a$) এবং সুতার টান ($T$) নির্ণয় কর।",
            'modelAnswer': f"$a = {a}\\text{{ m/s}}^2$, $T = {t_tension}\\text{{ N}}$",
            'explanation': f"১. ত্বরণ $a = \\frac{{m_1 - m_2}}{{m_1 + m_2}}g = \\frac{{{m1} - {m2}}}{{{m1} + {m2}}} \\times 9.8 = {a}\\text{{ m/s}}^2$\n২. টান $T = \\frac{{2m_1 m_2}}{{m_1 + m_2}}g = \\frac{{2 \\times {m1} \\times {m2}}}{{{m1} + {m2}}} \\times 9.8 = {t_tension}\\text{{ N}}$",
            'primaryImage': '##PRESET:atwood(5,3)[size:medium]##' if i in [16, 20] else None
        })

    # 26-35: Banking of Roads
    for i, (r, v_kmh) in enumerate([
        (100, 72), (80, 54), (120, 90), (60, 48), (150, 108),
        (90, 60), (70, 50), (110, 80), (130, 95), (85, 65)
    ], 26):
        g = 9.8
        v = v_kmh / 3.6
        tan_th = v**2 / (r * g)
        theta = round(math.degrees(math.atan(tan_th)), 2)
        items.append({
            'topic': 'রাস্তার ব্যাংকিং ও নিরাপদ গতিসীমা',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${r}\\text{{ m}}$ ব্যাসার্ধের একটি বাঁকে যানবাহন ${v_kmh}\\text{{ km/h}}$ সর্বোচ্চ দ্রুতিতে নিরাপদে চলার উপযোগী করতে রাস্তার ব্যাংকিং কোণ কত রাখতে হবে? ($g = 9.8\\text{{ m/s}}^2$)",
            'modelAnswer': f"$\\theta = {theta}^\\circ$",
            'explanation': f"বেগ $v = {v_kmh}\\text{{ km/h}} = \\frac{{{v_kmh}}}{{3.6}} = {round(v, 2)}\\text{{ m/s}}$\nব্যাংকিং সূত্র: $\\tan\\theta = \\frac{{v^2}}{{rg}} = \\frac{{{round(v, 2)}^2}}{{{r} \\times 9.8}} = {round(tan_th, 4)}$\n$\\therefore \\theta = \\tan^{{-1}}({round(tan_th, 4)}) = {theta}^\\circ$",
            'primaryImage': None
        })

    # 36-50: Moment of Inertia & Rotational Motion
    for i, (m, r_len, body_type, formula_latex, factor) in enumerate([
        (4.0, 0.5, "একটি নিরেট সিলিন্ডারের", "\\frac{1}{2}MR^2", 0.5),
        (5.0, 0.4, "একটি নিরেট গোলকের", "\\frac{2}{5}MR^2", 0.4),
        (3.0, 1.2, "একটি সুষম সরু দণ্ডের (মধ্যবিন্দু দিয়ে)", "\\frac{1}{12}ML^2", 1/12),
        (2.5, 0.8, "একটি পাতলা বৃত্তাকার রিং-এর", "MR^2", 1.0),
        (6.0, 0.6, "একটি নিরেট গোলকের", "\\frac{2}{5}MR^2", 0.4),
        (3.5, 0.5, "একটি নিরেট চাকতির", "\\frac{1}{2}MR^2", 0.5),
        (4.5, 1.0, "একটি সুষম দণ্ডের (এক প্রান্ত দিয়ে)", "\\frac{1}{3}ML^2", 1/3),
        (2.0, 0.3, "একটি ফাঁপা গোলকের", "\\frac{2}{3}MR^2", 2/3),
        (5.5, 0.45, "একটি নিরেট সিলিন্ডারের", "\\frac{1}{2}MR^2", 0.5),
        (8.0, 0.5, "একটি নিরেট গোলকের", "\\frac{2}{5}MR^2", 0.4),
        (2.8, 0.7, "একটি বৃত্তাকার রিং-এর", "MR^2", 1.0),
        (3.2, 0.6, "একটি নিরেট চাকতির", "\\frac{1}{2}MR^2", 0.5),
        (4.2, 1.5, "একটি সুষম দণ্ডের (মধ্যবিন্দু দিয়ে)", "\\frac{1}{12}ML^2", 1/12),
        (6.5, 0.35, "একটি নিরেট গোলকের", "\\frac{2}{5}MR^2", 0.4),
        (5.0, 0.8, "একটি নিরেট সিলিন্ডারের", "\\frac{1}{2}MR^2", 0.5)
    ], 36):
        i_val = round(factor * m * r_len**2, 4)
        items.append({
            'topic': 'জড়তার ভ্রামক ও ঘূর্ণন গতিশক্তি',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"${m}\\text{{ kg}}$ ভর এবং ${r_len}\\text{{ m}}$ ব্যাসার্ধ/দৈর্ঘ্যবিশিষ্ট {body_type} নিজ অক্ষের সাপেক্ষে জড়তার ভ্রামক কত?",
            'modelAnswer': f"${i_val}\\text{{ kg}}\\cdot\\text{{m}}^2$",
            'explanation': f"জড়তার ভ্রামকের সূত্র: $I = {formula_latex}$\nমান বসিয়ে: $I = {factor:.4f} \\times {m} \\times {r_len}^2 = {i_val}\\text{{ kg}}\\cdot\\text{{m}}^2$",
            'primaryImage': None
        })

    return items

def get_chapter_05_numericals():
    """Work, Energy and Power - 50 Numerical Problems"""
    items = []
    
    # 1-15: Work by Force & Angles
    for i, (f, s, theta) in enumerate([
        (50, 10, 0), (80, 15, 60), (120, 20, 30), (60, 25, 45), (100, 12, 60),
        (75, 8, 30), (90, 14, 0), (110, 18, 45), (45, 30, 60), (150, 10, 30),
        (65, 16, 0), (85, 22, 60), (130, 15, 45), (95, 12, 30), (140, 8, 0)
    ], 1):
        rad = math.radians(theta)
        w = round(f * s * math.cos(rad), 2)
        items.append({
            'topic': 'কাজের হিসাব ও কোণভিত্তিক কৃতকাজ',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি বস্তুর ওপর ${f}\\text{{ N}}$ বল প্রয়োগ করায় এটি বলের দিকের সাথে ${theta}^\\circ$ কোণে ${s}\\text{{ m}}$ স্থানান্তরিত হলো। কৃতকাজের মান কত নির্ণয় কর।",
            'modelAnswer': f"${w}\\text{{ J}}$",
            'explanation': f"কৃতকাজের সূত্র: $W = F s \\cos\\theta = ({f})({s})\\cos({theta}^\\circ) = {w}\\text{{ J}}$",
            'primaryImage': None
        })

    # 16-30: Spring Force & Potential Energy
    for i, (k, x_cm) in enumerate([
        (200, 5), (400, 10), (150, 8), (500, 4), (300, 6),
        (250, 12), (600, 5), (350, 10), (180, 15), (450, 8),
        (550, 6), (220, 14), (320, 10), (480, 5), (280, 12)
    ], 16):
        x = x_cm / 100.0
        u = round(0.5 * k * x**2, 3)
        f_max = round(k * x, 2)
        items.append({
            'topic': 'স্প্রিং বল ও স্থিতিশক্তি',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"স্প্রিং ধ্রুবক $k = {k}\\text{{ N/m}}$ বিশিষ্ট একটি স্প্রিংকে সংকুচিত করে এর দৈর্ঘ্য ${x_cm}\\text{{ cm}}$ পরিবর্তন করা হলে এতে সঞ্চিত স্থিতিশক্তি ($U$) এবং প্রত্যয়নী বলের মান কত?",
            'modelAnswer': f"$U = {u}\\text{{ J}}$, $F = {f_max}\\text{{ N}}$",
            'explanation': f"১. সঞ্চিত স্থিতিশক্তি: $U = \\frac{{1}}{{2}}kx^2 = 0.5 \\times {k} \\times ({x})^2 = {u}\\text{{ J}}$\n২. প্রত্যয়নী বল: $F = kx = {k} \\times {x} = {f_max}\\text{{ N}}$",
            'primaryImage': '##PRESET:spring(100)[size:medium]##' if i in [16, 20] else None
        })

    # 31-50: Electric Pumps, Power & Efficiency
    for i, (volume_lit, h, t_min, p_in_hp) in enumerate([
        (1000, 15, 5, 1.0),
        (1500, 20, 8, 1.5),
        (2000, 25, 10, 2.0),
        (800, 12, 4, 0.75),
        (1200, 18, 6, 1.25),
        (2500, 30, 12, 2.5),
        (1800, 22, 9, 1.75),
        (3000, 20, 15, 2.0),
        (1600, 16, 7, 1.5),
        (2200, 28, 11, 2.25),
        (1400, 24, 8, 1.5),
        (1100, 15, 5, 1.2),
        (1900, 18, 9, 1.75),
        (2600, 25, 14, 2.2),
        (1700, 20, 8, 1.6),
        (2100, 22, 10, 2.0),
        (1300, 14, 6, 1.2),
        (2400, 26, 12, 2.3),
        (1500, 18, 7, 1.5),
        (2800, 30, 15, 2.5)
    ], 31):
        g = 9.8
        mass = volume_lit # 1 L water = 1 kg
        t_sec = t_min * 60
        w_work = round(mass * g * h, 2)
        p_out = round(w_work / t_sec, 2)
        p_in_watt = round(p_in_hp * 746, 2)
        eta = round((p_out / p_in_watt) * 100, 2)
        items.append({
            'topic': 'পাম্পের ক্ষমতা ও কর্মদক্ষতা',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"একটি ${p_in_hp}\\text{{ HP}}$-এর পাম্প ${h}\\text{{ m}}$ গভীর কূপ থেকে ${t_min}\\text{{ মিনিটে}}$ ${volume_lit}\\text{{ লিটার}}$ পানি তুলতে পারে। পাম্পটির কার্যকর ক্ষমতা ও কর্মদক্ষতা ($\\eta$) কত? ($1\\text{{ HP}} = 746\\text{{ W}}, g = 9.8\\text{{ m/s}}^2$)",
            'modelAnswer': f"$P_{{out}} = {p_out}\\text{{ W}}$, $\\eta = {eta}\\%$",
            'explanation': f"কাজের পরিমাণ $W = mgh = {mass} \\times 9.8 \\times {h} = {w_work}\\text{{ J}}$\nকার্যকর ক্ষমতা $P_{{out}} = \\frac{{W}}{{t}} = \\frac{{{w_work}}}{{{t_sec}}} = {p_out}\\text{{ W}}$\nপ্রদত্ত ক্ষমতা $P_{{in}} = {p_in_hp} \\times 746 = {p_in_watt}\\text{{ W}}$\nকর্মদক্ষতা $\\eta = \\frac{{P_{{out}}}}{{P_{{in}}}} \\times 100\\% = \\frac{{{p_out}}}{{{p_in_watt}}} \\times 100\\% = {eta}\\%$",
            'primaryImage': None
        })

    return items
