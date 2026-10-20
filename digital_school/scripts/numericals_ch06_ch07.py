#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 1st Paper:
- Chapter 06: Gravitation and Gravity
- Chapter 07: Structural Properties of Matter
"""

import math

def get_chapter_06_numericals():
    """Gravitation and Gravity - 50 Numerical Problems"""
    items = []
    r_earth = 6400000.0 # 6400 km
    g_surf = 9.8
    g_const = 6.674e-11
    m_earth = 5.972e24

    # 1-15: g at Height and Depth
    for i, (h_km, mode) in enumerate([
        (100, 'h'), (200, 'h'), (400, 'h'), (640, 'h'), (800, 'h'),
        (1000, 'h'), (1600, 'h'), (3200, 'h'), (6400, 'h'), (50, 'h'),
        (100, 'd'), (320, 'd'), (640, 'd'), (1280, 'd'), (3200, 'd')
    ], 1):
        if mode == 'h':
            h = h_km * 1000
            gh = round(g_surf * (r_earth / (r_earth + h))**2, 3)
            items.append({
                'topic': 'উচ্চতার সাথে অভিকর্ষজ ত্বরণের পরিবর্তন',
                'difficulty': 'MEDIUM',
                'marks': 2,
                'questionText': f"ভূপৃষ্ঠ থেকে কত উচ্চতায় ($h = {h_km}\\text{{ km}}$) অভিকর্ষজ ত্বরণের মান কত হবে? (ভূপৃষ্ঠে $g = 9.8\\text{{ m/s}}^2$, পৃথিবীর ব্যাসার্ধ $R = 6400\\text{{ km}}$)",
                'modelAnswer': f"$g_h = {gh}\\text{{ m/s}}^2$",
                'explanation': f"উচ্চতায় অভিকর্ষজ ত্বরণ: $g_h = g \\left(\\frac{{R}}{{R + h}}\\right)^2 = 9.8 \\times \\left(\\frac{{6400}}{{6400 + {h_km}}}\\right)^2 = {gh}\\text{{ m/s}}^2$",
                'primaryImage': None
            })
        else:
            d = h_km * 1000
            gd = round(g_surf * (1 - (d / r_earth)), 3)
            items.append({
                'topic': 'গভীরতার সাথে অভিকর্ষজ ত্বরণের পরিবর্তন',
                'difficulty': 'MEDIUM',
                'marks': 2,
                'questionText': f"ভূপৃষ্ঠ হতে ভূ-অভ্যন্তরে ${h_km}\\text{{ km}}$ গভীরে অভিকর্ষজ ত্বরণের মান কত? ($R = 6400\\text{{ km}}$)",
                'modelAnswer': f"$g_d = {gd}\\text{{ m/s}}^2$",
                'explanation': f"গভীরতায় অভিকর্ষজ ত্বরণ: $g_d = g\\left(1 - \\frac{{d}}{{R}}\\right) = 9.8 \\times \\left(1 - \\frac{{{h_km}}}{{6400}}\\right) = {gd}\\text{{ m/s}}^2$",
                'primaryImage': None
            })

    # 16-30: Escape Velocity
    for i, (m_ratio, r_ratio, p_name) in enumerate([
        (1.0, 1.0, "পৃথিবী"), (0.107, 0.532, "মঙ্গল গ্রহ"), (0.0123, 0.273, "চাঁদ"),
        (317.8, 11.21, "বৃহস্পতি"), (95.2, 9.45, "শনি"), (14.5, 4.01, "ইউরেনাস"),
        (17.1, 3.88, "নেপচুন"), (0.815, 0.949, "শুক্র"), (0.055, 0.383, "বুধ"),
        (2.0, 1.2, "কাল্পনিক গ্রহ আলফা"), (0.5, 0.8, "কাল্পনিক গ্রহ বিটা"),
        (3.0, 1.5, "কাল্পনিক গ্রহ গামা"), (0.25, 0.5, "কাল্পনিক গ্রহ ডেল্টা"),
        (1.5, 1.1, "কাল্পনিক গ্রহ ওমেগা"), (4.0, 1.8, "কাল্পনিক গ্রহ সিগমা")
    ], 16):
        ve = round(11.2 * math.sqrt(m_ratio / r_ratio), 2)
        items.append({
            'topic': 'মুক্তিবেগ ও উপগ্রহের মুক্তি গতি',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"{p_name}-এর ভর পৃথিবীর ভরের ${m_ratio}$ গুণ এবং ব্যাসার্ধ পৃথিবীর ব্যাসার্ধের ${r_ratio}$ গুণ। উক্ত গ্রহের পৃষ্ঠ হতে মুক্তিবেগ ($v_e$) কত? (পৃথিবীতে মুক্তিবেগ $11.2\\text{{ km/s}}$)",
            'modelAnswer': f"$v_e = {ve}\\text{{ km/s}}$",
            'explanation': f"মুক্তিবেগ: $v_e = \\sqrt{{\\frac{{2GM}}{{R}}}} \\implies \\frac{{v_{{ep}}}}{{v_{{ee}}}} = \\sqrt{{\\frac{{M_p / M_e}}{{R_p / R_e}}}} = \\sqrt{{\\frac{{{m_ratio}}}{{{r_ratio}}}}}$\n$\\therefore v_{{ep}} = 11.2 \\times \\sqrt{{{round(m_ratio/r_ratio, 4)}}} = {ve}\\text{{ km/s}}$",
            'primaryImage': None
        })

    # 31-50: Satellites, Orbital Speed & Time Period
    for i, (h_orb_km) in enumerate([
        300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1500,
        2000, 3000, 5000, 10000, 15000, 20000, 25000, 30000, 35786, 36000
    ], 31):
        r_tot = (6400 + h_orb_km) * 1000
        v_orb = round(math.sqrt((g_const * m_earth) / r_tot) / 1000, 2) # in km/s
        t_hrs = round((2 * math.pi * math.sqrt(r_tot**3 / (g_const * m_earth))) / 3600, 2)
        items.append({
            'topic': 'কৃত্রিম উপগ্রহের কক্ষীয় বেগ ও পর্যায়কাল',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"ভূপৃষ্ঠ হতে ${h_orb_km}\\text{{ km}}$ উচ্চতায় প্রদক্ষিণরত একটি কৃত্রিম উপগ্রহের কক্ষীয় বেগ ($v$) এবং পর্যায়কাল ($T$) কত নির্ণয় কর। ($G = 6.674 \\times 10^{{-11}}\\text{{ N}}\\cdot\\text{{m}}^2/\\text{{kg}}^2, M_E = 5.972 \\times 10^{{24}}\\text{{ kg}}$)",
            'modelAnswer': f"$v = {v_orb}\\text{{ km/s}}, T = {t_hrs}\\text{{ ঘণ্টা}}$",
            'explanation': f"কক্ষীয় ব্যাসার্ধ $r = R + h = 6400 + {h_orb_km} = {6400+h_orb_km}\\text{{ km}}$\n১. কক্ষীয় বেগ: $v = \\sqrt{{\\frac{{GM}}{{r}}}} = {v_orb}\\text{{ km/s}}$\n২. পর্যায়কাল: $T = 2\\pi \\sqrt{{\\frac{{r^3}}{{GM}}}} = {t_hrs}\\text{{ ঘণ্টা}}$",
            'primaryImage': '##PRESET:circular-motion[size:medium]##' if i in [31, 45] else ('##GEO:ellipse[size:medium]##' if i == 50 else None)
        })

    return items

def get_chapter_07_numericals():
    """Structural Properties of Matter - 50 Numerical Problems"""
    items = []
    
    # 1-15: Young's Modulus & Wire Extension
    for i, (l_m, r_mm, f_n, y_val, mat) in enumerate([
        (2.0, 0.5, 50, 2.0e11, "ইস্পাতের"), (3.0, 0.8, 80, 1.1e11, "তামার"),
        (1.5, 0.4, 40, 2.0e11, "ইস্পাতের"), (2.5, 0.6, 60, 0.7e11, "অ্যালুমিনিয়ামের"),
        (4.0, 1.0, 100, 1.9e11, "লোহার"), (1.8, 0.5, 45, 1.2e11, "পিতলের"),
        (2.2, 0.7, 70, 2.0e11, "ইস্পাতের"), (3.5, 0.9, 90, 1.0e11, "তামার"),
        (1.2, 0.3, 30, 2.1e11, "ইস্পাতের"), (2.8, 0.8, 75, 0.75e11, "অ্যালুমিনিয়ামের"),
        (2.4, 0.65, 65, 1.8e11, "লোহার"), (3.2, 0.75, 85, 2.0e11, "ইস্পাতের"),
        (1.6, 0.45, 35, 1.15e11, "তামার"), (2.6, 0.55, 55, 2.0e11, "ইস্পাতের"),
        (4.5, 1.2, 120, 2.0e11, "ইস্পাতের")
    ], 1):
        area = math.pi * (r_mm * 1e-3)**2
        delta_l = (f_n * l_m) / (area * y_val) * 1000 # in mm
        delta_l_rd = round(delta_l, 3)
        energy = round(0.5 * f_n * (delta_l * 1e-3), 5)
        items.append({
            'topic': 'ইয়ংয়ের গুণাঙ্ক ও তারের প্রসারণ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${l_m}\\text{{ m}}$ দীর্ঘ এবং ${r_mm}\\text{{ mm}}$ ব্যাসার্ধের একটি {mat} তারের প্রান্তে ${f_n}\\text{{ N}}$ বল প্রয়োগ করা হলে তারটির দৈর্ঘ্য প্রসারণ ($\\Delta L$) এবং সঞ্চিত শক্তি কত? ($Y = {y_val/1e11} \\times 10^{{11}}\\text{{ N/m}}^2$)",
            'modelAnswer': f"$\\Delta L = {delta_l_rd}\\text{{ mm}}, W = {energy}\\text{{ J}}$",
            'explanation': f"প্রস্থচ্ছেদ $A = \\pi r^2 = \\pi({r_mm}\\times 10^{{-3}})^2\\text{{ m}}^2$\nদৈর্ঘ্য বৃদ্ধি $\\Delta L = \\frac{{F L}}{{A Y}} = {delta_l_rd}\\text{{ mm}}$\nসঞ্চিত শক্তি $W = \\frac{{1}}{{2}}F\\Delta L = 0.5 \\times {f_n} \\times ({delta_l_rd}\\times 10^{{-3}}) = {energy}\\text{{ J}}$",
            'primaryImage': '##PRESET:youngs-modulus[size:medium]##' if i in [1, 5] else None
        })

    # 16-30: Surface Tension & Bubbles
    for i, (t_surf, r_mm, mode) in enumerate([
        (0.072, 1.0, 'drop'), (0.072, 2.0, 'drop'), (0.030, 1.5, 'bubble'),
        (0.030, 2.5, 'bubble'), (0.072, 0.5, 'drop'), (0.030, 3.0, 'bubble'),
        (0.025, 2.0, 'bubble'), (0.072, 1.2, 'drop'), (0.035, 1.8, 'bubble'),
        (0.072, 0.8, 'drop'), (0.028, 2.2, 'bubble'), (0.072, 1.5, 'drop'),
        (0.032, 2.8, 'bubble'), (0.072, 0.6, 'drop'), (0.030, 4.0, 'bubble')
    ], 16):
        r = r_mm * 1e-3
        factor = 4 if mode == 'bubble' else 2
        name = "সাবানের বুদবুদের" if mode == 'bubble' else "পানির ফোঁটার"
        excess_p = round((factor * t_surf) / r, 2)
        items.append({
            'topic': 'পৃষ্ঠটান ও অতিরিক্ত চাপ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${r_mm}\\text{{ mm}}$ ব্যাসার্ধের একটি {name} অভ্যন্তরে অতিরিক্ত চাপ (Excess Pressure) কত? (পৃষ্ঠটান $T = {t_surf}\\text{{ N/m}}$)",
            'modelAnswer': f"$\\Delta P = {excess_p}\\text{{ N/m}}^2$",
            'explanation': f"অতিরিক্ত চাপের সূত্র: $\\Delta P = \\frac{{{factor}T}}{{R}} = \\frac{{{factor} \\times {t_surf}}}{{{r_mm}\\times 10^{{-3}}}} = {excess_p}\\text{{ N/m}}^2$",
            'primaryImage': None
        })

    # 31-50: Fluid Dynamics, Viscosity & Bernoulli
    for i, (a1_cm, v1, a2_cm) in enumerate([
        (20, 2.0, 10), (25, 1.5, 5), (16, 3.0, 8), (30, 1.2, 15), (18, 2.5, 6),
        (24, 2.0, 12), (32, 1.0, 8), (15, 3.2, 5), (28, 1.8, 14), (22, 2.4, 11),
        (35, 1.4, 7), (14, 4.0, 7), (26, 1.6, 13), (36, 1.2, 12), (40, 1.0, 20),
        (21, 2.2, 7), (33, 1.5, 11), (19, 2.8, 9.5), (27, 2.0, 9), (38, 1.1, 19)
    ], 31):
        v2 = round((a1_cm * v1) / a2_cm, 2)
        flow_rate = round((a1_cm * 1e-4) * v1 * 1000, 3) # L/s
        items.append({
            'topic': 'প্রবাহী গতিবিজ্ঞান, সান্দ্রতা ও সান্তত্য সমীকরণ',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"একটি পাইপের দুটি প্রান্তের প্রস্থচ্ছেদ যথাক্রমে $A_1 = {a1_cm}\\text{{ cm}}^2$ এবং $A_2 = {a2_cm}\\text{{ cm}}^2$। ১ম প্রান্তে পানির বেগ $v_1 = {v1}\\text{{ m/s}}$ হলে ২য় প্রান্তে বেগ ($v_2$) এবং প্রবাহের হার কত?",
            'modelAnswer': f"$v_2 = {v2}\\text{{ m/s}}, Q = {flow_rate}\\text{{ L/s}}$",
            'explanation': f"সান্তত্য সমীকরণ: $A_1 v_1 = A_2 v_2 \\implies v_2 = \\frac{{A_1 v_1}}{{A_2}} = \\frac{{{a1_cm} \\times {v1}}}{{{a2_cm}}} = {v2}\\text{{ m/s}}$\nপ্রবাহের হার $Q = A_1 v_1 = ({a1_cm}\\times 10^{{-4}}) \\times {v1} = {flow_rate}\\text{{ L/s}}$",
            'primaryImage': '##PRESET:bernoulli-equation[size:medium]##' if i in [31, 40] else None
        })

    return items
