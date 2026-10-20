#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 2nd Paper:
- Chapter 04: Magnetic Effects of Current and Magnetism
- Chapter 05: Electromagnetic Induction and Alternating Current
- Chapter 06: Geometrical Optics
"""

import math

def get_chapter_04_2nd_numericals():
    """Magnetic Effects of Current - 50 Numerical Problems"""
    items = []
    mu0 = 4 * math.pi * 1e-7

    # 1-15: Long Straight Wire & Biot-Savart
    for i, (i_amp, r_cm) in enumerate([
        (5.0, 10), (10.0, 20), (8.0, 15), (15.0, 30), (12.0, 25),
        (20.0, 40), (6.0, 12), (18.0, 36), (4.0, 8), (25.0, 50),
        (7.0, 14), (16.0, 32), (9.0, 18), (14.0, 28), (22.0, 44)
    ], 1):
        r = r_cm / 100.0
        b_val = round((mu0 * i_amp) / (2 * math.pi * r) * 1e6, 2) # in uT
        items.append({
            'topic': 'দীর্ঘ সোজা তারের জন্য চৌম্বক ক্ষেত্র',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি দীর্ঘ সোজা তারের মধ্য দিয়ে ${i_amp}\\text{{ A}}$ তড়িৎ প্রবাহিত হচ্ছে। তারটি হতে ${r_cm}\\text{{ cm}}$ দূরত্বে কোনো বিন্দুতে চৌম্বক ক্ষেত্রের মান ($B$) কত?",
            'modelAnswer': f"$B = {b_val}\\ \\mu\\text{{T}}$ (${round(b_val*1e-6, 8)}\\text{{ T}}$)",
            'explanation': f"চৌম্বক ক্ষেত্রের মান: $B = \\frac{{\\mu_0 I}}{{2\\pi r}} = \\frac{{4\\pi \\times 10^{{-7}} \\times {i_amp}}}{{2\\pi \\times {r}}} = {b_val}\\ \\mu\\text{{T}}$",
            'primaryImage': '##PRESET:ampere-law[size:medium]##' if i in [1, 5] else None
        })

    # 16-30: Magnetic Lorentz Force & Circular Orbit
    for i, (v_exp, b_t, q_type) in enumerate([
        (2.0e6, 0.5, "ইলেকট্রন"), (3.0e6, 0.4, "ইলেকট্রন"), (1.5e6, 0.8, "ইলেকট্রন"),
        (2.5e6, 0.6, "ইলেকট্রন"), (4.0e6, 0.5, "ইলেকট্রন"), (1.8e6, 0.7, "ইলেকট্রন"),
        (2.2e6, 0.45, "ইলেকট্রন"), (3.5e6, 0.55, "ইলেকট্রন"), (2.8e6, 0.65, "ইলেকট্রন"),
        (1.0e6, 1.0, "ইলেকট্রন"), (5.0e5, 0.2, "প্রোটন"), (8.0e5, 0.3, "প্রোটন"),
        (1.2e6, 0.4, "প্রোটন"), (6.0e5, 0.25, "প্রোটন"), (1.0e6, 0.5, "প্রোটন")
    ], 16):
        if q_type == "ইলেকট্রন":
            m = 9.11e-31
            q = 1.6e-19
        else:
            m = 1.67e-27
            q = 1.6e-19
        r_orb = round(((m * v_exp) / (q * b_t)) * 1000, 3) # in mm
        f_lor = round(q * v_exp * b_t * 1e14, 3) # in 10^-14 N
        items.append({
            'topic': 'চৌম্বক ক্ষেত্রে আধানের বৃত্তাকার গতি',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${b_t}\\text{{ T}}$ সুষম চৌম্বক ক্ষেত্রের সাথে লম্বভাবে ${v_exp/1e6:.1f} \\times 10^6\\text{{ m/s}}$ বেগে একটি {q_type} প্রবেশ করলে এর কক্ষপথের ব্যাসার্ধ ($r$) কত হবে?",
            'modelAnswer': f"$r = {r_orb}\\text{{ mm}}$",
            'explanation': f"কক্ষপথের ব্যাসার্ধ: $r = \\frac{{mv}}{{qB}} = \\frac{{{m} \\times {v_exp}}}{{{q} \\times {b_t}}}\\text{{ m}} = {r_orb}\\text{{ mm}}$\nলরেন্টজ বল $F = qvB = {f_lor} \\times 10^{{-14}}\\text{{ N}}$",
            'primaryImage': '##PRESET:circular-motion[size:medium]##' if i in [16, 20] else None
        })

    # 31-50: Parallel Wires & Force Between Currents
    for i, (i1, i2, d_cm, l_m) in enumerate([
        (10, 20, 5, 2.0), (15, 25, 8, 3.0), (12, 18, 6, 1.5), (20, 30, 10, 4.0), (8, 16, 4, 2.5),
        (25, 40, 12, 5.0), (14, 28, 7, 2.0), (18, 22, 9, 3.5), (16, 24, 8, 1.8), (30, 50, 15, 6.0),
        (10, 30, 6, 2.2), (12, 24, 5, 3.0), (15, 35, 10, 4.5), (22, 33, 11, 2.8), (18, 36, 9, 3.2),
        (14, 20, 7, 2.4), (25, 35, 12, 4.0), (16, 32, 8, 3.6), (20, 40, 10, 5.0), (12, 28, 6, 2.5)
    ], 31):
        d = d_cm / 100.0
        f_tot = round(((mu0 * i1 * i2 * l_m) / (2 * math.pi * d)) * 1e4, 3) # in 10^-4 N
        items.append({
            'topic': 'সমান্তরাল পরিবাহীর মধ্যকার চৌম্বক বল',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"পরস্পর হতে ${d_cm}\\text{{ cm}}$ দূরে সমান্তরালে স্থাপিত দুটি তারের মধ্য দিয়ে যথাক্রমে ${i1}\\text{{ A}}$ এবং ${i2}\\text{{ A}}$ প্রবাহ একই দিকে চলছে। তার দুটির ${l_m}\\text{{ m}}$ দৈর্ঘ্যের ওপর ক্রিয়াশীল মোট আকর্ষণ বল কত?",
            'modelAnswer': f"$F = {f_tot} \\times 10^{{-4}}\\text{{ N}}$",
            'explanation': f"সমান্তরাল তারের প্রতি মিটার দৈর্ঘ্যে বল: $\\frac{{F}}{{L}} = \\frac{{\\mu_0 I_1 I_2}}{{2\\pi d}}$\nমোট বল $F = \\frac{{\\mu_0 I_1 I_2 L}}{{2\\pi d}} = \\frac{{4\\pi\\times 10^{{-7}} \\times {i1} \\times {i2} \\times {l_m}}}{{2\\pi \\times {d}}} = {f_tot} \\times 10^{{-4}}\\text{{ N}}$ (আকর্ষণধর্মী)",
            'primaryImage': None
        })

    return items

def get_chapter_05_2nd_numericals():
    """Electromagnetic Induction and AC - 50 Numerical Problems"""
    items = []
    
    # 1-15: Faraday's Law & Motional EMF
    for i, (b_t, v_ms, l_m) in enumerate([
        (0.5, 10, 0.8), (0.8, 15, 1.2), (0.4, 20, 0.5), (1.0, 12, 1.5), (0.6, 25, 0.6),
        (0.75, 16, 1.0), (0.35, 18, 0.7), (0.9, 14, 1.4), (0.45, 22, 0.8), (1.2, 10, 1.2),
        (0.55, 30, 0.5), (0.65, 15, 1.1), (0.85, 20, 0.9), (0.3, 24, 0.6), (1.1, 18, 1.3)
    ], 1):
        emf = round(b_t * v_ms * l_m, 2)
        items.append({
            'topic': 'গতিশীল পরিবাহীতে আবিষ্ট তড়িৎচালক বল',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"${l_m}\\text{{ m}}$ দৈর্ঘ্যের একটি ধাতব দণ্ডকে ${b_t}\\text{{ T}}$ সুষম চৌম্বক ক্ষেত্রের সাথে লম্বভাবে রেখে ${v_ms}\\text{{ m/s}}$ সমবেগে টানা হচ্ছে। দণ্ডটির দুই প্রান্তে আবিষ্ট তড়িৎচালক বলের (EMF) মান কত?",
            'modelAnswer': f"$\\mathcal{{E}} = {emf}\\text{{ V}}$",
            'explanation': f"আবিষ্ট তড়িৎচালক বলের সূত্র: $\\mathcal{{E}} = B v l = ({b_t}) \\times ({v_ms}) \\times ({l_m}) = {emf}\\text{{ V}}$",
            'primaryImage': '##PRESET:faraday-law[size:medium]##' if i in [1, 5] else None
        })

    # 16-30: Transformer Calculations
    for i, (np, ns, vp, ip) in enumerate([
        (500, 50, 220, 2.0), (1000, 100, 220, 1.5), (800, 80, 240, 2.5), (1200, 120, 220, 3.0), (600, 60, 230, 1.8),
        (200, 2000, 110, 5.0), (150, 1500, 120, 4.0), (250, 2500, 115, 6.0), (300, 1500, 220, 5.0), (400, 2000, 230, 4.5),
        (750, 75, 220, 2.2), (900, 90, 240, 1.6), (350, 3500, 110, 7.0), (650, 65, 220, 2.4), (180, 1800, 115, 4.2)
    ], 16):
        vs = round((ns / np) * vp, 1)
        is_curr = round((np / ns) * ip, 2)
        power = round(vp * ip, 1)
        t_type = "অবরোহী (Step-down)" if ns < np else "আরোহী (Step-up)"
        items.append({
            'topic': 'ট্রান্সফরমারের ভোল্টেজ ও তড়িৎ প্রবাহ রূপান্তর',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি আদর্শ {t_type} ট্রান্সফরমারের মুখ্য কুণ্ডলীর পাকসংখ্যা $N_p = {np}$ এবং গৌণ কুণ্ডলীর পাকসংখ্যা $N_s = {ns}$। মুখ্য কুণ্ডলীতে ${vp}\\text{{ V}}$ ভোল্টেজ ও ${ip}\\text{{ A}}$ প্রবাহ দিলে গৌণ কুণ্ডলীর ভোল্টেজ ($V_s$) এবং প্রবাহ ($I_s$) কত হবে?",
            'modelAnswer': f"$V_s = {vs}\\text{{ V}}, I_s = {is_curr}\\text{{ A}}$",
            'explanation': f"ট্রান্সফরমার সমীকরণ: $\\frac{{V_s}}{{V_p}} = \\frac{{N_s}}{{N_p}} \\implies V_s = \\left(\\frac{{{ns}}}{{{np}}}\\right) \\times {vp} = {vs}\\text{{ V}}$\nপ্রবাহের রূপান্তর: $\\frac{{I_s}}{{I_p}} = \\frac{{N_p}}{{N_s}} \\implies I_s = \\left(\\frac{{{np}}}{{{ns}}}\\right) \\times {ip} = {is_curr}\\text{{ A}}$\nক্ষমতা $P = V_p I_p = V_s I_s = {power}\\text{{ W}}$",
            'primaryImage': None
        })

    # 31-50: Series R-L-C & Resonance
    for i, (r_ohm, l_mh, c_uf, freq) in enumerate([
        (50, 100, 20, 50), (40, 80, 25, 50), (60, 120, 15, 60), (30, 150, 30, 50), (45, 90, 18, 60),
        (70, 200, 10, 50), (55, 110, 22, 50), (65, 130, 16, 60), (35, 75, 35, 50), (80, 250, 8, 50),
        (50, 120, 20, 60), (42, 95, 24, 50), (58, 140, 14, 60), (38, 85, 28, 50), (75, 180, 12, 50),
        (48, 105, 19, 60), (62, 125, 17, 50), (34, 70, 32, 60), (68, 160, 11, 50), (52, 115, 21, 50)
    ], 31):
        omega = 2 * math.pi * freq
        xl = omega * (l_mh * 1e-3)
        xc = 1 / (omega * (c_uf * 1e-6))
        z_imp = round(math.sqrt(r_ohm**2 + (xl - xc)**2), 2)
        f_res = round(1 / (2 * math.pi * math.sqrt((l_mh * 1e-3) * (c_uf * 1e-6))), 2)
        items.append({
            'topic': 'শ্রেণি R-L-C বর্তনীর প্রতিবাধা ও অনুনাদ',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"$R = {r_ohm}\\ \\Omega$, $L = {l_mh}\\text{{ mH}}$ এবং $C = {c_uf}\\ \\mu\\text{{F}}$ বিশিষ্ট একটি শ্রেণি R-L-C বর্তনীতে ${freq}\\text{{ Hz}}$ কম্পাঙ্কের পরিবর্তী ভোল্টেজ প্রয়োগ করা হলে বর্তনীর প্রতিবাধা ($Z$) এবং অনুনাদী কম্পাঙ্ক ($f_0$) কত?",
            'modelAnswer': f"$Z = {z_imp}\\ \\Omega, f_0 = {f_res}\\text{{ Hz}}$",
            'explanation': f"আবেশীয় প্রতিঘাত $X_L = 2\\pi f L = {round(xl, 2)}\\ \\Omega$\nধারকীয় প্রতিঘাত $X_C = \\frac{{1}}{{2\\pi f C}} = {round(xc, 2)}\\ \\Omega$\nপ্রতিবাধা $Z = \\sqrt{{R^2 + (X_L - X_C)^2}} = {z_imp}\\ \\Omega$\nঅনুনাদী কম্পাঙ্ক $f_0 = \\frac{{1}}{{2\\pi\\sqrt{{LC}}}} = {f_res}\\text{{ Hz}}$",
            'primaryImage': '##PRESET:lc-circuit[size:medium]##' if i in [31, 40] else None
        })

    return items

def get_chapter_06_2nd_numericals():
    """Geometrical Optics - 50 Numerical Problems"""
    items = []
    
    # 1-20: Prism Refraction & Minimum Deviation
    for i, (a_deg, n_prism) in enumerate([
        (60, 1.50), (60, 1.52), (60, 1.60), (60, 1.66), (60, 1.45),
        (45, 1.50), (45, 1.60), (50, 1.52), (55, 1.55), (60, 1.58),
        (60, 1.54), (60, 1.62), (45, 1.52), (50, 1.60), (60, 1.48),
        (60, 1.70), (55, 1.50), (45, 1.65), (60, 1.56), (50, 1.55)
    ], 1):
        a_rad = math.radians(a_deg)
        # sin((A + dm)/2) = n * sin(A/2)
        sin_val = n_prism * math.sin(a_rad / 2)
        if sin_val <= 1.0:
            dm_rad = 2 * math.asin(sin_val) - a_rad
            dm = round(math.degrees(dm_rad), 2)
        else:
            dm = 0
        items.append({
            'topic': 'প্রিজমের প্রতিসরণ ও ন্যূনতম বিচ্যুতি কোণ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"প্রতিসরণ কোণ $A = {a_deg}^\\circ$ এবং প্রতিসরাঙ্ক $\\mu = {n_prism}$ বিশিষ্ট একটি প্রিজমের ন্যূনতম বিচ্যুতি কোণ ($\\delta_m$) কত?",
            'modelAnswer': f"$\\delta_m = {dm}^\\circ$",
            'explanation': f"প্রিজম সূত্র: $\\mu = \\frac{{\\sin\\left(\\frac{{A + \\delta_m}}{{2}}\\right)}}{{\\sin\\left(\\frac{{A}}{{2}}\\right)}} \\implies \\sin\\left(\\frac{{{a_deg}^\\circ + \\delta_m}}{{2}}\\right) = {n_prism} \\times \\sin({a_deg/2}^\\circ)$\n$\\implies \\frac{{{a_deg} + \\delta_m}}{{2}} = {round(math.degrees(math.asin(sin_val)), 2)}^\\circ \\implies \\delta_m = {dm}^\\circ$",
            'primaryImage': '##PRESET:prism(60)[size:medium]##' if i in [1, 10] else None
        })

    # 21-35: Thin Lens Formula & Power
    for i, (f_cm, u_cm) in enumerate([
        (20, -30), (15, -20), (25, -50), (10, -15), (30, -60),
        (12, -18), (18, -36), (22, -44), (16, -24), (28, -42),
        (14, -21), (24, -36), (20, -40), (15, -30), (25, -75)
    ], 21):
        # 1/v - 1/u = 1/f => 1/v = 1/f + 1/u
        v_cm = round(1 / ((1 / f_cm) + (1 / u_cm)), 2)
        mag = round(abs(v_cm / u_cm), 2)
        p_diopt = round(100 / f_cm, 2)
        items.append({
            'topic': 'উত্তল লেন্সের প্রতিবিম্ব দূরত্ব ও ক্ষমতা',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"ফোকাস দূরত্ব $f = +{f_cm}\\text{{ cm}}$ বিশিষ্ট একটি উত্তল লেন্স হতে ${abs(u_cm)}\\text{{ cm}}$ দূরে একটি বস্তু রাখা হলো। প্রতিবিম্বের দূরত্ব ($v$), রৈখিক বিবর্ধন ($m$) এবং লেন্সের ক্ষমতা ($P$) কত?",
            'modelAnswer': f"$v = +{v_cm}\\text{{ cm}}, m = {mag}, P = +{p_diopt}\\text{{ D}}$",
            'explanation': f"লেন্সের সূত্র: $\\frac{{1}}{{v}} - \\frac{{1}}{{u}} = \\frac{{1}}{{f}} \\implies \\frac{{1}}{{v}} = \\frac{{1}}{{{f_cm}}} + \\frac{{1}}{{{u_cm}}} \\implies v = +{v_cm}\\text{{ cm}}$\nবিবর্ধন $m = |\\frac{{v}}{{u}}| = |\\frac{{{v_cm}}}{{{u_cm}}}| = {mag}$\nলেন্সের ক্ষমতা $P = \\frac{{100}}{{f\\text{{ (cm)}}}} = \\frac{{100}}{{{f_cm}}} = +{p_diopt}\\text{{ D}}$",
            'primaryImage': '##PRESET:lens-convex(20)[size:medium]##' if i in [21, 25] else None
        })

    # 36-50: Telescope & Microscope
    for i, (f0_cm, fe_cm) in enumerate([
        (100, 5), (120, 6), (90, 4.5), (150, 7.5), (80, 4),
        (110, 5.5), (130, 6.5), (95, 5), (140, 7), (105, 5.25),
        (125, 5), (85, 4.25), (115, 5.75), (135, 6.75), (100, 4)
    ], 36):
        mag_tele = round(f0_cm / fe_cm, 2)
        len_tele = round(f0_cm + fe_cm, 2)
        items.append({
            'topic': 'নভো দূরবীক্ষণ যন্ত্রের বিবর্ধন ও নলের দৈর্ঘ্য',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"একটি নভো দূরবীক্ষণ যন্ত্রের অভিলক্ষ্য ও অভিনেত্রের ফোকাস দূরত্ব যথাক্রমে $f_0 = {f0_cm}\\text{{ cm}}$ এবং $f_e = {fe_cm}\\text{{ cm}}$। স্বাভাবিক দৃষ্টিতে (Normal Adjustment) যন্ত্রটির বিবর্ধন ক্ষমতা ($M$) এবং নলের দৈর্ঘ্য ($L$) কত?",
            'modelAnswer': f"$M = {mag_tele}, L = {len_tele}\\text{{ cm}}$",
            'explanation': f"স্বাভাবিক দর্শনের ক্ষেত্রে:\n১. বিবর্ধন ক্ষমতা $M = \\frac{{f_0}}{{f_e}} = \\frac{{{f0_cm}}}{{{fe_cm}}} = {mag_tele}$\n২. নলের দৈর্ঘ্য $L = f_0 + f_e = {f0_cm} + {fe_cm} = {len_tele}\\text{{ cm}}$",
            'primaryImage': '##PRESET:telescope[size:medium]##' if i in [36, 45] else None
        })

    return items
