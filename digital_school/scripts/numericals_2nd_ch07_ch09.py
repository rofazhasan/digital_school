#!/usr/bin/env python3
"""
Numerical Generators for HSC Physics 2nd Paper:
- Chapter 07: Physical Optics
- Chapter 08: Modern Physics
- Chapter 09: Atomic & Nuclear Physics
"""

import math

def get_chapter_07_2nd_numericals():
    """Physical Optics - 50 Numerical Problems"""
    items = []

    # 1-18: Young's Double Slit Experiment (Fringe width, wavelength, slit separation)
    # beta = (lambda * D) / d
    ydse_params = [
        (6000, 1.0, 0.4), (5890, 1.2, 0.5), (5000, 0.8, 0.25), (6500, 1.5, 0.6),
        (4500, 1.0, 0.3), (5500, 1.2, 0.4), (6200, 1.4, 0.5), (4800, 0.9, 0.3),
        (5200, 1.1, 0.35), (5400, 1.3, 0.45), (5900, 1.0, 0.3), (6328, 1.5, 0.5),
        (4000, 0.8, 0.2), (7000, 1.6, 0.7), (4600, 1.0, 0.4), (5100, 1.2, 0.3),
        (5600, 1.1, 0.35), (6400, 1.3, 0.4)
    ]
    for i, (lam_a, d_m, slit_mm) in enumerate(ydse_params, 1):
        lam = lam_a * 1e-10
        d_val = slit_mm * 1e-3
        beta_m = (lam * d_m) / d_val
        beta_mm = round(beta_m * 1000, 3)
        # distance of 5th bright fringe
        x5_mm = round(5 * beta_mm, 3)
        items.append({
            'topic': 'ইয়ং-এর দ্বি-চির পরীক্ষা ও ডোরার বিস্তার',
            'difficulty': 'EASY' if i <= 8 else 'MEDIUM',
            'marks': 2 if i <= 10 else 3,
            'questionText': f"ইয়ং-এর দ্বি-চির পরীক্ষায় চিরদ্বয়ের মধ্যবর্তী দূরত্ব ${slit_mm}\\text{{ mm}}$ এবং চির হতে পর্দার দূরত্ব ${d_m}\\text{{ m}}$। ব্যবহৃত আলোর তরঙ্গদৈর্ঘ্য ${lam_a}\\text{{ \\AA}}$ হলে, ডোরার বিস্তার (Fringe width, $\\beta$) কত এবং কেন্দ্রীয় উজ্জ্বল ডোরা থেকে ৫ম উজ্জ্বল ডোরার দূরত্ব কত?",
            'modelAnswer': f"$\\beta = {beta_mm}\\text{{ mm}}$, $x_5 = {x5_mm}\\text{{ mm}}$",
            'explanation': f"ডোরার বিস্তার $\\beta = \\frac{{\\lambda D}}{{d}} = \\frac{{{lam:.3e} \\times {d_m}}}{{{d_val}}} = {beta_mm}\\text{{ mm}}$\n$n$-তম উজ্জ্বল ডোরার দূরত্ব $x_n = n \\frac{{\\lambda D}}{{d}} = 5 \\times {beta_mm} = {x5_mm}\\text{{ mm}}$",
            'primaryImage': '##PRESET:interference-slits[size:medium]##' if i in [1, 5, 10] else None
        })

    # 19-32: Diffraction Grating (lines/cm, order of spectrum, wavelength)
    # (a + b) sin(theta) = n * lambda
    grating_params = [
        (5000, 5890, 1), (6000, 6000, 1), (4000, 5000, 2), (5000, 4500, 2),
        (6000, 5500, 1), (3000, 6500, 2), (4500, 5200, 1), (5500, 5893, 1),
        (6000, 6328, 1), (5000, 5000, 2), (4000, 4800, 2), (6500, 4000, 2),
        (5000, 6000, 2), (4000, 6200, 1)
    ]
    for i, (n_per_cm, lam_a, order) in enumerate(grating_params, 19):
        d_grating = 1e-2 / n_per_cm # (a+b) in meters
        lam = lam_a * 1e-10
        sin_theta = (order * lam) / d_grating
        theta_deg = round(math.degrees(math.asin(min(sin_theta, 1.0))), 2)
        n_max = int(d_grating / lam)
        items.append({
            'topic': 'অপবর্তন গ্রেটিং ও অপবর্তন কোণ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"প্রতি সেন্টিমিটারে ${n_per_cm}$ টি রেখা বিশিষ্ট একটি গ্রেটিং-এর উপর ${lam_a}\\text{{ \\AA}}$ তরঙ্গদৈর্ঘ্যের আলো লম্বভাবে আপতিত হলে, {order}-ম ক্রমের জন্য অপবর্তন কোণ (Diffraction angle, $\\theta$) কত হবে?",
            'modelAnswer': f"$\\theta = {theta_deg}^\\circ$ (সর্বোচ্চ ক্রম $n_{{\\max}} = {n_max}$)",
            'explanation': f"গ্রেটিং ধ্রুবক $(a+b) = \\frac{{1}}{{N}} = \\frac{{10^{{-2}}}}{{{n_per_cm}}}\\text{{ m}} = {d_grating:.3e}\\text{{ m}}$\nগ্রেটিং সমীকরণ: $(a+b)\\sin\\theta = n\\lambda \\implies \\sin\\theta = \\frac{{{order} \\times {lam:.3e}}}{{{d_grating:.3e}}} = {sin_theta:.4f} \\implies \\theta = {theta_deg}^\\circ$",
            'primaryImage': '##PRESET:diffraction-pattern[size:medium]##' if i in [19, 25] else None
        })

    # 33-42: Single Slit Diffraction (Central Maxima width, Minima condition)
    # a sin(theta) = n * lambda
    single_slit_params = [
        (0.1, 6000, 1.5), (0.15, 5000, 1.2), (0.08, 6500, 1.0), (0.12, 5890, 2.0),
        (0.2, 5500, 1.8), (0.05, 4500, 0.8), (0.1, 5200, 1.4), (0.18, 6200, 1.6),
        (0.25, 6000, 2.2), (0.15, 4800, 1.5)
    ]
    for i, (a_mm, lam_a, d_m) in enumerate(single_slit_params, 33):
        a_m = a_mm * 1e-3
        lam = lam_a * 1e-10
        # linear width of central maximum = 2 * lambda * D / a
        w_central_mm = round((2 * lam * d_m / a_m) * 1000, 3)
        angular_w_deg = round(math.degrees(2 * lam / a_m), 4)
        items.append({
            'topic': 'একক চিরের দরুন অপবর্তন ও কেন্দ্রীয় চরমের বেধ',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"${a_mm}\\text{{ mm}}$ প্রস্থের একটি একক চিরের ওপর ${lam_a}\\text{{ \\AA}}$ তরঙ্গদৈর্ঘ্যের আলো লম্বভাবে আপতিত হচ্ছে। চির হতে ${d_m}\\text{{ m}}$ দূরে রক্ষিত পর্দায় কেন্দ্রীয় চরমের রৈখিক বেধ কত হবে?",
            'modelAnswer': f"কেন্দ্রীয় চরমের বেধ $= {w_central_mm}\\text{{ mm}}$",
            'explanation': f"কেন্দ্রীয় চরমের রৈখিক বেধ: $2x = \\frac{{2\\lambda D}}{{a}} = \\frac{{2 \\times {lam:.3e} \\times {d_m}}}{{{a_m}}} = {w_central_mm}\\text{{ mm}}$\nকৌণিক বেধ $2\\theta = \\frac{{2\\lambda}}{{a}} = {angular_w_deg}^\\circ$",
            'primaryImage': '##PRESET:diffraction-pattern[size:medium]##' if i in [33, 38] else None
        })

    # 43-50: Polarization, Brewster's Law & Malus' Law
    # tan(theta_p) = mu, I = I_0 cos^2(theta)
    polar_params = [
        (1.5, 30), (1.33, 45), (1.52, 60), (1.65, 45),
        (1.45, 30), (1.732, 60), (1.55, 45), (1.38, 30)
    ]
    for i, (mu_val, pol_ang) in enumerate(polar_params, 43):
        # Brewster angle: theta_p = atan(mu)
        theta_p = round(math.degrees(math.atan(mu_val)), 2)
        # Malus law: transmitted intensity ratio I / I0 = cos^2(pol_ang)
        i_ratio = round(math.cos(math.radians(pol_ang))**2 * 100, 1)
        items.append({
            'topic': 'সমবর্তন, ব্রুস্টারের সূত্র ও ম্যালুসের সূত্র',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি স্বচ্ছ মাধ্যমের প্রতিসরাঙ্ক $\\mu = {mu_val}$। মাধ্যমটির সমবর্তন কোণ (Polarizing angle, $\\theta_p$) কত? সমবর্তক ও বিশ্লেষকের মধ্যবর্তী কোণ ${pol_ang}^\\circ$ হলে নির্গত আলোর তীব্রতা আপতিত তীব্রতার শতকরা কত ভাগ?",
            'modelAnswer': f"$\\theta_p = {theta_p}^\\circ$, নির্গত তীব্রতা $= {i_ratio}\\%$",
            'explanation': f"ব্রুস্টারের সূত্র: $\\tan\\theta_p = \\mu \\implies \\theta_p = \\tan^{{-1}}({mu_val}) = {theta_p}^\\circ$\nম্যালুসের সূত্র: $I = I_0 \\cos^2\\theta = I_0 \\cos^2({pol_ang}^\\circ) = {i_ratio/100:.3f} I_0 = {i_ratio}\\% I_0$",
            'primaryImage': '##PRESET:polarized-light[size:medium]##' if i in [43, 47] else None
        })

    return items


def get_chapter_08_2nd_numericals():
    """Modern Physics - 50 Numerical Problems"""
    items = []
    c = 3.0e8
    h = 6.63e-34
    e_chg = 1.6e-19
    m0_e = 9.11e-31

    # 1-15: Special Relativity (Length contraction, Time dilation, Relativistic Mass)
    v_ratios = [
        0.5, 0.6, 0.7, 0.8, 0.866, 0.9, 0.95, 0.98,
        0.4, 0.75, 0.85, 0.92, 0.96, 0.99, 0.65
    ]
    for i, v_c in enumerate(v_ratios, 1):
        gamma_inv = math.sqrt(1 - v_c**2)
        l0 = 100.0 # rest length in meters
        t0 = 10.0  # proper time in seconds
        l_contract = round(l0 * gamma_inv, 2)
        t_dilated = round(t0 / gamma_inv, 2)
        items.append({
            'topic': 'আপেক্ষিকতা: দৈর্ঘ্য সংকোচন ও কাল দীর্ঘায়ন',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি রকেটের নিশ্চল দৈর্ঘ্য ${int(l0)}\\text{{ m}}$। রকেটটি যদি ${v_c}c$ বেগে গতিশীল হয়, তবে ভূপৃষ্ঠের দর্শকের নিকট রকেটের গতিশীল দৈর্ঘ্য কত হবে এবং রকেটের ঘড়ির ${int(t0)}\\text{{ s}}$ পৃথিবীর দর্শকের নিকট কত সময় পরিলক্ষিত হবে?",
            'modelAnswer': f"দৈর্ঘ্য $L = {l_contract}\\text{{ m}}$, সময় $t = {t_dilated}\\text{{ s}}$",
            'explanation': f"দৈর্ঘ্য সংকোচন: $L = L_0 \\sqrt{{1 - v^2/c^2}} = {int(l0)} \\times \\sqrt{{1 - ({v_c})^2}} = {l_contract}\\text{{ m}}$\nকাল দীর্ঘায়ন: $t = \\frac{{t_0}}{{\\sqrt{{1 - v^2/c^2}}}} = \\frac{{{int(t0)}}}{{\\sqrt{{1 - ({v_c})^2}}}} = {t_dilated}\\text{{ s}}$",
            'primaryImage': '##PRESET:lorentz-relativity[size:medium]##' if i in [1, 5, 10] else None
        })

    # 16-25: Relativistic Kinetic Energy and Total Energy
    for i, v_c in enumerate([0.6, 0.7, 0.8, 0.85, 0.9, 0.92, 0.95, 0.98, 0.866, 0.99], 16):
        gamma = 1 / math.sqrt(1 - v_c**2)
        # Kinetic energy K = (gamma - 1) m0 c^2
        # For electron, rest energy E0 = m0 c^2 = 0.511 MeV
        e0_mev = 0.511
        k_mev = round((gamma - 1) * e0_mev, 3)
        total_e_mev = round(gamma * e0_mev, 3)
        items.append({
            'topic': 'আপেক্ষিকীয় গতিশক্তি ও ভর-শক্তি রূপান্তর',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"একটি ইলেকট্রন ${v_c}c$ বেগে গতিশীল। ইলেকট্রনের নিশ্চল ভরশক্তি $0.511\\text{{ MeV}}$ হলে এর আপেক্ষিকীয় গতিশক্তি ($K$) এবং মোট শক্তি ($E$) কত হবে?",
            'modelAnswer': f"$K = {k_mev}\\text{{ MeV}}$, $E = {total_e_mev}\\text{{ MeV}}$",
            'explanation': f"লরেন্টজ গুণক $\\gamma = \\frac{{1}}{{\\sqrt{{1 - ({v_c})^2}}}} = {gamma:.3f}$\nমোট শক্তি $E = \\gamma m_0 c^2 = {gamma:.3f} \\times 0.511 = {total_e_mev}\\text{{ MeV}}$\nগতিশক্তি $K = E - m_0 c^2 = {k_mev}\\text{{ MeV}}$",
            'primaryImage': '##PRESET:lorentz-relativity[size:medium]##' if i in [16, 21] else None
        })

    # 26-38: Photoelectric Effect (Work function, Threshold frequency, Stopping potential)
    # hf = W0 + Kmax, Kmax = eVs
    pe_params = [
        (2.0, 3000), (2.2, 2800), (2.5, 2500), (1.9, 3500), (2.3, 2600),
        (2.4, 2700), (2.1, 3200), (1.8, 4000), (2.7, 2400), (3.0, 2200),
        (2.14, 3000), (2.28, 2900), (1.95, 3300)
    ]
    for i, (w0_ev, lam_a) in enumerate(pe_params, 26):
        # photon energy E = hc / lambda in eV
        lam = lam_a * 1e-10
        e_phot_j = (h * c) / lam
        e_phot_ev = round(e_phot_j / e_chg, 2)
        k_max_ev = round(max(0.0, e_phot_ev - w0_ev), 2)
        v_stop = k_max_ev # V_s in Volts
        f0_hz = round((w0_ev * e_chg) / h / 1e14, 2) # in 10^14 Hz
        items.append({
            'topic': 'আলোকতড়িৎ ক্রিয়া ও নিবৃত্তি বিভব',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"কোনো ধাতুর কার্য-অপেক্ষক $W_0 = {w0_ev}\\text{{ eV}}$। ধাতুটির ওপর ${lam_a}\\text{{ \\AA}}$ তরঙ্গদৈর্ঘ্যের আলো আপতিত হলে নিবৃত্তি বিভব (Stopping potential, $V_s$) কত এবং সূচনা কম্পাঙ্ক ($f_0$) কত?",
            'modelAnswer': f"$V_s = {v_stop}\\text{{ V}}$, $f_0 = {f0_hz} \\times 10^{{14}}\\text{{ Hz}}$",
            'explanation': f"আপতিত ফোটনের শক্তি $E = \\frac{{hc}}{{\\lambda}} = \\frac{{6.63 \\times 10^{{-34}} \\times 3 \\times 10^8}}{{{lam:.3e} \\times 1.6 \\times 10^{{-19}}}} = {e_phot_ev}\\text{{ eV}}$\nসর্বোচ্চ গতিশক্তি $K_{{\\max}} = E - W_0 = {e_phot_ev} - {w0_ev} = {k_max_ev}\\text{{ eV}} \\implies V_s = {v_stop}\\text{{ V}}$\nসূচনা কম্পাঙ্ক $f_0 = \\frac{{W_0}}{{h}} = {f0_hz} \\times 10^{{14}}\\text{{ Hz}}$",
            'primaryImage': '##PRESET:photoelectric-effect[size:medium]##' if i in [26, 30, 35] else None
        })

    # 39-45: de Broglie Wavelength of electron and matter waves
    # lambda = h / p = h / sqrt(2 m q V)
    accel_volts = [50, 100, 150, 200, 250, 300, 500]
    for i, v_acc in enumerate(accel_volts, 39):
        # lambda = 12.27 / sqrt(V) Angstroms for electron
        lam_db_a = round(12.27 / math.sqrt(v_acc), 3)
        items.append({
            'topic': 'ডি-ব্রগলী তরঙ্গদৈর্ঘ্য',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"স্থিরাবস্থা হতে একটি ইলেকট্রনকে ${v_acc}\\text{{ V}}$ বিভব পার্থক্যের মধ্য দিয়ে ত্বরান্বিত করা হলো। এর ডি-ব্রগলী তরঙ্গদৈর্ঘ্য (de Broglie wavelength, $\\lambda$) কত হবে?",
            'modelAnswer': f"$\\lambda = {lam_db_a}\\text{{ \\AA}}$ (${round(lam_db_a * 1e-10, 13)}\\text{{ m}}$)",
            'explanation': f"ডি-ব্রগলী তরঙ্গদৈর্ঘ্য: $\\lambda = \\frac{{h}}{{\\sqrt{{2m e V}}}} = \\frac{{12.27}}{{\\sqrt{{{v_acc}}}}}\\text{{ \\AA}} = {lam_db_a}\\text{{ \\AA}}$",
            'primaryImage': '##PRESET:matter-waves[size:medium]##' if i in [39, 42] else None
        })

    # 46-50: Compton Scattering & X-ray Cutoff Wavelength
    # lambda_min = hc / eV, Delta lambda = (h / m0 c) * (1 - cos theta)
    xray_params = [
        (20, 60), (30, 90), (40, 180), (50, 45), (60, 90)
    ]
    for i, (kv_val, comp_ang) in enumerate(xray_params, 46):
        v_pot = kv_val * 1000
        lam_min_a = round((h * c) / (e_chg * v_pot) * 1e10, 4)
        # Compton shift: lambda_c = 0.0243 Angstroms
        del_lam_a = round(0.0243 * (1 - math.cos(math.radians(comp_ang))), 4)
        items.append({
            'topic': 'রন্টজেন রশ্মি (X-ray) ও কম্পটন ক্রিয়া',
            'difficulty': 'HARD',
            'marks': 2,
            'questionText': f"একটি কুলিজ নলে ${kv_val}\\text{{ kV}}$ বিভব প্রযুক্ত থাকলে উৎপন্ন এক্স-রে এর ন্যূনতম তরঙ্গদৈর্ঘ্য (Cutoff wavelength, $\\lambda_{{\\min}}$) কত? ফোটন ${comp_ang}^\\circ$ কোণে বিক্ষিপ্ত হলে কম্পটন সরণ (Compton shift, $\\Delta\\lambda$) কত?",
            'modelAnswer': f"$\\lambda_{{\\min}} = {lam_min_a}\\text{{ \\AA}}$, $\\Delta\\lambda = {del_lam_a}\\text{{ \\AA}}$",
            'explanation': f"ন্যূনতম তরঙ্গদৈর্ঘ্য $\\lambda_{{\\min}} = \\frac{{hc}}{{eV}} = \\frac{{6.63 \\times 10^{{-34}} \\times 3 \\times 10^8}}{{1.6 \\times 10^{{-19}} \\times {v_pot}}} = {lam_min_a}\\text{{ \\AA}}$\nকম্পটন সরণ $\\Delta\\lambda = \\frac{{h}}{{m_0 c}}(1 - \\cos\\theta) = 0.0243(1 - \\cos {comp_ang}^\\circ) = {del_lam_a}\\text{{ \\AA}}$",
            'primaryImage': '##PRESET:xray-tube[size:medium]##' if i in [46, 49] else None
        })

    return items


def get_chapter_09_2nd_numericals():
    """Atomic & Nuclear Physics - 50 Numerical Problems"""
    items = []
    r_h = 1.097e7 # m^-1 Rydberg constant

    # 1-15: Bohr Orbit radius, velocity and energy levels
    # rn = n^2 * r1 (r1 = 0.53 A), En = -13.6 / n^2 eV
    for i, n_val in enumerate([1, 2, 3, 4, 5, 2, 3, 4, 1, 3, 2, 4, 5, 3, 2], 1):
        r_n_a = round(n_val**2 * 0.53, 2)
        e_n_ev = round(-13.6 / (n_val**2), 2)
        v_n_kms = round((2.18e6 / n_val) / 1000, 1) # km/s
        items.append({
            'topic': 'বোর পরমাণু মডেল: কক্ষপথের ব্যাসার্ধ ও শক্তি',
            'difficulty': 'EASY' if i <= 7 else 'MEDIUM',
            'marks': 2,
            'questionText': f"হাইড্রোজেন পরমাণুর বোর মডেল অনুসারে $n = {n_val}$ তম কক্ষপথের ব্যাসার্ধ ($r_{n_val}$), শক্তি ($E_{n_val}$) এবং ইলেকট্রনের বেগ ($v$) নির্ণয় কর। (দেওয়া আছে, ১ম কক্ষপথের ব্যাসার্ধ $r_1 = 0.53\\text{{ \\AA}}$)",
            'modelAnswer': f"$r_{n_val} = {r_n_a}\\text{{ \\AA}}$, $E_{n_val} = {e_n_ev}\\text{{ eV}}$, $v = {v_n_kms}\\text{{ km/s}}$",
            'explanation': f"কক্ষপথের ব্যাসার্ধ $r_n = n^2 r_1 = ({n_val})^2 \\times 0.53 = {r_n_a}\\text{{ \\AA}}$\nকক্ষপথের শক্তি $E_n = -\\frac{{13.6}}{{n^2}}\\text{{ eV}} = -\\frac{{13.6}}{{{n_val**2}}} = {e_n_ev}\\text{{ eV}}$\nবেগ $v_n = \\frac{{v_1}}{{n}} = {v_n_kms}\\text{{ km/s}}$",
            'primaryImage': '##PRESET:bohr-atom[size:medium]##' if i in [1, 5, 10] else None
        })

    # 16-28: Hydrogen Spectral Series (Lyman, Balmer, Paschen)
    # 1 / lambda = R_H * (1/n1^2 - 1/n2^2)
    spec_transitions = [
        (1, 2, "লাইম্যান (Lyman)"), (1, 3, "লাইম্যান (Lyman)"), (1, 4, "লাইম্যান (Lyman)"),
        (2, 3, "বামার (Balmer)"), (2, 4, "বামার (Balmer)"), (2, 5, "বামার (Balmer)"),
        (2, 6, "বামার (Balmer)"), (3, 4, "প্যাশ্চেন (Paschen)"), (3, 5, "প্যাশ্চেন (Paschen)"),
        (1, 999, "লাইম্যান প্রান্তিক"), (2, 999, "বামার প্রান্তিক"), (3, 999, "প্যাশ্চেন প্রান্তিক"),
        (2, 4, "বামার $H_\\beta$")
    ]
    for i, (n1, n2, ser_name) in enumerate(spec_transitions, 16):
        if n2 > 100:
            inv_lam = r_h * (1.0 / (n1**2))
            trans_str = f"অসীম ($n=\\infty$) হতে $n={n1}$"
            n2_denom = "\\infty"
        else:
            inv_lam = r_h * (1.0 / (n1**2) - 1.0 / (n2**2))
            trans_str = f"$n={n2}$ হতে $n={n1}$"
            n2_denom = f"{n2}^2"
        lam_nm = round((1.0 / inv_lam) * 1e9, 1)
        items.append({
            'topic': 'হাইড্রোজেন বর্ণালী রেখার তরঙ্গদৈর্ঘ্য',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"হাইড্রোজেন পরমাণুর একটি ইলেকট্রন {trans_str} স্তরে সংক্রমিত হলে নিঃসৃত ফোটনের তরঙ্গদৈর্ঘ্য ({ser_name} সিরিজ) কত হবে?",
            'modelAnswer': f"$\\lambda = {lam_nm}\\text{{ nm}}$ (${round(lam_nm * 10, 1)}\\text{{ \\AA}}$)",
            'explanation': f"রিডবার্গ সমীকরণ: $\\frac{{1}}{{\\lambda}} = R_H \\left(\\frac{{1}}{{n_1^2}} - \\frac{{1}}{{n_2^2}}\\right)$\n$\\frac{{1}}{{\\lambda}} = 1.097 \\times 10^7 \\times \\left(\\frac{{1}}{{{n1}^2}} - \\frac{{1}}{{{n2_denom}}}\\right) \\implies \\lambda = {lam_nm}\\text{{ nm}}$",
            'primaryImage': '##PRESET:energy-levels[size:medium]##' if i in [16, 20] else None
        })

    # 29-40: Mass Defect & Binding Energy
    # delta_m in u, E_b = delta_m * 931.5 MeV
    nuclei_params = [
        (2, 4, 4.0015, "হিলিয়াম ($^4_2\\text{He}$)"),
        (3, 7, 7.01436, "লিথিয়াম ($^7_3\\text{Li}$)"),
        (6, 12, 11.9967, "কার্বন ($^{12}_6\\text{C}$)"),
        (8, 16, 15.9905, "অক্সিজেন ($^{16}_8\\text{O}$)"),
        (7, 14, 13.9992, "নাইট্রোজেন ($^{14}_7\\text{N}$)"),
        (13, 27, 26.9744, "অ্যালুমিনিয়াম ($^{27}_{13}\\text{Al}$)"),
        (26, 56, 55.9206, "লোহা ($^{56}_{26}\\text{Fe}$)"),
        (92, 235, 234.993, "ইউরেনিয়াম ($^{235}_{92}\\text{U}$)"),
        (1, 2, 2.0135, "ডিউটেরিয়াম ($^2_1\\text{H}$)"),
        (1, 3, 3.0155, "ট্রিটিয়াম ($^3_1\\text{H}$)"),
        (4, 9, 9.0099, "বেরিলিয়াম ($^9_4\\text{Be}$)"),
        (92, 238, 238.000, "ইউরেনিয়াম ($^{238}_{92}\\text{U}$)")
    ]
    m_p = 1.007276 # u
    m_n = 1.008665 # u
    for i, (z_num, a_num, m_nuc, name_nuc) in enumerate(nuclei_params, 29):
        del_m = round((z_num * m_p + (a_num - z_num) * m_n - m_nuc), 5)
        eb_mev = round(del_m * 931.5, 2)
        eb_per_nuc = round(eb_mev / a_num, 2)
        items.append({
            'topic': 'ভর ত্রুটি ও বন্ধন শক্তি',
            'difficulty': 'MEDIUM' if i <= 35 else 'HARD',
            'marks': 3,
            'questionText': f"{name_nuc} নিউক্লিয়াসের প্রকৃত ভর ${m_nuc}\\text{{ u}}$। প্রোটন ও নিউট্রনের ভর যথাক্রমে ${m_p}\\text{{ u}}$ ও ${m_n}\\text{{ u}}$ হলে, নিউক্লিয়াসটির ভর ত্রুটি ($\\Delta m$), মোট বন্ধন শক্তি ($E_b$) এবং প্রতি নিউক্লিয়নে বন্ধন শক্তি নির্ণয় কর।",
            'modelAnswer': f"$\\Delta m = {del_m}\\text{{ u}}$, $E_b = {eb_mev}\\text{{ MeV}}$, প্রতি নিউক্লিয়নে $= {eb_per_nuc}\\text{{ MeV/nucleon}}$",
            'explanation': f"ভর ত্রুটি: $\\Delta m = [Z m_p + (A-Z) m_n] - M = [{z_num} \\times {m_p} + {a_num-z_num} \\times {m_n}] - {m_nuc} = {del_m}\\text{{ u}}$\nমোট বন্ধন শক্তি: $E_b = \\Delta m \\times 931.5\\text{{ MeV}} = {del_m} \\times 931.5 = {eb_mev}\\text{{ MeV}}$\nপ্রতি নিউক্লিয়নে বন্ধন শক্তি: $\\frac{{E_b}}{{A}} = \\frac{{{eb_mev}}}{{{a_num}}} = {eb_per_nuc}\\text{{ MeV}}$",
            'primaryImage': '##PRESET:nuclear-binding-curve[size:medium]##' if i in [29, 35] else None
        })

    # 41-50: Radioactive Decay Law (Half-life, Decay constant, Mean life, Remaining fraction)
    # T_1/2 = 0.693 / lambda, N = N0 e^(-lambda * t)
    decay_params = [
        (1600, 3200, "রেডিয়াম"), (3.82, 11.46, "রেডন"), (5730, 11460, "কার্বন-১৪"),
        (28, 56, "স্ট্রনসিয়াম-৯০"), (30, 90, "সিজিয়াম-১৩৭"), (5.27, 10.54, "কোবাল্ট-৬০"),
        (140, 420, "পোলোনিয়াম-২১০"), (24.1, 72.3, "থোরিয়াম-২৩৪"),
        (10, 20, "আইসোটোপ-A"), (15, 45, "আইসোটোপ-B")
    ]
    for i, (t_half, t_elapsed, iso_name) in enumerate(decay_params, 41):
        lam_val = round(0.693 / t_half, 5)
        n_half_lives = t_elapsed / t_half
        frac_remain = round((0.5 ** n_half_lives) * 100, 2)
        mean_life = round(1.443 * t_half, 2)
        items.append({
            'topic': 'তেজস্ক্রিয় ক্ষয় সূত্র, অর্ধায়ু ও গড় আয়ু',
            'difficulty': 'MEDIUM',
            'marks': 2,
            'questionText': f"{iso_name}-এর অর্ধায়ু ($T_{{1/2}}$) ${t_half}\\text{{ বছর/দিন}}$। এর ক্ষয় ধ্রুবক ($\\lambda$) এবং গড় আয়ু ($\\tau$) কত? ${t_elapsed}\\text{{ বছর/দিন}}$ পর এর আদি পরমাণুর শতকরা কত ভাগ অবশিষ্ট থাকবে?",
            'modelAnswer': f"$\\lambda = {lam_val}\\text{{ yr}}^{{-1}}$, $\\tau = {mean_life}\\text{{ yr}}$, অবশিষ্ট $= {frac_remain}\\%$",
            'explanation': f"ক্ষয় ধ্রুবক: $\\lambda = \\frac{{0.693}}{{T_{{1/2}}}} = \\frac{{0.693}}{{{t_half}}} = {lam_val}$\nগড় আয়ু: $\\tau = 1.443 \\times T_{{1/2}} = {mean_life}$\nঅর্ধায়ুর সংখ্যা $n = \\frac{{t}}{{T_{{1/2}}}} = \\frac{{{t_elapsed}}}{{{t_half}}} = {n_half_lives:.1f}$\nঅবশিষ্ট পরিমাণ: $\\frac{{N}}{{N_0}} = \\left(\\frac{{1}}{{2}}\\right)^n = ({0.5})^{{{n_half_lives:.1f}}} = {frac_remain}\\%$",
            'primaryImage': '##PRESET:decay-curve[size:medium]##' if i in [41, 46] else None
        })

    return items
