#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 2nd Paper:
- Chapter 01: Thermodynamics
- Chapter 02: Static Electricity
- Chapter 03: Current Electricity
"""

import math

def get_chapter_01_2nd_numericals():
    """Thermodynamics - 50 Numerical Problems"""
    items = []
    
    # 1-20: Carnot Engine Efficiency & Temperatures
    for i, (t1_c, t2_c, q1_j) in enumerate([
        (227, 27, 2000), (327, 27, 3000), (400, 100, 5000), (250, 50, 1500), (180, 20, 1200),
        (350, 30, 4000), (280, 40, 2500), (450, 150, 6000), (300, 60, 3500), (200, 25, 1800),
        (500, 200, 8000), (270, 35, 2200), (380, 80, 4500), (230, 15, 1600), (330, 45, 3200),
        (420, 120, 5500), (260, 30, 2100), (360, 70, 4200), (240, 20, 1700), (340, 50, 3600)
    ], 1):
        t1_k = t1_c + 273.15
        t2_k = t2_c + 273.15
        eta = round((1 - (t2_k / t1_k)) * 100, 2)
        work = round((eta / 100.0) * q1_j, 2)
        q2_j = round(q1_j - work, 2)
        items.append({
            'topic': 'কার্নো চক্রের দক্ষতা ও তাপ ইঞ্জিনের কৃতকাজ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি কার্নো ইঞ্জিন ${t1_c}^\\circ\\text{{C}}$ এবং ${t2_c}^\\circ\\text{{C}}$ তাপমাত্রার দুটি তাপাধারের মধ্যে কাজ করে। ইঞ্জিনটি উচ্চ তাপমাত্রার উৎস হতে প্রতি চক্রে ${q1_j}\\text{{ J}}$ তাপ গ্রহণ করলে এর দক্ষতা ($\\eta$), কৃতকাজ ($W$) এবং গ্রাহকে বর্জিত তাপ ($Q_2$) কত?",
            'modelAnswer': f"$\\eta = {eta}\\%$, $W = {work}\\text{{ J}}$, $Q_2 = {q2_j}\\text{{ J}}$",
            'explanation': f"$T_1 = {t1_c} + 273.15 = {t1_k}\\text{{ K}}$, $T_2 = {t2_c} + 273.15 = {t2_k}\\text{{ K}}$\n১. দক্ষতা $\\eta = \\left(1 - \\frac{{T_2}}{{T_1}}\\right) \\times 100\\% = {eta}\\%$\n২. কৃতকাজ $W = \\eta \\times Q_1 = {work}\\text{{ J}}$\n৩. বর্জিত তাপ $Q_2 = Q_1 - W = {q1_j} - {work} = {q2_j}\\text{{ J}}$",
            'primaryImage': '##PRESET:carnot-cycle[size:medium]##' if i in [1, 10] else None
        })

    # 21-35: Refrigerator & COP
    for i, (t1_c, t2_c, w_j) in enumerate([
        (27, -3, 500), (30, -5, 600), (25, -10, 400), (32, 0, 700), (28, -8, 550),
        (35, -2, 800), (26, -6, 450), (29, -4, 520), (31, -7, 650), (24, -12, 380),
        (33, -5, 720), (27, -8, 480), (30, -10, 580), (34, -3, 760), (25, -15, 420)
    ], 21):
        t1_k = t1_c + 273.15
        t2_k = t2_c + 273.15
        cop = round(t2_k / (t1_k - t2_k), 2)
        q2_abs = round(cop * w_j, 2)
        items.append({
            'topic': 'রেফ্রিজারেটরের কর্মক্ষমতা গুণাঙ্ক (COP)',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি রেফ্রিজারেটর ${t2_c}^\\circ\\text{{C}}$ তাপমাত্রার বরফ প্রকোষ্ঠ হতে তাপ গ্রহণ করে ${t1_c}^\\circ\\text{{C}}$ তাপমাত্রার পরিবেশে বর্জন করে। রেফ্রিজারেটরটির কর্মক্ষমতা গুণাঙ্ক ($K$ বা COP) কত এবং ${w_j}\\text{{ J}}$ বৈদ্যুতিক কাজ সম্পাদন করলে এটি প্রকোষ্ঠ হতে কত তাপ অপসারণ করবে?",
            'modelAnswer': f"$K = {cop}$, $Q_2 = {q2_abs}\\text{{ J}}$",
            'explanation': f"$T_1 = {t1_k}\\text{{ K}}$, $T_2 = {t2_k}\\text{{ K}}$\n১. কর্মক্ষমতা গুণাঙ্ক $K = \\frac{{T_2}}{{T_1 - T_2}} = \\frac{{{t2_k}}}{{{t1_k} - {t2_k}}} = {cop}$\n২. অপসারিত তাপ $Q_2 = K \\times W = {cop} \\times {w_j} = {q2_abs}\\text{{ J}}$",
            'primaryImage': '##PRESET:refrigerator[size:medium]##' if i in [21, 25] else None
        })

    # 36-50: Entropy Changes
    for i, (m_ice_g, t_init_c) in enumerate([
        (50, 0), (100, 0), (20, 0), (80, 0), (150, 0),
        (40, 0), (60, 0), (120, 0), (200, 0), (30, 0),
        (75, 0), (90, 0), (110, 0), (130, 0), (180, 0)
    ], 36):
        lf = 3.36e5 # J/kg
        m_kg = m_ice_g / 1000.0
        q_melt = m_kg * lf
        t_melt_k = 273.15
        delta_s = round(q_melt / t_melt_k, 2)
        items.append({
            'topic': 'এনট্রপির পরিবর্তন ও বিশৃঙ্খলা',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"$0^\\circ\\text{{C}}$ তাপমাত্রার ${m_ice_g}\\text{{ g}}$ বরফকে গলিয়ে $0^\\circ\\text{{C}}$ তাপমাত্রার পানিতে পরিণত করতে এনট্রপির পরিবর্তন কত হবে? (বরফ গলনের আপেক্ষিক সুপ্ততাপ $L_f = 3.36 \\times 10^5\\text{{ J/kg}}$)",
            'modelAnswer': f"$\\Delta S = {delta_s}\\text{{ J/K}}$",
            'explanation': f"প্রয়োজনীয় তাপ $Q = m L_f = {m_kg} \\times (3.36 \\times 10^5) = {q_melt}\\text{{ J}}$\nপরম তাপমাত্রা $T = 273.15\\text{{ K}}$\nএনট্রপির পরিবর্তন $\\Delta S = \\frac{{Q}}{{T}} = \\frac{{{q_melt}}}{{273.15}} = {delta_s}\\text{{ J/K}}$",
            'primaryImage': None
        })

    return items

def get_chapter_02_2nd_numericals():
    """Static Electricity - 50 Numerical Problems"""
    items = []
    k_coulomb = 9.0e9 # N m^2 / C^2

    # 1-15: Coulomb Force & Neutral Points
    for i, (q1_u, q2_u, r_cm) in enumerate([
        (4.0, 9.0, 30), (2.0, 8.0, 20), (5.0, 5.0, 25), (6.0, 12.0, 40), (3.0, 12.0, 30),
        (10.0, 10.0, 50), (1.5, 6.0, 15), (8.0, 18.0, 60), (4.5, 4.5, 30), (2.5, 10.0, 25),
        (5.0, 20.0, 45), (3.5, 14.0, 35), (7.0, 7.0, 35), (1.0, 4.0, 12), (6.0, 24.0, 50)
    ], 1):
        q1 = q1_u * 1e-6
        q2 = q2_u * 1e-6
        r = r_cm / 100.0
        f_val = round((k_coulomb * q1 * q2) / (r**2), 3)
        # Neutral point from q1: x = r / (sqrt(q2/q1) + 1)
        x_neutral = round(r_cm / (math.sqrt(q2_u / q1_u) + 1), 2)
        items.append({
            'topic': 'কুলম্বের সূত্র ও তড়িৎ নিরপেক্ষ বিন্দু',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"বায়ু মাধ্যমে পরস্পর হতে ${r_cm}\\text{{ cm}}$ দূরত্বে অবস্থিত $+{q1_u}\\ \\mu\\text{{C}}$ এবং $+{q2_u}\\ \\mu\\text{{C}}$ মানের দুটি বিন্দু আধানের মধ্যকার বিকর্ষণ বল ($F$) এবং সংযোগকারী রেখায় ১ম আধান হতে নিরপেক্ষ বিন্দুর দূরত্ব কত?",
            'modelAnswer': f"$F = {f_val}\\text{{ N}}$, নিরপেক্ষ দূরত্ব = ${x_neutral}\\text{{ cm}}$",
            'explanation': f"১. বল: $F = \\frac{{1}}{{4\\pi\\varepsilon_0}}\\frac{{q_1 q_2}}{{r^2}} = 9\\times 10^9 \\times \\frac{{({q1})({q2})}}{{{r}^2}} = {f_val}\\text{{ N}}$\n২. নিরপেক্ষ বিন্দুতে প্রাবল্য সমান: $\\frac{{q_1}}{{x^2}} = \\frac{{q_2}}{{(r-x)^2}} \\implies x = \\frac{{{r_cm}}}{{1 + \\sqrt{{{q2_u}/{q1_u}}}}} = {x_neutral}\\text{{ cm}}$",
            'primaryImage': '##PRESET:coulombs-law[size:medium]##' if i in [1, 5] else None
        })

    # 16-30: Electric Potential & Work Done
    for i, (q_u, r_cm) in enumerate([
        (5.0, 10), (8.0, 20), (12.0, 30), (4.0, 15), (6.0, 25),
        (10.0, 40), (15.0, 50), (3.0, 12), (7.0, 28), (9.0, 36),
        (2.0, 8), (14.0, 45), (11.0, 35), (16.0, 60), (5.5, 22)
    ], 16):
        q = q_u * 1e-6
        r = r_cm / 100.0
        v_pot = round((k_coulomb * q) / r, 1)
        w_move = round(2e-6 * v_pot, 4) # work to bring 2 uC from infinity
        items.append({
            'topic': 'তড়িৎ বিভব ও আধান স্থানান্তর কৃতকাজ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"$+{q_u}\\ \\mu\\text{{C}}$ মানের একটি বিন্দু আধান হতে ${r_cm}\\text{{ cm}}$ দূরবর্তী বিন্দুতে তড়িৎ বিভব ($V$) কত এবং অসীম হতে $+2\\ \\mu\\text{{C}}$ আধান উক্ত বিন্দুতে আনতে কৃতকাজ কত?",
            'modelAnswer': f"$V = {v_pot}\\text{{ V}}, W = {w_move}\\text{{ J}}$",
            'explanation': f"তড়িৎ বিভব: $V = \\frac{{1}}{{4\\pi\\varepsilon_0}}\\frac{{q}}{{r}} = \\frac{{9\\times 10^9 \\times {q}}}{{{r}}} = {v_pot}\\text{{ V}}$\nকৃতকাজ: $W = q_0 V = (2\\times 10^{{-6}}) \\times {v_pot} = {w_move}\\text{{ J}}$",
            'primaryImage': None
        })

    # 31-50: Capacitors & Combinations
    for i, (c1_u, c2_u, v_batt) in enumerate([
        (4.0, 6.0, 12), (3.0, 6.0, 24), (2.0, 8.0, 10), (5.0, 20.0, 50), (10.0, 10.0, 100),
        (6.0, 12.0, 36), (4.0, 12.0, 48), (8.0, 24.0, 60), (5.0, 15.0, 40), (6.0, 6.0, 20),
        (9.0, 18.0, 30), (12.0, 24.0, 72), (15.0, 30.0, 90), (4.5, 9.0, 18), (8.0, 8.0, 50),
        (10.0, 40.0, 100), (3.5, 7.0, 21), (6.5, 13.0, 26), (7.5, 15.0, 45), (16.0, 16.0, 80)
    ], 31):
        cs = round((c1_u * c2_u) / (c1_u + c2_u), 2)
        cp = round(c1_u + c2_u, 2)
        u_ser = round(0.5 * (cs * 1e-6) * v_batt**2, 5)
        u_par = round(0.5 * (cp * 1e-6) * v_batt**2, 5)
        items.append({
            'topic': 'ধারকত্ব, সমবায় ও সঞ্চিত শক্তি',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"${c1_u}\\ \\mu\\text{{F}}$ এবং ${c2_u}\\ \\mu\\text{{F}}$ মানের দুটি ধারককে শ্রেণি ও সমান্তরালে ${v_batt}\\text{{ V}}$ উৎসে যুক্ত করলে যথাক্রমে তুল্য ধারকত্ব ($C_s$ ও $C_p$) এবং মোট সঞ্চিত শক্তি কত হবে?",
            'modelAnswer': f"$C_s = {cs}\\ \\mu\\text{{F}} (U = {u_ser}\\text{{ J}})$, $C_p = {cp}\\ \\mu\\text{{F}} (U = {u_par}\\text{{ J}})$",
            'explanation': f"১. শ্রেণি সমবায়: $C_s = \\frac{{C_1 C_2}}{{C_1 + C_2}} = \\frac{{{c1_u} \\times {c2_u}}}{{{c1_u} + {c2_u}}} = {cs}\\ \\mu\\text{{F}}$\nশক্তি $U_s = \\frac{{1}}{{2}}C_s V^2 = 0.5 \\times ({cs}\\times 10^{{-6}}) \\times {v_batt}^2 = {u_ser}\\text{{ J}}$\n২. সমান্তরাল সমবায়: $C_p = C_1 + C_2 = {cp}\\ \\mu\\text{{F}}$\nশক্তি $U_p = \\frac{{1}}{{2}}C_p V^2 = 0.5 \\times ({cp}\\times 10^{{-6}}) \\times {v_batt}^2 = {u_par}\\text{{ J}}$",
            'primaryImage': '##PRESET:capacitor[size:medium]##' if i in [31, 40] else None
        })

    return items

def get_chapter_03_2nd_numericals():
    """Current Electricity - 50 Numerical Problems"""
    items = []
    
    # 1-15: Ohm's Law, Resistors & Internal Resistance
    for i, (emf, r_ext, r_int) in enumerate([
        (12.0, 5.5, 0.5), (6.0, 2.8, 0.2), (9.0, 4.2, 0.3), (24.0, 11.5, 0.5), (10.0, 4.5, 0.5),
        (15.0, 7.2, 0.3), (18.0, 8.5, 0.5), (12.0, 3.8, 0.2), (8.0, 3.6, 0.4), (20.0, 9.5, 0.5),
        (5.0, 2.3, 0.2), (16.0, 7.5, 0.5), (22.0, 10.6, 0.4), (14.0, 6.7, 0.3), (25.0, 12.0, 0.5)
    ], 1):
        tot_r = r_ext + r_int
        i_curr = round(emf / tot_r, 3)
        v_term = round(i_curr * r_ext, 2)
        v_lost = round(i_curr * r_int, 2)
        items.append({
            'topic': 'বর্তনীতে তড়িৎ প্রবাহ, প্রান্তীয় বিভব ও হারানো ভোল্ট',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"তড়িৎচালক বল $E = {emf}\\text{{ V}}$ এবং অভ্যন্তরীণ রোধ $r = {r_int}\\ \\Omega$ বিশিষ্ট একটি কোষের সাথে $R = {r_ext}\\ \\Omega$ রোধ যুক্ত করা হলো। বর্তনীর মূল প্রবাহ ($I$), প্রান্তীয় বিভব ($V$) এবং নষ্ট ভোল্ট কত?",
            'modelAnswer': f"$I = {i_curr}\\text{{ A}}, V = {v_term}\\text{{ V}}$, নষ্ট ভোল্ট = ${v_lost}\\text{{ V}}$",
            'explanation': f"১. মূল প্রবাহ: $I = \\frac{{E}}{{R + r}} = \\frac{{{emf}}}{{{r_ext} + {r_int}}} = {i_curr}\\text{{ A}}$\n২. প্রান্তীয় বিভব: $V = IR = {i_curr} \\times {r_ext} = {v_term}\\text{{ V}}$\n৩. নষ্ট ভোল্ট: $v = Ir = {i_curr} \\times {r_int} = {v_lost}\\text{{ V}}$",
            'primaryImage': '##PRESET:circuit-series[size:medium]##' if i in [1, 8] else None
        })

    # 16-30: Wheatstone Bridge
    for i, (p, q, r, s_wrong) in enumerate([
        (10, 20, 30, 80), (5, 15, 20, 50), (8, 24, 16, 60), (12, 18, 24, 40), (6, 18, 15, 60),
        (15, 30, 25, 70), (10, 40, 20, 100), (4, 12, 16, 70), (9, 27, 18, 90), (14, 28, 21, 50),
        (16, 32, 24, 80), (8, 32, 12, 60), (20, 40, 30, 75), (7, 21, 14, 55), (18, 36, 27, 70)
    ], 16):
        # Balanced S = (Q * R) / P
        s_correct = (q * r) / p
        # To balance with s_wrong:
        if s_wrong > s_correct:
            # Connect in parallel: 1/s_req = 1/s_correct - 1/s_wrong
            s_par = round((s_wrong * s_correct) / (s_wrong - s_correct), 2)
            method = f"সমান্তরালে ${s_par}\\ \\Omega$ রোধ"
        else:
            s_ser = round(s_correct - s_wrong, 2)
            method = f"শ্রেণিতে ${s_ser}\\ \\Omega$ রোধ"
        items.append({
            'topic': 'হুইটস্টোন ব্রিজের ভারসাম্য শর্ত ও রোধ সমন্বয়',
            'difficulty': 'MEDIUM' if i <= 23 else 'HARD',
            'marks': 3,
            'questionText': f"একটি হুইটস্টোন ব্রিজের চার বাহুর রোধ যথাক্রমে $P = {p}\\ \\Omega, Q = {q}\\ \\Omega, R = {r}\\ \\Omega$ এবং $S = {s_wrong}\\ \\Omega$। চতুর্থ বাহুতে কত মানের রোধ কীভাবে যুক্ত করলে ব্রিজটি সাম্যাবস্থায় আসবে?",
            'modelAnswer': f"চতুর্থ বাহুতে {method} যুক্ত করতে হবে।",
            'explanation': f"সাম্যাবস্থায় প্রয়োজনীয় চতুর্থ রোধ: $S_{{req}} = \\frac{{Q R}}{{P}} = \\frac{{{q} \\times {r}}}{{{p}}} = {s_correct}\\ \\Omega$\nযেহেতু বর্তমান রোধ $S = {s_wrong}\\ \\Omega$, তাই কাঙ্ক্ষিত ভারসাম্য আনতে {method} যুক্ত করতে হবে।",
            'primaryImage': '##PRESET:circuit-wheatstone[size:medium]##' if i in [16, 20] else None
        })

    # 31-50: Shunts & Meters
    for i, (g_ohm, ig_ma, i_tot_a) in enumerate([
        (100, 10, 10), (50, 20, 5), (80, 5, 2), (120, 15, 15), (60, 25, 10),
        (90, 10, 5), (75, 12, 6), (150, 8, 4), (40, 20, 8), (110, 10, 12),
        (85, 15, 10), (95, 5, 5), (105, 12, 15), (70, 20, 7), (130, 10, 10),
        (65, 15, 6), (140, 8, 8), (55, 25, 12), (115, 10, 10), (125, 5, 5)
    ], 31):
        ig = ig_ma * 1e-3
        s_shunt = round((ig * g_ohm) / (i_tot_a - ig), 4)
        items.append({
            'topic': 'গ্যালভানোমিটারের শান্ট ও অ্যামিটার রূপান্তর',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"${g_ohm}\\ \\Omega$ রোধের একটি গ্যালভানোমিটারের মধ্য দিয়ে সর্বোচ্চ ${ig_ma}\\text{{ mA}}$ প্রবাহ নিরাপদভাবে যেতে পারে। একে ${i_tot_a}\\text{{ A}}$ পাল্লার অ্যামিটারে রূপান্তর করতে কত রোধের শান্ট সমান্তরালে যুক্ত করতে হবে?",
            'modelAnswer': f"$S = {s_shunt}\\ \\Omega$",
            'explanation': f"শান্টের সূত্র: $S = \\frac{{I_g G}}{{I - I_g}} = \\frac{{({ig}) \\times {g_ohm}}}{{{i_tot_a} - {ig}}} = {s_shunt}\\ \\Omega$\nঅতএব গ্যালভানোমিটারের সাথে সমান্তরালে ${s_shunt}\\ \\Omega$ মানের রোধ যুক্ত করতে হবে।",
            'primaryImage': None
        })

    return items
