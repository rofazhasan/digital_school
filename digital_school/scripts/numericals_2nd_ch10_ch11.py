#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 2nd Paper:
- Chapter 10: Semiconductor and Electronics
- Chapter 11: Astronomy
"""

import math

def get_chapter_10_2nd_numericals():
    """Semiconductor and Electronics - 50 Numerical Problems"""
    items = []

    # 1-15: Diode Characteristics & Dynamic Resistance
    # r_d = Delta V / Delta I
    diode_params = [
        (0.65, 0.75, 10, 30), (0.7, 0.8, 15, 45), (0.6, 0.7, 5, 25), (0.72, 0.82, 20, 50),
        (0.68, 0.78, 12, 36), (0.62, 0.72, 8, 28), (0.75, 0.85, 25, 65), (0.64, 0.74, 10, 35),
        (0.66, 0.76, 14, 42), (0.7, 0.82, 12, 48), (0.63, 0.71, 6, 22), (0.67, 0.77, 16, 46),
        (0.71, 0.81, 18, 54), (0.69, 0.79, 15, 40), (0.65, 0.78, 10, 45)
    ]
    for i, (v1, v2, i1_ma, i2_ma) in enumerate(diode_params, 1):
        del_v = round(v2 - v1, 2)
        del_i_a = (i2_ma - i1_ma) * 1e-3
        r_dyn = round(del_v / del_i_a, 2)
        items.append({
            'topic': 'পি-এন জাংশন ডায়োড ও গতীয় রোধ',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি সিলিকন পি-এন জাংশন ডায়োডের সম্মুখী বিভব ${v1}\\text{{ V}}$ হতে ${v2}\\text{{ V}}$-এ বৃদ্ধি করলে সম্মুখ প্রবাহ ${i1_ma}\\text{{ mA}}$ হতে ${i2_ma}\\text{{ mA}}$-তে উন্নীত হয়। ডায়োডটির গতীয় রোধ (Dynamic resistance, $r_d$) কত?",
            'modelAnswer': f"$r_d = {r_dyn}\\ \\Omega$",
            'explanation': f"গতীয় রোধ: $r_d = \\frac{{\\Delta V}}{{\\Delta I}} = \\frac{{{v2} - {v1}}}{{({i2_ma} - {i1_ma}) \\times 10^{{-3}}}}\\ \\Omega = \\frac{{{del_v}}}{{{del_i_a:.4f}}} = {r_dyn}\\ \\Omega$",
            'primaryImage': '##PRESET:diode-characteristics[size:medium]##' if i in [1, 5, 10] else None
        })

    # 16-32: BJT Transistor Current Relations & Amplification (alpha, beta, gains)
    # IE = IB + IC, alpha = IC / IE, beta = IC / IB
    trans_params = [
        (4.95, 5.0, 50), (9.8, 10.0, 100), (2.94, 3.0, 40), (5.88, 6.0, 80),
        (3.92, 4.0, 60), (7.84, 8.0, 120), (1.96, 2.0, 30), (8.82, 9.0, 150),
        (4.9, 5.0, 75), (9.9, 10.0, 90), (1.98, 2.0, 50), (3.96, 4.0, 70),
        (5.94, 6.0, 110), (7.92, 8.0, 130), (2.97, 3.0, 60), (4.92, 5.0, 85),
        (6.86, 7.0, 95)
    ]
    for i, (ic_ma, ie_ma, ib_ua) in enumerate(trans_params, 16):
        alpha = round(ic_ma / ie_ma, 4)
        beta = round((ic_ma * 1000) / ib_ua, 1)
        r_load_k = 5.0 # k-ohm
        r_in_ohm = 500 # ohm
        v_gain = round(beta * (r_load_k * 1000 / r_in_ohm), 1)
        items.append({
            'topic': 'ট্রানজিস্টরের প্রবাহ লাভ, বিটা ও ভোল্টেজ বিবর্ধন',
            'difficulty': 'MEDIUM',
            'marks': 2 if i <= 24 else 3,
            'questionText': f"সাধারণ নিঃসারক (CE) বিন্যাসে একটি ট্রানজিস্টরের নিঃসারক প্রবাহ $I_E = {ie_ma}\\text{{ mA}}$, সংগ্রাহক প্রবাহ $I_C = {ic_ma}\\text{{ mA}}$ এবং পিঠ প্রবাহ $I_B = {ib_ua}\\ \\mu\\text{{A}}$। ট্রানজিস্টরটির প্রবাহ বিবর্ধন গুণক ($\\alpha$) এবং প্রবাহ লাভ ($\\beta$) নির্ণয় কর।",
            'modelAnswer': f"$\\alpha = {alpha}$, $\\beta = {beta}$ (ভোল্টেজ লাভ $A_v = {v_gain}$)",
            'explanation': f"প্রবাহ বিবর্ধন গুণক: $\\alpha = \\frac{{I_C}}{{I_E}} = \\frac{{{ic_ma}}}{{{ie_ma}}} = {alpha}$\nপ্রবাহ লাভ: $\\beta = \\frac{{I_C}}{{I_B}} = \\frac{{{ic_ma} \\times 10^{{-3}}}}{{{ib_ua} \\times 10^{{-6}}}} = {beta}$\nসম্পর্ক যাচাই: $\\beta = \\frac{{\\alpha}}{{1 - \\alpha}} = \\frac{{{alpha}}}{{1 - {alpha}}} \\approx {beta}$",
            'primaryImage': '##PRESET:bjt-npn[size:medium]##' if i in [16, 22, 28] else None
        })

    # 33-42: Zener Diode Voltage Regulator
    # Vz, Vin, RL, Rs -> Iz = Is - IL
    zener_params = [
        (10.0, 15.0, 100, 1.0), (6.0, 12.0, 200, 0.5), (9.0, 18.0, 150, 0.8),
        (5.0, 10.0, 120, 0.4), (12.0, 20.0, 250, 1.2), (8.0, 14.0, 180, 0.6),
        (15.0, 24.0, 300, 1.5), (7.5, 15.0, 160, 0.75), (10.0, 18.0, 220, 1.0),
        (6.8, 12.0, 150, 0.5)
    ]
    for i, (vz, vin, rs_ohm, rl_k) in enumerate(zener_params, 33):
        # Is = (Vin - Vz) / Rs in mA
        i_s_ma = round(((vin - vz) / rs_ohm) * 1000, 1)
        # IL = Vz / (RL * 1000) in mA
        i_l_ma = round((vz / (rl_k * 1000)) * 1000, 1)
        i_z_ma = round(max(0.0, i_s_ma - i_l_ma), 1)
        items.append({
            'topic': 'জেনার ডায়োড ভোল্টেজ নিয়ন্ত্রক',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি জেনার ডায়োডের ব্রেকডাউন ভোল্টেজ $V_Z = {vz}\\text{{ V}}$। এটি ${rs_ohm}\\ \\Omega$ রোধকের মাধ্যমে ${vin}\\text{{ V}}$ ডিসি উৎসের সাথে যুক্ত। লোড রোধ $R_L = {rl_k}\\text{{ k}}\\Omega$ হলে জেনার প্রবাহ ($I_Z$) এবং লোড প্রবাহ ($I_L$) কত?",
            'modelAnswer': f"$I_Z = {i_z_ma}\\text{{ mA}}$, $I_L = {i_l_ma}\\text{{ mA}}$ (মোট প্রবাহ $I_S = {i_s_ma}\\text{{ mA}}$)",
            'explanation': f"মোট উৎস প্রবাহ: $I_S = \\frac{{V_{{in}} - V_Z}}{{R_S}} = \\frac{{{vin} - {vz}}}{{{rs_ohm}}}\\text{{ A}} = {i_s_ma}\\text{{ mA}}$\nলোড প্রবাহ: $I_L = \\frac{{V_Z}}{{R_L}} = \\frac{{{vz}}}{{{rl_k} \\times 10^3}}\\text{{ A}} = {i_l_ma}\\text{{ mA}}$\nজেনার প্রবাহ: $I_Z = I_S - I_L = {i_s_ma} - {i_l_ma} = {i_z_ma}\\text{{ mA}}$",
            'primaryImage': '##PRESET:zener-regulator[size:medium]##' if i in [33, 37] else None
        })

    # 43-50: Logic Gate Truth Tables and Boolean Output Calculations
    logic_circuits = [
        ("NAND", 1, 1, 0, "$Y = \\overline{A \\cdot B}$"),
        ("NOR", 1, 0, 0, "$Y = \\overline{A + B}$"),
        ("XOR", 1, 0, 1, "$Y = A \\oplus B = A\\overline{B} + \\overline{A}B$"),
        ("XNOR", 1, 1, 1, "$Y = \\overline{A \\oplus B}$"),
        ("AND", 1, 1, 1, "$Y = A \\cdot B$"),
        ("OR", 0, 1, 1, "$Y = A + B$"),
        ("XOR", 1, 1, 0, "$Y = A \\oplus B$"),
        ("NOR", 0, 0, 1, "$Y = \\overline{A + B}$")
    ]
    for i, (g_name, a_in, b_in, y_out, formula) in enumerate(logic_circuits, 43):
        items.append({
            'topic': 'লজিক গেট ও বুলিয়ান সমীকরণ',
            'difficulty': 'EASY' if i <= 46 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি দ্বি-ইনপুট {g_name} গেটের ইনপুট যথাক্রমে $A = {a_in}$ এবং $B = {b_in}$ হলে গেটের আউটপুট ($Y$) এর লজিক মান কত হবে? সংশ্লিষ্ট বুলিয়ান সমীকরণটি লেখ।",
            'modelAnswer': f"আউটপুট $Y = {y_out}$ ({formula})",
            'explanation': f"{g_name} গেটের আউটপুট সমীকরণ: {formula}\nইনপুট $A={a_in}, B={b_in}$ বসিয়ে পাই, $Y = {y_out}$।",
            'primaryImage': '##PRESET:logic-gates[size:medium]##' if i in [43, 47] else None
        })

    return items


def get_chapter_11_2nd_numericals():
    """Astronomy - 50 Numerical Problems"""
    items = []
    g_const = 6.674e-11
    c = 3.0e8
    m_sun = 1.989e30 # kg
    ly_m = 9.46e15 # m
    pc_m = 3.08e16 # m
    au_m = 1.496e11 # m

    # 1-15: Kepler's Third Law (Planetary orbits, Period and Distance)
    # T1^2 / T2^2 = r1^3 / r2^3
    planets_data = [
        (1.524, "মঙ্গল (Mars)"), (5.204, "বৃহস্পতি (Jupiter)"), (9.582, "শনি (Saturn)"),
        (0.387, "বুধ (Mercury)"), (0.723, "শুক্র (Venus)"), (19.22, "ইউরেনাস (Uranus)"),
        (30.05, "নেপচুন (Neptune)"), (2.0, "গ্রহাণু-A"), (3.0, "গ্রহাণু-B"),
        (4.0, "গ্রহাণু-C"), (2.5, "কাল্পনিক গ্রহ-১"), (1.8, "কাল্পনিক গ্রহ-২"),
        (6.0, "কাল্পনিক গ্রহ-৩"), (8.0, "কাল্পনিক গ্রহ-৪"), (12.0, "কাল্পনিক গ্রহ-৫")
    ]
    for i, (r_au, p_name) in enumerate(planets_data, 1):
        # T in years = r^(3/2)
        t_yrs = round(r_au ** 1.5, 2)
        t_days = round(t_yrs * 365.25, 1)
        items.append({
            'topic': 'কেপলারের ৩য় সূত্র ও গ্রহের আবর্তনকাল',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"সূর্য হতে {p_name}-এর গড় দূরত্ব ${r_au}\\text{{ AU}}$ (যেখানে পৃথিবী-সূর্য দূরত্ব $1\\text{{ AU}}$ এবং পৃথিবীর আবর্তনকাল $1\\text{{ বছর}}$)। কেপলারের সূত্রানুসারে {p_name}-এর সূর্যের চারদিকে একবার পরিক্রমণকাল ($T$) কত বছর?",
            'modelAnswer': f"$T = {t_yrs}\\text{{ বছর}}$ (${t_days}\\text{{ দিন}}$)",
            'explanation': f"কেপলারের ৩য় সূত্র: $\\frac{{T_1^2}}{{T_2^2}} = \\frac{{r_1^3}}{{r_2^3}} \\implies T = T_E \\left(\\frac{{r}}{{r_E}}\\right)^{{3/2}} = 1 \\times ({r_au})^{{3/2}} = {t_yrs}\\text{{ বছর}}$",
            'primaryImage': '##PRESET:kepler-orbit[size:medium]##' if i in [1, 5, 10] else None
        })

    # 16-28: Astronomical Distances (Light year, Parsec, AU conversions)
    astro_dists = [
        (4.24, "প্রক্সিমা সেন্টরাই (Proxima Centauri)"), (8.6, "লুব্ধক (Sirius)"),
        (2.5e6, "অ্যান্ড্রোমিডা গ্যালাক্সি (Andromeda)"), (4.37, "আলফা সেন্টরাই (Alpha Centauri)"),
        (25.0, "ভেগা (Vega)"), (640.0, "বেটেলজিউস (Betelgeuse)"),
        (10.0, "নক্ষত্র-X"), (15.0, "নক্ষত্র-Y"), (50.0, "নক্ষত্র-Z"),
        (100.0, "তারাগুচ্ছ-M"), (500.0, "নীহারিকা-N"), (1000.0, "নীহারিকা-P"),
        (26000.0, "ছায়াপথের কেন্দ্র (Galactic Center)")
    ]
    for i, (d_ly, obj_name) in enumerate(astro_dists, 16):
        d_m = d_ly * ly_m
        d_pc = round(d_ly / 3.26, 2)
        d_au = round(d_m / au_m, 1)
        items.append({
            'topic': 'জ্যোতির্বৈজ্ঞানিক দূরত্বের একক রূপান্তর (আলোকবর্ষ ও পারসেক)',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"পৃথিবী হতে {obj_name}-এর দূরত্ব ${d_ly}\\text{{ আলোকবর্ষ (ly)}}$। এই দূরত্বকে পারসেক (Parsec) এবং মিটারে রূপান্তর কর। ($1\\text{{ pc}} = 3.26\\text{{ ly}}$, $1\\text{{ ly}} = 9.46 \\times 10^{{15}}\\text{{ m}}$)",
            'modelAnswer': f"দূরত্ব $= {d_pc}\\text{{ pc}} = {d_m:.2e}\\text{{ m}}$",
            'explanation': f"পারসেকে দূরত্ব: $d = \\frac{{{d_ly}}}{{3.26}}\\text{{ pc}} = {d_pc}\\text{{ pc}}$\nমিটারে দূরত্ব: $d = {d_ly} \\times 9.46 \\times 10^{{15}}\\text{{ m}} = {d_m:.2e}\\text{{ m}}$",
            'primaryImage': '##PRESET:stellar-parallax[size:medium]##' if i in [16, 22] else None
        })

    # 29-40: Schwarzschild Radius & Black Holes
    # Rs = 2 G M / c^2
    bh_masses = [
        (1.0, "সূর্য সমভর"), (3.0, "৩ সৌরভর"), (5.0, "৫ সৌরভর"), (10.0, "১০ সৌরভর"),
        (20.0, "২০ সৌরভর"), (50.0, "৫০ সৌরভর"), (100.0, "১০০ সৌরভর"),
        (4.0e6, "ধনু A* (Sagittarius A*)"), (1.0e9, "সুপারম্যাসিভ কৃষ্ণগহ্বর"),
        (2.0, "২ সৌরভর"), (15.0, "১৫ সৌরভর"), (8.0, "৮ সৌরভর")
    ]
    for i, (m_sol, bh_name) in enumerate(bh_masses, 29):
        # Rs = 2 * G * (m_sol * M_sun) / c^2 = 2.95 * m_sol km
        rs_km = round(2.95 * m_sol, 2)
        items.append({
            'topic': 'সোয়ার্জশিল্ড ব্যাসার্ধ ও কৃষ্ণগহ্বরের ঘটনা দিগন্ত',
            'difficulty': 'MEDIUM' if i <= 35 else 'HARD',
            'marks': 2,
            'questionText': f"{bh_name}-এর ভর ${m_sol}\\text{{ সৌরভর}}$ ($M_\\odot = 1.989 \\times 10^{{30}}\\text{{ kg}}$)। বস্তুটির সোয়ার্জশিল্ড ব্যাসার্ধ (Schwarzschild radius, $R_s$) বা ঘটনা দিগন্তের ব্যাসার্ধ কত?",
            'modelAnswer': f"$R_s = {rs_km}\\text{{ km}}$ (${round(rs_km * 1000, 1)}\\text{{ m}}$)",
            'explanation': f"সোয়ার্জশিল্ড ব্যাসার্ধ: $R_s = \\frac{{2GM}}{{c^2}} = \\frac{{2 \\times 6.674 \\times 10^{{-11}} \\times ({m_sol} \\times 1.989 \\times 10^{{30}})}}{{(3 \\times 10^8)^2}}\\text{{ m}} = {rs_km}\\text{{ km}}$",
            'primaryImage': '##PRESET:black-hole-event-horizon[size:medium]##' if i in [29, 34] else None
        })

    # 41-50: Hubble's Law, Redshift & Age of Universe
    # v = H0 * d, z = v / c, T ~ 1 / H0
    hubble_params = [
        (10, 70), (20, 70), (50, 70), (100, 70), (200, 70),
        (15, 72), (30, 72), (80, 68), (150, 70), (250, 70)
    ]
    for i, (dist_mpc, h0_val) in enumerate(hubble_params, 41):
        # recession velocity v = H0 * d (km/s)
        v_recess = round(h0_val * dist_mpc, 1)
        # redshift z = v / c (c = 300,000 km/s)
        z_shift = round(v_recess / 300000.0, 4)
        # Universe age in billion years = (1 / H0) ~ 14 billion years
        t_univ_byrs = round(978.0 / h0_val, 1)
        items.append({
            'topic': 'হাবলের সূত্র, লোহিত অপসরণ ও মহাবিশ্বের বয়স',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"হাবল ধ্রুবক $H_0 = {h0_val}\\text{{ km s}}^{{-1}}\\text{{ Mpc}}^{{-1}}$ হলে, পৃথিবী হতে ${dist_mpc}\\text{{ Mpc}}$ দূরে অবস্থিত একটি গ্যালাক্সির পশ্চাদপসরণ বেগ ($v$) এবং লোহিত অপসরণ ($z$) কত? মহাবিশ্বের আনুমানিক বয়স কত?",
            'modelAnswer': f"$v = {v_recess}\\text{{ km/s}}$, $z = {z_shift}$, বয়স $\\approx {t_univ_byrs}\\text{{ বিলিয়ন বছর}}$",
            'explanation': f"হাবলের সূত্র: $v = H_0 d = {h0_val} \\times {dist_mpc} = {v_recess}\\text{{ km/s}}$\nলোহিত অপসরণ: $z = \\frac{{v}}{{c}} = \\frac{{{v_recess}}}{{300000}} = {z_shift}$\nমহাবিশ্বের আনুমানিক বয়স: $T \\approx \\frac{{1}}{{H_0}} = {t_univ_byrs}\\text{{ বিলিয়ন বছর}}$",
            'primaryImage': '##PRESET:expanding-universe[size:medium]##' if i in [41, 46] else None
        })

    return items
