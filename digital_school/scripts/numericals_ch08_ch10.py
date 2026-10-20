#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 1st Paper:
- Chapter 08: Periodic Motion
- Chapter 09: Waves
- Chapter 10: Ideal Gas and Kinetic Theory of Gases
"""

import math

def get_chapter_08_numericals():
    """Periodic Motion - 50 Numerical Problems"""
    items = []
    g = 9.8

    # 1-20: Simple Pendulum & Time Period
    for i, (l_m) in enumerate([
        0.5, 0.8, 0.993, 1.0, 1.2, 1.44, 1.5, 1.8, 2.0, 2.25,
        2.5, 2.7, 3.0, 3.24, 3.6, 4.0, 4.41, 4.9, 5.0, 6.25
    ], 1):
        t_period = round(2 * math.pi * math.sqrt(l_m / g), 3)
        freq = round(1 / t_period, 3)
        items.append({
            'topic': 'সরল দোলকের পর্যায়কাল ও কম্পাঙ্ক',
            'difficulty': 'EASY' if i <= 10 else 'MEDIUM',
            'marks': 2,
            'questionText': f"কার্যকর দৈর্ঘ্য $L = {l_m}\\text{{ m}}$ বিশিষ্ট একটি সরল দোলকের দোলনকাল ($T$) ও কম্পাঙ্ক ($f$) কত? ($g = 9.8\\text{{ m/s}}^2$)",
            'modelAnswer': f"$T = {t_period}\\text{{ s}}, f = {freq}\\text{{ Hz}}$",
            'explanation': f"দোলনকাল: $T = 2\\pi\\sqrt{{\\frac{{L}}{{g}}}} = 2\\pi\\sqrt{{\\frac{{{l_m}}}{{9.8}}}} = {t_period}\\text{{ s}}$\nকম্পাঙ্ক: $f = \\frac{{1}}{{T}} = {freq}\\text{{ Hz}}$",
            'primaryImage': '##PRESET:pendulum(30,1)[size:medium]##' if i in [1, 10] else None
        })

    # 21-35: SHM Velocity & Energy
    for i, (a_cm, t_sec, x_cm, m_kg) in enumerate([
        (10, 2.0, 6, 0.5), (12, 3.0, 8, 0.4), (8, 1.5, 4, 0.2), (15, 4.0, 9, 0.6), (14, 2.5, 7, 0.5),
        (20, 5.0, 12, 1.0), (16, 3.2, 10, 0.8), (18, 2.8, 11, 0.7), (25, 4.5, 15, 1.2), (10, 1.8, 5, 0.3),
        (22, 3.5, 14, 0.9), (30, 6.0, 18, 1.5), (12, 2.2, 7, 0.45), (15, 3.0, 10, 0.6), (24, 4.0, 16, 1.1)
    ], 21):
        omega = 2 * math.pi / t_sec
        a_m = a_cm / 100.0
        x_m = x_cm / 100.0
        v_val = round(omega * math.sqrt(a_m**2 - x_m**2), 3)
        ke = round(0.5 * m_kg * v_val**2, 4)
        pe = round(0.5 * m_kg * omega**2 * x_m**2, 4)
        e_tot = round(ke + pe, 4)
        items.append({
            'topic': 'সরল ছন্দিত গতির বেগ ও শক্তি',
            'difficulty': 'MEDIUM',
            'marks': 3,
            'questionText': f"${m_kg}\\text{{ kg}}$ ভরের একটি কণা ${a_cm}\\text{{ cm}}$ বিস্তার ও ${t_sec}\\text{{ s}}$ পর্যায়কালে সরল ছন্দিত স্পন্দনে স্পন্দিত হচ্ছে। সাম্যাবস্থান হতে ${x_cm}\\text{{ cm}}$ দূরত্বে কণাটির বেগ এবং গতিশক্তি কত?",
            'modelAnswer': f"$v = {v_val}\\text{{ m/s}}, K = {ke}\\text{{ J}}$",
            'explanation': f"কৌণিক কম্পাঙ্ক $\\omega = \\frac{{2\\pi}}{{T}} = {round(omega, 3)}\\text{{ rad/s}}$\n১. বেগ $v = \\omega\\sqrt{{A^2 - x^2}} = {round(omega, 3)}\\sqrt{{{a_m}^2 - {x_m}^2}} = {v_val}\\text{{ m/s}}$\n২. গতিশক্তি $K = \\frac{{1}}{{2}}mv^2 = 0.5 \\times {m_kg} \\times ({v_val})^2 = {ke}\\text{{ J}}$ (মোট শক্তি $E = {e_tot}\\text{{ J}}$)",
            'primaryImage': None
        })

    # 36-50: Spring-Mass Combinations
    for i, (k1, k2, m_val) in enumerate([
        (100, 200, 2.0), (300, 600, 3.0), (200, 200, 1.5), (400, 400, 4.0), (150, 300, 2.5),
        (250, 500, 3.5), (500, 500, 5.0), (120, 240, 1.8), (350, 700, 4.5), (180, 360, 2.2),
        (220, 440, 2.8), (280, 560, 3.2), (320, 640, 4.0), (160, 320, 2.0), (450, 900, 5.5)
    ], 36):
        ks = (k1 * k2) / (k1 + k2)
        kp = k1 + k2
        ts = round(2 * math.pi * math.sqrt(m_val / ks), 3)
        tp = round(2 * math.pi * math.sqrt(m_val / kp), 3)
        items.append({
            'topic': 'স্প্রিং-এর শ্রেণি ও সমান্তরাল সমবায়',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"$k_1 = {k1}\\text{{ N/m}}$ এবং $k_2 = {k2}\\text{{ N/m}}$ ধ্রুবকের দুটি স্প্রিং দিয়ে ${m_val}\\text{{ kg}}$ ভরের একটি বস্তুকে শ্রেণি ও সমান্তরালে যুক্ত করলে যথাক্রমে পর্যায়কাল ($T_s$ ও $T_p$) কত হবে?",
            'modelAnswer': f"$T_s = {ts}\\text{{ s}}, T_p = {tp}\\text{{ s}}$",
            'explanation': f"শ্রেণি সমবায়ে: $k_s = \\frac{{k_1 k_2}}{{k_1 + k_2}} = {round(ks, 2)}\\text{{ N/m}} \\implies T_s = 2\\pi\\sqrt{{\\frac{{{m_val}}}{{{round(ks, 2)}}}}} = {ts}\\text{{ s}}$\nসমান্তরাল সমবায়ে: $k_p = k_1 + k_2 = {kp}\\text{{ N/m}} \\implies T_p = 2\\pi\\sqrt{{\\frac{{{m_val}}}{{{kp}}}}} = {tp}\\text{{ s}}$",
            'primaryImage': '##PRESET:spring-pendulum(100,2,20,20)[size:medium]##' if i in [36, 45] else None
        })

    return items

def get_chapter_09_numericals():
    """Waves - 50 Numerical Problems"""
    items = []
    
    # 1-15: Wave Equation & Speed
    for i, (freq, wave_len) in enumerate([
        (256, 1.3), (512, 0.65), (320, 1.05), (440, 0.77), (200, 1.7),
        (100, 3.4), (400, 0.85), (300, 1.13), (480, 0.71), (384, 0.88),
        (150, 2.26), (600, 0.57), (280, 1.21), (350, 0.97), (500, 0.68)
    ], 1):
        v = round(freq * wave_len, 2)
        omega = round(2 * math.pi * freq, 2)
        k_wave = round(2 * math.pi / wave_len, 2)
        items.append({
            'topic': 'তরঙ্গ সমীকরণ, বেগ ও তরঙ্গদৈর্ঘ্য',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি তরঙ্গের কম্পাঙ্ক $f = {freq}\\text{{ Hz}}$ এবং তরঙ্গদৈর্ঘ্য $\\lambda = {wave_len}\\text{{ m}}$ হলে তরঙ্গের বেগ ($v$) এবং কৌণিক কম্পাঙ্ক ($\\omega$) কত?",
            'modelAnswer': f"$v = {v}\\text{{ m/s}}, \\omega = {omega}\\text{{ rad/s}}$",
            'explanation': f"১. তরঙ্গের বেগ: $v = f\\lambda = {freq} \\times {wave_len} = {v}\\text{{ m/s}}$\n২. কৌণিক কম্পাঙ্ক: $\\omega = 2\\pi f = 2\\pi({freq}) = {omega}\\text{{ rad/s}}$\nতরঙ্গ সংখ্যা $k = \\frac{{2\\pi}}{{\\lambda}} = {k_wave}\\text{{ rad/m}}$",
            'primaryImage': '##PRESET:wave-transverse[size:medium]##' if i in [1, 10] else None
        })

    # 16-30: Organ Pipes & Harmonics
    for i, (l_m, v_sound, mode) in enumerate([
        (0.85, 340, 'open'), (0.85, 340, 'closed'), (1.0, 340, 'open'),
        (1.0, 340, 'closed'), (0.68, 340, 'open'), (0.68, 340, 'closed'),
        (0.5, 332, 'open'), (0.5, 332, 'closed'), (1.2, 340, 'open'),
        (1.2, 340, 'closed'), (0.75, 345, 'open'), (0.75, 345, 'closed'),
        (0.9, 342, 'open'), (0.9, 342, 'closed'), (1.5, 340, 'open')
    ], 16):
        if mode == 'open':
            f1 = round(v_sound / (2 * l_m), 2)
            f2 = round(2 * f1, 2)
            name = "খোলা অর্গান নলের"
            formula = "f_1 = \\frac{v}{2L}"
        else:
            f1 = round(v_sound / (4 * l_m), 2)
            f2 = round(3 * f1, 2)
            name = "বদ্ধ অর্গান নলের"
            formula = "f_1 = \\frac{v}{4L}"
        items.append({
            'topic': 'অর্গান নল ও মূলসুর-উপসুরের কম্পাঙ্ক',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${l_m}\\text{{ m}}$ দীর্ঘ একটি {name} মূল সুরের কম্পাঙ্ক ($f_1$) এবং পরবর্তী সুরের কম্পাঙ্ক কত? (বায়ুতে শব্দের বেগ $v = {v_sound}\\text{{ m/s}}$)",
            'modelAnswer': f"$f_1 = {f1}\\text{{ Hz}}$, পরবর্তী সুর = ${f2}\\text{{ Hz}}$",
            'explanation': f"সূত্র: ${formula} = \\frac{{{v_sound}}}{{{4 if mode=='closed' else 2} \\times {l_m}}} = {f1}\\text{{ Hz}}$\n{name} পরবর্তী সুর = ${f2}\\text{{ Hz}}$",
            'primaryImage': '##PRESET:wave-standing[size:medium]##' if i in [16, 20] else None
        })

    # 31-50: Doppler Effect
    for i, (f_src, v_s, v_o, v_sound, s_dir, o_dir) in enumerate([
        (500, 20, 0, 340, 'towards', 'rest'),
        (500, 20, 0, 340, 'away', 'rest'),
        (600, 0, 15, 340, 'rest', 'towards'),
        (600, 0, 15, 340, 'rest', 'away'),
        (450, 25, 10, 340, 'towards', 'away'),
        (550, 30, 0, 340, 'towards', 'rest'),
        (480, 18, 0, 335, 'towards', 'rest'),
        (520, 0, 12, 340, 'rest', 'towards'),
        (400, 22, 0, 340, 'towards', 'rest'),
        (650, 25, 0, 345, 'towards', 'rest'),
        (700, 35, 0, 340, 'towards', 'rest'),
        (350, 15, 0, 330, 'towards', 'rest'),
        (580, 20, 0, 340, 'towards', 'rest'),
        (620, 0, 18, 342, 'rest', 'towards'),
        (460, 28, 0, 340, 'towards', 'rest'),
        (510, 24, 0, 338, 'towards', 'rest'),
        (540, 16, 0, 340, 'towards', 'rest'),
        (640, 32, 0, 344, 'towards', 'rest'),
        (430, 14, 0, 340, 'towards', 'rest'),
        (570, 26, 0, 342, 'towards', 'rest')
    ], 31):
        if s_dir == 'towards' and o_dir == 'rest':
            f_app = round(f_src * (v_sound / (v_sound - v_s)), 2)
            desc = f"উৎস ${v_s}\\text{{ m/s}}$ দ্রুতিতে স্থির শ্রোতার দিকে এগিয়ে আসছে"
        elif s_dir == 'away' and o_dir == 'rest':
            f_app = round(f_src * (v_sound / (v_sound + v_s)), 2)
            desc = f"উৎস ${v_s}\\text{{ m/s}}$ দ্রুতিতে স্থির শ্রোতা থেকে দূরে সরে যাচ্ছে"
        elif s_dir == 'rest' and o_dir == 'towards':
            f_app = round(f_src * ((v_sound + v_o) / v_sound), 2)
            desc = f"শ্রোতা ${v_o}\\text{{ m/s}}$ দ্রুতিতে স্থির উৎসের দিকে এগিয়ে আসছে"
        else:
            f_app = round(f_src * (v_sound / (v_sound - v_s)), 2)
            desc = f"উৎস ${v_s}\\text{{ m/s}}$ দ্রুতিতে শ্রোতার দিকে এগিয়ে আসছে"
        items.append({
            'topic': 'ডপলার ক্রিয়া ও আপাত কম্পাঙ্ক',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"${f_src}\\text{{ Hz}}$ কম্পাঙ্কের একটি শব্দ উৎস হতে শব্দ নিঃসৃত হচ্ছে। {desc} (বায়ুতে শব্দের দ্রুতি $v = {v_sound}\\text{{ m/s}}$)। শ্রোতার নিকট আপাত কম্পাঙ্ক ($f'$) কত?",
            'modelAnswer': f"$f' = {f_app}\\text{{ Hz}}$",
            'explanation': f"ডপলার ক্রিয়ার সূত্রানুসারে:\n$f' = f \\left(\\frac{{v \\pm v_o}}{{v \\mp v_s}}\\right) = {f_app}\\text{{ Hz}}$",
            'primaryImage': '##PRESET:doppler-effect[size:medium]##' if i in [31, 40] else None
        })

    return items

def get_chapter_10_numericals():
    """Ideal Gas and Kinetic Theory of Gases - 50 Numerical Problems"""
    items = []
    r_const = 8.314
    
    # 1-20: RMS Velocity & Temperature
    for i, (m_molar_g, t_celsius, gas_name) in enumerate([
        (32, 27, "অক্সিজেন"), (28, 27, "নাইট্রোজেন"), (2, 27, "হাইড্রোজেন"),
        (44, 27, "কার্বন ডাই-অক্সাইড"), (4, 27, "হিলিয়াম"), (32, 100, "অক্সিজেন"),
        (28, 0, "নাইট্রোজেন"), (2, 100, "হাইড্রোজেন"), (32, 0, "অক্সিজেন"),
        (44, 100, "কার্বন ডাই-অক্সাইড"), (16, 27, "মিথেন"), (28, 50, "নাইট্রোজেন"),
        (32, 50, "অক্সিজেন"), (2, 0, "হাইড্রোজেন"), (4, 100, "হিলিয়াম"),
        (16, 0, "মিথেন"), (32, -23, "অক্সিজেন"), (28, -73, "নাইট্রোজেন"),
        (44, 200, "কার্বন ডাই-অক্সাইড"), (2, -100, "হাইড্রোজেন")
    ], 1):
        t_kelvin = t_celsius + 273.15
        m_kg = m_molar_g * 1e-3
        c_rms = round(math.sqrt((3 * r_const * t_kelvin) / m_kg), 2)
        ke_mol = round(1.5 * r_const * t_kelvin, 2)
        items.append({
            'topic': 'আণবিক গড় বর্গবেগ (RMS) ও গতিশক্তি',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${t_celsius}^\\circ\\text{{C}}$ তাপমাত্রায় {gas_name} গ্যাসের অণুসমূহের আরএমএস (RMS) বেগ ($c$) এবং প্রতি মোলের মোট গতিশক্তি কত? ($R = 8.314\\text{{ J/(mol}}\\cdot\\text{{K)}}$)",
            'modelAnswer': f"$c = {c_rms}\\text{{ m/s}}, E = {ke_mol}\\text{{ J/mol}}$",
            'explanation': f"পরম তাপমাত্রা $T = {t_celsius} + 273.15 = {t_kelvin}\\text{{ K}}$\n১. আরএমএস বেগ: $c = \\sqrt{{\\frac{{3RT}}{{M}}}} = \\sqrt{{\\frac{{3 \\times 8.314 \\times {t_kelvin}}}{{{m_kg}}}}} = {c_rms}\\text{{ m/s}}$\n২. প্রতি মোলের গতিশক্তি: $E = \\frac{{3}}{{2}}RT = 1.5 \\times 8.314 \\times {t_kelvin} = {ke_mol}\\text{{ J/mol}}$",
            'primaryImage': '##PRESET:maxwell-distribution[size:medium]##' if i in [1, 10] else None
        })

    # 21-35: Gas Laws & State Changes
    for i, (p1, v1, t1_c, p2, v2) in enumerate([
        (1.0, 10.0, 27, 2.0, 6.0), (1.5, 8.0, 20, 3.0, 4.5), (2.0, 5.0, 15, 1.0, 9.0),
        (1.0, 12.0, 25, 2.5, 5.0), (1.2, 15.0, 30, 2.0, 10.0), (0.8, 20.0, 22, 1.6, 11.0),
        (1.0, 6.0, 0, 3.0, 2.5), (2.5, 4.0, 35, 1.5, 6.0), (1.8, 7.5, 28, 2.2, 6.5),
        (1.0, 14.0, 18, 2.0, 8.0), (1.4, 9.0, 24, 2.8, 5.0), (1.1, 11.0, 26, 2.2, 6.0),
        (2.0, 8.0, 32, 4.0, 4.2), (1.3, 10.5, 21, 2.6, 5.5), (1.0, 16.0, 17, 2.5, 7.0)
    ], 21):
        t1_k = t1_c + 273.15
        t2_k = (p2 * v2 * t1_k) / (p1 * v1)
        t2_c = round(t2_k - 273.15, 2)
        items.append({
            'topic': 'আদর্শ গ্যাস সূত্র ও অবস্থার পরিবর্তন',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${p1}\\text{{ atm}}$ চাপে এবং ${t1_c}^\\circ\\text{{C}}$ তাপমাত্রায় নির্দিষ্ট ভরের গ্যাসের আয়তন ${v1}\\text{{ L}}$। চাপ বৃদ্ধি করে ${p2}\\text{{ atm}}$ এবং আয়তন ${v2}\\text{{ L}}$ করা হলে পরিবর্তিত তাপমাত্রা কত হবে?",
            'modelAnswer': f"$T_2 = {t2_c}^\\circ\\text{{C}}$ (${round(t2_k, 2)}\\text{{ K}}$)",
            'explanation': f"সম্মিলিত গ্যাস সূত্র: $\\frac{{P_1 V_1}}{{T_1}} = \\frac{{P_2 V_2}}{{T_2}} \\implies T_2 = \\frac{{P_2 V_2 T_1}}{{P_1 V_1}}$\n$T_1 = {t1_c} + 273.15 = {t1_k}\\text{{ K}}$\n$\\therefore T_2 = \\frac{{{p2} \\times {v2} \\times {t1_k}}}{{{p1} \\times {v1}}} = {round(t2_k, 2)}\\text{{ K}} = {t2_c}^\\circ\\text{{C}}$",
            'primaryImage': '##PRESET:pv-diagram(isothermal)[size:medium]##' if i in [21, 25] else None
        })

    # 36-50: Relative Humidity & Dew Point
    for i, (dry_t, wet_t, g_factor, f_dew, f_dry) in enumerate([
        (30, 25, 1.65, 18.5, 31.8),
        (28, 24, 1.69, 19.8, 28.3),
        (25, 21, 1.75, 16.2, 23.8),
        (32, 26, 1.62, 19.5, 35.7),
        (26, 22, 1.72, 17.5, 25.2),
        (29, 23, 1.67, 16.8, 30.0),
        (27, 23, 1.70, 18.8, 26.7),
        (31, 25, 1.63, 18.9, 33.7),
        (24, 20, 1.78, 15.0, 22.4),
        (33, 27, 1.60, 20.2, 37.7),
        (30, 24, 1.65, 16.5, 31.8),
        (28, 22, 1.69, 15.6, 28.3),
        (26, 21, 1.72, 15.4, 25.2),
        (32, 25, 1.62, 17.2, 35.7),
        (29, 24, 1.67, 19.0, 30.0)
    ], 36):
        dew_point = round(dry_t - g_factor * (dry_t - wet_t), 2)
        rh = round((f_dew / f_dry) * 100, 2)
        items.append({
            'topic': 'আপেক্ষিক আর্দ্রতা ও শিশিরাংক নির্ণয়',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"শুষ্ক ও আর্দ্র বাল্ব হাইগ্রোমিটারে শুষ্ক বাল্বের পাঠ ${dry_t}^\\circ\\text{{C}}$ এবং আর্দ্র বাল্বের পাঠ ${wet_t}^\\circ\\text{{C}}$। ${dry_t}^\\circ\\text{{C}}$-এ গ্লেইশারের উৎপাদক $G = {g_factor}$। শিশিরাংকে ও কক্ষ তাপমাত্রায় সম্পৃক্ত বাষ্পচাপ যথাক্রমে ${f_dew}\\text{{ mmHg}}$ ও ${f_dry}\\text{{ mmHg}}$ হলে শিশিরাংক ও আপেক্ষিক আর্দ্রতা ($RH$) নির্ণয় কর।",
            'modelAnswer': f"শিশিরাংক = ${dew_point}^\\circ\\text{{C}}$, $RH = {rh}\\%$",
            'explanation': f"১. শিশিরাংক $\\theta = \\theta_1 - G(\\theta_1 - \\theta_2) = {dry_t} - {g_factor}({dry_t} - {wet_t}) = {dew_point}^\\circ\\text{{C}}$\n২. আপেক্ষিক আর্দ্রতা $RH = \\frac{{f}}{{F}} \\times 100\\% = \\frac{{{f_dew}}}{{{f_dry}}} \\times 100\\% = {rh}\\%$",
            'primaryImage': None
        })

    return items
