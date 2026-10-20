#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 1st Paper:
- Chapter 02: Vector
- Chapter 03: Dynamics
- Chapter 04: Newtonian Mechanics
- Chapter 05: Work, Energy and Power
"""

import math

def get_chapter_02_numericals():
    """Vector - 50 Numerical Problems"""
    items = []
    
    # 1-10: Resultant of Forces
    for i, (p, q, alpha, img) in enumerate([
        (6, 8, 90, "##GEO:parallelogram[A=A,B=B,C=C,D=D,b=8,h=6,theta=90°][size:medium]##"),
        (5, 5, 120, None),
        (3, 5, 60, None),
        (10, 10, 60, None),
        (7, 24, 90, None),
        (8, 6, 120, None),
        (12, 5, 90, None),
        (10, 6, 60, None),
        (4, 4, 90, None),
        (15, 8, 90, None)
    ], 1):
        rad = math.radians(alpha)
        r = round(math.sqrt(p**2 + q**2 + 2*p*q*math.cos(rad)), 2)
        # angle with P
        theta = round(math.degrees(math.atan2(q * math.sin(rad), p + q * math.cos(rad))), 2)
        items.append({
            'topic': 'ভেক্টরের লব্ধির মান ও দিক',
            'difficulty': 'EASY' if i <= 5 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি বিন্দুতে ${p}\\text{{ N}}$ এবং ${q}\\text{{ N}}$ মানের দুটি বল পরস্পর ${alpha}^\\circ$ কোণে ক্রিয়ারত। বলদ্বয়ের লব্ধির মান কত নির্ণয় কর।",
            'modelAnswer': f"${r}\\text{{ N}}$",
            'explanation': f"লব্ধির সূত্র: $R = \\sqrt{{P^2 + Q^2 + 2PQ\\cos\\alpha}}$\n$= \\sqrt{{{p}^2 + {q}^2 + 2({p})({q})\\cos({alpha}^\\circ)}} = \\sqrt{{{p**2} + {q**2} + {round(2*p*q*math.cos(rad), 2)}}} = {r}\\text{{ N}}$\nলব্ধির দিক: $\\theta = {theta}^\\circ$ ($P$-এর সাথে)।",
            'primaryImage': img
        })

    # 11-20: River & Boat
    for i, (u, v, d) in enumerate([
        (3, 5, 1.2), (4, 6, 2.0), (2, 4, 0.8), (5, 10, 2.5), (3, 6, 1.5),
        (4, 8, 1.6), (2.5, 5, 1.0), (3.5, 7, 2.1), (4, 5, 1.8), (6, 10, 3.0)
    ], 11):
        # shortest path crossing
        theta_path = round(180 - math.degrees(math.asin(u/v)), 2)
        v_eff = round(math.sqrt(v**2 - u**2), 2)
        t_path = round((d / v_eff) * 60, 2) # in minutes
        # shortest time
        t_min = round((d / v) * 60, 2)
        items.append({
            'topic': 'নদী-নৌকা ও ন্যূনতম পথে নদী পারাপার',
            'difficulty': 'MEDIUM',
            'marks': 3,
            'questionText': f"নদীতে স্রোতের বেগ $u = {u}\\text{{ km/h}}$ এবং নৌকার বেগ $v = {v}\\text{{ km/h}}$। নদীর প্রস্থ ${d}\\text{{ km}}$ হলে, ঠিক সোজাসোজি বিপরীত বিন্দুতে পৌঁছাতে কত কোণে যাত্রা করতে হবে এবং কত সময় লাগবে?",
            'modelAnswer': f"কোণ $\\alpha = {theta_path}^\\circ$, সময় $t = {t_path}\\text{{ মিনিট}}$",
            'explanation': f"সোজাসোজি পার হওয়ার শর্ত: $\\cos\\alpha = -\\frac{{u}}{{v}} = -\\frac{{{u}}}{{{v}}} \\implies \\alpha = {theta_path}^\\circ$\nকার্যকর বেগ $v' = \\sqrt{{v^2 - u^2}} = \\sqrt{{{v}^2 - {u}^2}} = {v_eff}\\text{{ km/h}}$\nপ্রয়োজনীয় সময় $t = \\frac{{d}}{{v'}} = \\frac{{{d}}}{{{v_eff}}}\\text{{ ঘণ্টা}} = {t_path}\\text{{ মিনিট}}$।",
            'primaryImage': '##PRESET:vector[size:medium]##' if i in [11, 15] else None
        })

    # 21-30: Rain & Umbrella
    for i, (v_r, v_m) in enumerate([
        (6, 8), (10, 10), (12, 5), (8, 6), (9, 12),
        (15, 8), (20, 15), (7, 24), (16, 12), (10, 5)
    ], 21):
        v_rel = round(math.sqrt(v_r**2 + v_m**2), 2)
        theta_umb = round(math.degrees(math.atan(v_m / v_r)), 2)
        items.append({
            'topic': 'বৃষ্টি ও ছাতার আপেক্ষিক বেগ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"উলম্বভাবে ${v_r}\\text{{ m/s}}$ বেগে বৃষ্টি পড়ছে। একজন পথচারী অনুভূমিক বরাবর ${v_m}\\text{{ m/s}}$ বেগে হাঁটলে বৃষ্টি হতে বাঁচতে উলম্বের সাথে কত কোণে ছাতা ধরতে হবে?",
            'modelAnswer': f"${theta_umb}^\\circ$",
            'explanation': f"ছাতার কোণ (উলম্বের সাথে): $\\tan\\theta = \\frac{{v_m}}{{v_r}} = \\frac{{{v_m}}}{{{v_r}}} = {round(v_m/v_r, 4)}$\n$\\therefore \\theta = \\tan^{{-1}}({round(v_m/v_r, 4)}) = {theta_umb}^\\circ$\nআপেক্ষিক বেগ $v_{{rm}} = \\sqrt{{{v_r}^2 + {v_m}^2}} = {v_rel}\\text{{ m/s}}$।",
            'primaryImage': None
        })

    # 31-40: Dot Product & Angle Between Vectors
    for i, (ax, ay, az, bx, by, bz) in enumerate([
        (2, 3, -1, 1, 2, 8),
        (3, -2, 4, 2, 4, 1),
        (1, 1, 1, 2, -1, 2),
        (4, 2, -4, 1, -2, 2),
        (2, -1, 2, 3, 4, 0),
        (5, 0, 2, 2, 1, -5),
        (3, 3, 0, 0, 4, 4),
        (1, 2, 3, 2, 3, 1),
        (2, 4, -2, 1, -2, 3),
        (6, 2, -3, 3, -6, 2)
    ], 31):
        dot = ax*bx + ay*by + az*bz
        mag_a = round(math.sqrt(ax**2 + ay**2 + az**2), 3)
        mag_b = round(math.sqrt(bx**2 + by**2 + bz**2), 3)
        cos_th = max(-1.0, min(1.0, dot / (mag_a * mag_b)))
        theta = round(math.degrees(math.acos(cos_th)), 2)
        items.append({
            'topic': 'ডট গুণন ও মধ্যবর্তী কোণ নির্ণয়',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"দুটি ভেক্টর $\\vec{{A}} = {ax}\\hat{{i}} {'+' if ay>=0 else ''}{ay}\\hat{{j}} {'+' if az>=0 else ''}{az}\\hat{{k}}$ এবং $\\vec{{B}} = {bx}\\hat{{i}} {'+' if by>=0 else ''}{by}\\hat{{j}} {'+' if bz>=0 else ''}{bz}\\hat{{k}}$ এর মধ্যবর্তী কোণ কত?",
            'modelAnswer': f"${theta}^\\circ$",
            'explanation': f"$\\vec{{A}}\\cdot\\vec{{B}} = ({ax})({bx}) + ({ay})({by}) + ({az})({bz}) = {dot}$\n$|\\vec{{A}}| = {mag_a}$, $|\\vec{{B}}| = {mag_b}$\n$\\cos\\theta = \\frac{{\\vec{{A}}\\cdot\\vec{{B}}}}{{|\\vec{{A}}||\\vec{{B}}|}} = \\frac{{{dot}}}{{{round(mag_a*mag_b, 3)}}} = {round(cos_th, 4)} \\implies \\theta = {theta}^\\circ$",
            'primaryImage': '##PRESET:vector-3d[size:medium]##' if i in [31, 35] else None
        })

    # 41-50: Cross Product, Torque & Area
    for i, (rx, ry, rz, fx, fy, fz) in enumerate([
        (2, 1, 0, 0, 5, 0),
        (1, 2, -1, 3, 0, 4),
        (0, 3, 2, 4, -2, 1),
        (2, -1, 3, 1, 2, -1),
        (3, 2, 1, 2, -3, 4),
        (1, 0, 2, 2, 4, -1),
        (4, 1, -2, 1, 2, 3),
        (2, 3, 4, 4, 3, 2),
        (1, -2, 1, 3, 1, -2),
        (0, 4, 3, 5, 0, -2)
    ], 41):
        # tau = r x F
        tx = ry*fz - rz*fy
        ty = rz*fx - rx*fz
        tz = rx*fy - ry*fx
        mag_t = round(math.sqrt(tx**2 + ty**2 + tz**2), 2)
        items.append({
            'topic': 'ক্রস গুণন, টর্ক ও ক্ষেত্রফল',
            'difficulty': 'HARD',
            'marks': 3,
            'questionText': f"মূলবিন্দুর সাপেক্ষে অবস্থান ভেক্টর $\\vec{{r}} = ({rx}\\hat{{i}} {'+' if ry>=0 else ''}{ry}\\hat{{j}} {'+' if rz>=0 else ''}{rz}\\hat{{k}})\\text{{ m}}$ বিশিষ্ট বিন্দুতে $\\vec{{F}} = ({fx}\\hat{{i}} {'+' if fy>=0 else ''}{fy}\\hat{{j}} {'+' if fz>=0 else ''}{fz}\\hat{{k}})\\text{{ N}}$ বল প্রযুক্ত হলে টর্কের মান কত?",
            'modelAnswer': f"${mag_t}\\text{{ N}}\\cdot\\text{{m}}$",
            'explanation': f"টর্ক $\\vec{{\\tau}} = \\vec{{r}} \\times \\vec{{F}} = \\begin{{vmatrix}} \\hat{{i}} & \\hat{{j}} & \\hat{{k}} \\\\ {rx} & {ry} & {rz} \\\\ {fx} & {fy} & {fz} \\end{{vmatrix}} = ({tx})\\hat{{i}} + ({ty})\\hat{{j}} + ({tz})\\hat{{k}}$\nমানের হিসাব: $|\\vec{{\\tau}}| = \\sqrt{{({tx})^2 + ({ty})^2 + ({tz})^2}} = {mag_t}\\text{{ N}}\\cdot\\text{{m}}$",
            'primaryImage': None
        })

    return items

def get_chapter_03_numericals():
    """Dynamics - 50 Numerical Problems"""
    items = []
    
    # 1-15: 1D Kinematics & Vertical Motion
    for i, (u, a, t) in enumerate([
        (0, 2.5, 6), (10, 3.0, 4), (20, -2.0, 5), (5, 1.5, 8), (15, 2.0, 10),
        (0, 9.8, 3), (25, -5.0, 4), (12, 1.8, 6), (30, -3.0, 7), (8, 2.2, 5),
        (0, 4.0, 7), (18, -2.5, 6), (14, 1.2, 9), (0, 3.5, 8), (22, -4.0, 5)
    ], 1):
        v = round(u + a * t, 2)
        s = round(u * t + 0.5 * a * t**2, 2)
        items.append({
            'topic': 'সরলরৈখিক গতি ও ত্বরণ সংক্রান্ত সমীকরণ',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি বস্তু $u = {u}\\text{{ m/s}}$ আদিবেগ নিয়ে যাত্রা শুরু করে $a = {a}\\text{{ m/s}}^2$ সুষম ত্বরণে ${t}\\text{{ s}}$ চলল। ${t}\\text{{ s}}$ পর বস্তুটির বেগ ও অতিক্রান্ত দূরত্ব কত?",
            'modelAnswer': f"বেগ $v = {v}\\text{{ m/s}}$, দূরত্ব $s = {s}\\text{{ m}}$",
            'explanation': f"১. বেগ: $v = u + at = {u} + ({a})({t}) = {v}\\text{{ m/s}}$\n২. দূরত্ব: $s = ut + \\frac{{1}}{{2}}at^2 = ({u})({t}) + 0.5({a})({t}^2) = {s}\\text{{ m}}$",
            'primaryImage': None
        })

    # 16-35: Projectile Motion
    for i, (v0, theta) in enumerate([
        (40, 30), (30, 45), (50, 60), (25, 30), (60, 45),
        (20, 60), (35, 45), (45, 30), (55, 60), (28, 45),
        (48, 35), (32, 50), (42, 40), (52, 55), (38, 25),
        (44, 45), (26, 30), (58, 60), (34, 45), (46, 35)
    ], 16):
        g = 9.8
        rad = math.radians(theta)
        t_flight = round((2 * v0 * math.sin(rad)) / g, 2)
        h_max = round((v0**2 * (math.sin(rad))**2) / (2 * g), 2)
        r_range = round((v0**2 * math.sin(2 * rad)) / g, 2)
        items.append({
            'topic': 'প্রাসের গতিপথ, সর্বোচ্চ উচ্চতা ও পাল্লা',
            'difficulty': 'MEDIUM' if i <= 25 else 'HARD',
            'marks': 3,
            'questionText': f"একটি ক্রিকেট বল অনুভূমিকের সাথে ${theta}^\\circ$ কোণে ${v0}\\text{{ m/s}}$ বেগে নিক্ষেপ করা হলো ($g = 9.8\\text{{ m/s}}^2$)। বলটির বিচরণকাল ($T$), সর্বোচ্চ উচ্চতা ($H$) এবং অনুভূমিক পাল্লা ($R$) নির্ণয় কর।",
            'modelAnswer': f"$T = {t_flight}\\text{{ s}}, H = {h_max}\\text{{ m}}, R = {r_range}\\text{{ m}}$",
            'explanation': f"১. বিচরণকাল $T = \\frac{{2v_0\\sin\\theta}}{{g}} = \\frac{{2({v0})\\sin({theta}^\\circ)}}{{9.8}} = {t_flight}\\text{{ s}}$\n২. সর্বোচ্চ উচ্চতা $H = \\frac{{v_0^2\\sin^2\\theta}}{{2g}} = \\frac{{{v0}^2\\sin^2({theta}^\\circ)}}{{19.6}} = {h_max}\\text{{ m}}$\n৩. পাল্লা $R = \\frac{{v_0^2\\sin 2\\theta}}{{g}} = \\frac{{{v0}^2\\sin({2*theta}^\\circ)}}{{9.8}} = {r_range}\\text{{ m}}$",
            'primaryImage': '##PRESET:projectile(45,20)[size:medium]##' if i in [16, 20] else None
        })

    # 36-50: Circular Motion & Centripetal Acceleration
    for i, (r, v, m) in enumerate([
        (50, 20, 1000), (40, 15, 800), (100, 25, 1200), (25, 10, 500), (80, 20, 1500),
        (30, 12, 600), (60, 22, 1100), (45, 18, 900), (75, 24, 1300), (35, 14, 750),
        (90, 28, 1400), (20, 8, 400), (70, 21, 1050), (55, 19, 950), (65, 23, 1150)
    ], 36):
        ac = round(v**2 / r, 2)
        fc = round(m * ac, 2)
        omega = round(v / r, 3)
        items.append({
            'topic': 'বৃত্তাকার গতি ও কেন্দ্রমুখী বল',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${m}\\text{{ kg}}$ ভরের একটি গাড়ি ${r}\\text{{ m}}$ ব্যাসার্ধের বৃত্তাকার পথে ${v}\\text{{ m/s}}$ সমদ্রুতিতে ঘুরছে। গাড়িটির কেন্দ্রমুখী ত্বরণ ও প্রয়োজনীয় কেন্দ্রমুখী বল কত?",
            'modelAnswer': f"$a_c = {ac}\\text{{ m/s}}^2$, $F_c = {fc}\\text{{ N}}$",
            'explanation': f"১. কেন্দ্রমুখী ত্বরণ: $a_c = \\frac{{v^2}}{{r}} = \\frac{{{v}^2}}{{{r}}} = {ac}\\text{{ m/s}}^2$\n২. কেন্দ্রমুখী বল: $F_c = m a_c = {m} \\times {ac} = {fc}\\text{{ N}}$\nকৌণিক বেগ $\\omega = \\frac{{v}}{{r}} = {omega}\\text{{ rad/s}}$।",
            'primaryImage': '##PRESET:circular-motion[size:medium]##' if i in [36, 40] else None
        })

    return items
