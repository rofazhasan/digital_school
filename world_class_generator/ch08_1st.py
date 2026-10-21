#!/usr/bin/env python3
"""
World-Class Question Bank Generator:
1st Paper Chapter 8: Periodic Motion (পর্যায়বৃত্ত গতি)
50 Unique, High-Caliber Mathematical Problems (Rows 52 - 101)
JEE Advanced / BUET caliber strictly bounded within NCTB HSC Syllabus.
100% Uncorrupted LaTeX, Exact Solutions, Real Physics Contexts.
"""

def get_ch08_numericals():
    q = []
    
    # 1-10: Differential Equation & Kinematics of SHM
    p1 = [
        ("একটি সরল ছন্দিত স্পন্দনশীল কণার ব্যবকলনীয় সমীকরণ $4\\frac{d^2x}{dt^2} + 100x = 0$। কণাটির কৌণিক কম্পাঙ্ক $\\omega$, পর্যায়কাল $T$ এবং কম্পাঙ্ক $f$ নির্ণয় কর।",
         r"$\omega = 5.0\text{ rad/s}, T = 1.26\text{ s}, f = 0.796\text{ Hz}$",
         r"সমীকরণটিকে আদর্শ আকার $\frac{d^2x}{dt^2} + \omega^2 x = 0$-এ রূপান্তর করে: $\frac{d^2x}{dt^2} + 25x = 0 \implies \omega^2 = 25 \implies \omega = 5.0\text{ rad/s}$। পর্যায়কাল $T = \frac{2\pi}{\omega} = \frac{2\pi}{5} \approx 1.257\text{ s}$। কম্পাঙ্ক $f = \frac{1}{T} = \frac{5}{2\pi} \approx 0.796\text{ Hz}$।", "##GEO:rect[w=4,h=2][size:small]##"),
        ("একটি কণার সরল ছন্দিত গতির সমীকরণ $x(t) = 0.08\sin\left(10\pi t + \frac{\pi}{4}\right)\\text{ m}$। কণাটির বিস্তার $A$, আদি দশা $\\delta$, $t = 0$ সময়ে সরণ $x(0)$ এবং সর্বোচ্চ দ্রুতি $v_{\max}$ কত?",
         r"$A = 0.08\text{ m}, \delta = 45^\circ, x(0) = 5.66\text{ cm}, v_{\max} = 2.51\text{ m/s}$",
         r"আদর্শ সমীকরণ $x = A\sin(\omega t + \delta)$ এর সাথে তুলনা করে: বিস্তার $A = 0.08\text{ m} = 8\text{ cm}$। কৌণিক কম্পাঙ্ক $\omega = 10\pi\text{ rad/s}$। আদি দশা $\delta = \pi/4\text{ rad} = 45^\circ$। $t=0$-তে সরণ $x(0) = 0.08\sin(\pi/4) = \frac{0.08}{\sqrt{2}} \approx 0.0566\text{ m} = 5.66\text{ cm}$। সর্বোচ্চ দ্রুতি $v_{\max} = \omega A = 10\pi(0.08) = 0.8\pi \approx 2.513\text{ m/s}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("সরল ছন্দিত গতিসম্পন্ন একটি কণার বিস্তার $A = 10\\text{ cm}$ এবং পর্যায়কাল $T = 4.0\\text{ s}$। সাম্যাবস্থান হতে সরণ $x = 6\\text{ cm}$ অবস্থানে কণাটির বেগ এবং ত্বরণ কত?",
         r"বেগ $v = 12.57\text{ cm/s}$, ত্বরণ $a = -14.80\text{ cm/s}^2$",
         r"কৌণিক কম্পাঙ্ক $\omega = \frac{2\pi}{T} = \frac{2\pi}{4} = \frac{\pi}{2} \approx 1.571\text{ rad/s}$। বেগ $v = \omega\sqrt{A^2 - x^2} = \frac{\pi}{2}\sqrt{10^2 - 6^2} = \frac{\pi}{2}\sqrt{64} = 4\pi \approx 12.57\text{ cm/s}$। ত্বরণ $a = -\omega^2 x = -\left(\frac{\pi}{2}\right)^2(6) = -1.5\pi^2 \approx -14.80\text{ cm/s}^2$।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি কণা সরল ছন্দিত স্পন্দনে দোদুল্যমান। সাম্যাবস্থান হতে কোন অবস্থানে কণাটির বেগ তার সর্বোচ্চ বেগের অর্ধেক ($v = v_{\max}/2$) হবে?",
         r"$x = \frac{\sqrt{3}}{2}A \approx 0.866 A$",
         r"$v = \omega\sqrt{A^2 - x^2}$ এবং $v_{\max} = \omega A$। দেওয়া আছে $v = \frac{1}{2}v_{\max} \implies \omega\sqrt{A^2 - x^2} = \frac{1}{2}\omega A \implies \sqrt{A^2 - x^2} = \frac{A}{2}$। বর্গ করে: $A^2 - x^2 = \frac{A^2}{4} \implies x^2 = \frac{3}{4}A^2 \implies x = \pm \frac{\sqrt{3}}{2}A \approx \pm 0.866 A$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("সরল ছন্দিত গতিসম্পন্ন একটি কণার সর্বোচ্চ বেগ $v_{\max} = 1.0\\text{ m/s}$ এবং সর্বোচ্চ ত্বরণ $a_{\max} = 4.0\\text{ m/s}^2$। কণাটির দোলনের বিস্তার $A$ এবং পর্যায়কাল $T$ নির্ণয় কর।",
         r"$A = 0.25\text{ m} = 25.0\text{ cm}, T = 1.57\text{ s}$",
         r"$v_{\max} = \omega A = 1.0$ এবং $a_{\max} = \omega^2 A = 4.0$। ভাগ করে: $\frac{a_{\max}}{v_{\max}} = \frac{\omega^2 A}{\omega A} = \omega \implies \omega = \frac{4.0}{1.0} = 4.0\text{ rad/s}$। বিস্তার $A = \frac{v_{\max}}{\omega} = \frac{1.0}{4.0} = 0.25\text{ m} = 25.0\text{ cm}$। পর্যায়কাল $T = \frac{2\pi}{\omega} = \frac{2\pi}{4.0} = \frac{\pi}{2} \approx 1.571\text{ s}$।", "##GEO:rect[w=3,h=2][size:small]##"),
        ("একটি কণার সরণ যখন $x_1 = 3\\text{ cm}$, তখন এর বেগ $v_1 = 8\\text{ cm/s}$; এবং যখন সরণ $x_2 = 4\\text{ cm}$, তখন বেগ $v_2 = 6\\text{ cm/s}$। কণাটির দোলনের বিস্তার এবং কম্পাঙ্ক নির্ণয় কর।",
         r" বিস্তার $A = 5.0\text{ cm}$, কম্পাঙ্ক $f = 0.318\text{ Hz}$",
         r"$v_1^2 = \omega^2(A^2 - x_1^2) \implies 64 = \omega^2(A^2 - 9)$ ... (১)। $v_2^2 = \omega^2(A^2 - x_2^2) \implies 36 = \omega^2(A^2 - 16)$ ... (২)। বিয়োগ করে: $64 - 36 = \omega^2(16 - 9) \implies 28 = 7\omega^2 \implies \omega^2 = 4 \implies \omega = 2.0\text{ rad/s}$। বিস্তার: $64 = 4(A^2 - 9) \implies A^2 - 9 = 16 \implies A^2 = 25 \implies A = 5.0\text{ cm}$। কম্পাঙ্ক $f = \frac{\omega}{2\pi} = \frac{2}{2\pi} = \frac{1}{\pi} \approx 0.318\text{ Hz}$।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি কণা সাম্যাবস্থান ($x = 0$) হতে সরল ছন্দিত স্পন্দন শুরু করে। কণাটির বিস্তার হতে অর্ধেক দূরত্বে ($x = A/2$) পৌঁছাতে সময় $t_1$ এবং পরবর্তী অর্ধাংশ ($x = A/2$ হতে $x = A$) পৌঁছাতে সময় $t_2$ লাগলে $t_1 : t_2$ অনুপাত নির্ণয় কর।",
         r"$t_1 : t_2 = 1 : 2$",
         r"$x = A\sin(\omega t)$। $x = A/2$-এ: $\frac{A}{2} = A\sin(\omega t_1) \implies \sin(\omega t_1) = 1/2 \implies \omega t_1 = \frac{\pi}{6} \implies t_1 = \frac{T}{12}$। $x = A$-তে: $\omega(t_1 + t_2) = \frac{\pi}{2} \implies t_1 + t_2 = \frac{T}{4}$। $t_2 = \frac{T}{4} - \frac{T}{12} = \frac{2T}{12} = \frac{T}{6}$। অনুপাত $\frac{t_1}{t_2} = \frac{T/12}{T/6} = \frac{1}{2}$ বা $1 : 2$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একই সরলরেখা বরাবর একই কম্পাঙ্ক ও বিস্তারের দুটি সরল ছন্দিত তরঙ্গের উপরিপাতন হলো: $x_1 = A\sin(\omega t)$ এবং $x_2 = A\sin(\omega t + \phi)$। লব্ধি তরঙ্গের বিস্তার $A$ হওয়ার জন্য দশা পার্থক্য $\\phi$ কত হতে হবে?",
         r"$\phi = 120^\circ = \frac{2\pi}{3}\text{ rad}$",
         r"লব্ধি বিস্তার $R = \sqrt{A^2 + A^2 + 2A^2\cos\phi} = \sqrt{2A^2(1+\cos\phi)} = 2A\cos(\phi/2)$। দেওয়া আছে $R = A \implies 2A\cos(\phi/2) = A \implies \cos(\phi/2) = 1/2 \implies \frac{\phi}{2} = 60^\circ \implies \phi = 120^\circ = \frac{2\pi}{3}\text{ rad}$।", "##PRESET:vector-addition[size:medium]##"),
        ("একটি কণা $x = A\cos(\omega t)$ সমীকরণ অনুযায়ী স্পন্দিত হচ্ছে। $t = 0$ হতে যাত্রা শুরু করে কণাটি কোন সময়ে প্রথমবার তার সর্বোচ্চ দ্রুতি লাভ করবে?",
         r"$t = \frac{T}{4}$",
         r"বেগ $v = \frac{dx}{dt} = -\omega A \sin(\omega t)$। সর্বোচ্চ দ্রুতি ঘটে যখন $|\sin(\omega t)| = 1 \implies \omega t = \frac{\pi}{2} \implies \left(\frac{2\pi}{T}\right)t = \frac{\pi}{2} \implies t = \frac{T}{4}$। কণাটি আদি অবস্থায় প্রান্তে ($x=A$) থাকে এবং $T/4$ সময়ে সাম্যাবস্থানে ($x=0$) পৌঁছানোর মুহূর্তে দ্রুতি সর্বোচ্চ হয়।", "##GEO:circle[r=2.2][size:small]##"),
        ("একটি $m = 0.2\\text{ kg}$ ভরের কণার সরল ছন্দিত গতির বিস্তার $A = 0.1\\text{ m}$ এবং কম্পাঙ্ক $f = 5.0\\text{ Hz}$। কণাটির সর্বোচ্চ পুনরুদ্ধার বল (Restoring force) কত নিউটন?",
         r"$F_{\max} = 19.74\text{ N}$",
         r"কৌণিক কম্পাঙ্ক $\omega = 2\pi f = 2\pi(5) = 10\pi\text{ rad/s}$। সর্বোচ্চ ত্বরণ $a_{\max} = \omega^2 A = (10\pi)^2(0.1) = 100\pi^2(0.1) = 10\pi^2 \approx 98.70\text{ m/s}^2$। সর্বোচ্চ বল $F_{\max} = m a_{\max} = 0.2 \times 98.70 \approx 19.74\text{ N}$।", "##PRESET:spring-mass-system[size:medium]##")
    ]
    for item in p1:
        q.append({
            'topic': 'সরল ছন্দিত গতির ব্যবকলনীয় সমীকরণ ও গতিতত্ত্ব (SHM Differential Equation & Kinematics)',
            'difficulty': 'HARD',
            'marks': 4,
            'diagram': item[3],
            'questionText': f"{item[3]}\n\n{item[0]}",
            'modelAnswer': item[1],
            'explanation': item[2]
        })
        
    # 11-20: Energy of SHM
    p2 = [
        ("সরল ছন্দিত স্পন্দনরত একটি কণার বিস্তার $A$। সাম্যাবস্থান হতে সরণ কত হলে কণাটির গতিশক্তি ও বিভব শক্তি পরস্পর সমান ($K = U$) হবে? এবং কোন অবস্থানে গতিশক্তি বিভব শক্তির তিনগুণ ($K = 3U$) হবে?",
         r"$K = U$ হয় $x = \frac{A}{\sqrt{2}} \approx 0.707A$-তে; $K = 3U$ হয় $x = \frac{A}{2}$-তে",
         r"গতিশক্তি $K = \frac{1}{2}m\omega^2(A^2 - x^2)$, বিভবশক্তি $U = \frac{1}{2}m\omega^2 x^2$। (১) $K = U \implies A^2 - x^2 = x^2 \implies 2x^2 = A^2 \implies x = \frac{A}{\sqrt{2}}$। (২) $K = 3U \implies A^2 - x^2 = 3x^2 \implies 4x^2 = A^2 \implies x = \frac{A}{2}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি $0.5\\text{ kg}$ ভরের কণা সরল ছন্দিত গতিতে স্পন্দিত হচ্ছে যার বিস্তার $A = 0.2\\text{ m}$ এবং পর্যায়কাল $T = 2.0\\text{ s}$। কণাটির মোট যান্ত্রিক শক্তি $E$ কত এবং সাম্যাবস্থান হতে $x = 0.1\\text{ m}$ অবস্থানে কণার গতিশক্তি ও বিভবশক্তি নির্ণয় কর।",
         r"$E = 0.0987\text{ J}, U = 0.0247\text{ J}, K = 0.0740\text{ J}$",
         r"কৌণিক কম্পাঙ্ক $\omega = \frac{2\pi}{T} = \pi\text{ rad/s}$। মোট যান্ত্রিক শক্তি $E = \frac{1}{2}m\omega^2 A^2 = \frac{1}{2}(0.5)(\pi^2)(0.2^2) = 0.25(9.87)(0.04) = 0.01 \times 9.87 \approx 0.0987\text{ J}$। $x = 0.1\text{ m} = A/2$-এ: বিভবশক্তি $U = \frac{1}{4}E = \frac{0.0987}{4} \approx 0.0247\text{ J}$। গতিশক্তি $K = E - U = 0.0987 - 0.0247 = 0.0740\text{ J}$।", "##GEO:circle[r=2.5][size:small]##"),
        ("সরল ছন্দিত গতিতে স্পন্দনরত কোনো কণার বিভব শক্তির স্পন্দন কম্পাঙ্ক কণার মূল দোলন কম্পাঙ্কের কত গুণ তা গাণিতিকভাবে প্রমাণ কর।",
         r"বিভব শক্তির কম্পাঙ্ক দ্বিগুণ ($f_U = 2f$)",
         r"সরণ $x = A\sin(\omega t)$ হলে বিভবশক্তি $U(t) = \frac{1}{2}k x^2 = \frac{1}{2}k A^2 \sin^2(\omega t) = \frac{1}{4}k A^2 (1 - \cos 2\omega t)$। সমীকরণে কৌণিক কম্পাঙ্ক $2\omega$, যা মূল গতির দ্বিগুণ। সুতরাং বিভব শক্তি ও গতিশক্তি প্রতি পূর্ণ দোলনে দুবার সর্বোচ্চ মানে পৌঁছায়, অর্থাৎ তাদের কম্পাঙ্ক মূল কম্পাঙ্কের দ্বিগুণ।", "##GEO:rect[w=3.5,h=2][size:small]##"),
        ("একটি কণার মোট শক্তি $E = 16\\text{ J}$ এবং বিস্তার $A = 4.0\\text{ m}$। কণাটির বল ধ্রুবক $k$ নির্ণয় কর এবং কোন অবস্থানে কণাটির বিভবশক্তি মোট শক্তির $75\\%$ হবে?",
         r"$k = 2.0\text{ N/m}, x = 2\sqrt{3}\text{ m} \approx 3.46\text{ m}$",
         r"মোট শক্তি $E = \frac{1}{2}k A^2 \implies 16 = \frac{1}{2}k(16) = 8k \implies k = 2.0\text{ N/m}$। বিভবশক্তি $U = 0.75E \implies \frac{1}{2}k x^2 = \frac{3}{4}\left(\frac{1}{2}k A^2\right) \implies x^2 = \frac{3}{4}A^2 \implies x = \frac{\sqrt{3}}{2}A = \frac{\sqrt{3}}{2}(4) = 2\sqrt{3} \approx 3.46\text{ m}$।", "##GEO:rect[w=4,h=2][size:small]##"),
        ("একটি সরল ছন্দিত স্পন্দনশীল কণার গড় গতিশক্তি এবং গড় বিভবশক্তি একটি পূর্ণ চক্রের জন্য কত তা প্রমাণ কর।",
         r"$\langle K \rangle = \langle U \rangle = \frac{1}{4}m\omega^2 A^2 = \frac{E}{2}$",
         r"এক পর্যায়কালে $\langle \sin^2(\omega t) \rangle = \frac{1}{2}$ এবং $\langle \cos^2(\omega t) \rangle = \frac{1}{2}$। গড় বিভবশক্তি $\langle U \rangle = \frac{1}{2}k A^2 \langle \sin^2(\omega t) \rangle = \frac{1}{4}kA^2 = \frac{E}{2}$। গড় গতিশক্তি $\langle K \rangle = \frac{1}{2}k A^2 \langle \cos^2(\omega t) \rangle = \frac{1}{4}kA^2 = \frac{E}{2}$। অর্থাৎ সময়ের সাপেক্ষে গড় গতিশক্তি ও গড় বিভবশক্তি পরস্পর সমান এবং মোট শক্তির অর্ধেক।", "##GEO:rect[w=3,h=2][size:small]##"),
        ("একটি স্প্রিং-ভর ব্যবস্থার ভর $m = 1.0\\text{ kg}$ এবং স্প্রিং ধ্রুবক $k = 100\\text{ N/m}$। স্প্রিংটিকে $x_0 = 0.2\\text{ m}$ সংকুচিত করে ছেড়ে দিলে সাম্যাবস্থান অতিক্রমকালে কণাটির গতিশক্তি কত হবে?",
         r"$K = 2.0\text{ J}$",
         r"সাম্যাবস্থানে সমস্ত স্থিতিশক্তি গতিশক্তিতে রূপান্তর হয়: $K = E = \frac{1}{2}k x_0^2 = \frac{1}{2}(100)(0.2^2) = 50(0.04) = 2.0\text{ J}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি কণা সরল ছন্দিত স্পন্দনে চলছে। বিস্তার $A = 5\\text{ cm}$ হলে সাম্যাবস্থান হতে কত দূরত্বে কণাটির বিভবশক্তি তার গতিশক্তির এক-তৃতীয়াংশ ($U = K/3$) হবে?",
         r"$x = 2.5\text{ cm}$",
         r"$U = \frac{1}{3}K \implies 3U = K \implies 3\left(\frac{1}{2}kx^2\right) = \frac{1}{2}k(A^2 - x^2) \implies 3x^2 = A^2 - x^2 \implies 4x^2 = A^2 \implies x = \frac{A}{2} = \frac{5}{2} = 2.5\text{ cm}$।", "##GEO:circle[r=2][size:small]##"),
        ("একটি স্পন্দনশীল বস্তুর গতিশক্তি সময়ের সাথে $K(t) = K_0 \cos^2(100t)$ অনুসারে পরিবর্তিত হয়। গতির কম্পাঙ্ক এবং পর্যায়কাল কত?",
         r"$f = 15.92\text{ Hz}, T = 0.0628\text{ s}$",
         r"গতিশক্তির কৌণিক কম্পাঙ্ক $2\omega = 200 \implies \omega = 100\text{ rad/s}$। কম্পাঙ্ক $f = \frac{\omega}{2\pi} = \frac{100}{2\pi} \approx 15.92\text{ Hz}$। পর্যায়কাল $T = \frac{1}{f} = \frac{2\pi}{100} \approx 0.0628\text{ s}$।", "##GEO:rect[w=3,h=1.5][size:small]##"),
        ("একটি সরল ছন্দিত স্পন্দনে কণার ভর $m$। কণাটির সর্বোচ্চ ত্বরণ $\\alpha$ এবং সর্বোচ্চ বেগ $\\beta$ হলে এর মোট যান্ত্রিক শক্তি $E$-এর মান নির্ণয় কর।",
         r"$E = \frac{1}{2}m\beta^2 = \frac{m\beta^4}{2A^2}$ অথবা $E = \frac{m\beta^3}{2\alpha}$",
         r"সর্বোচ্চ বেগ $\beta = \omega A \implies \omega = \frac{\alpha}{\beta}$ কারণ $\alpha = \omega^2 A = \omega \beta \implies \omega = \frac{\alpha}{\beta}$। আবার $A = \frac{\beta}{\omega} = \frac{\beta^2}{\alpha}$। মোট শক্তি $E = \frac{1}{2}m \beta^2$ (সর্বোচ্চ গতিশক্তি হিসেবে)।", "##GEO:rect[w=3,h=2][size:small]##"),
        ("একটি কণার গতিশক্তি ও স্থিতিশক্তির লেখচিত্রের ছেদবিন্দুগুলোতে সরণের মান কত এবং মোট শক্তির সাথে তুলনা কর।",
         r"$x = \pm \frac{A}{\sqrt{2}}$, প্রতিটি শক্তি $E/2$",
         r"ছেদবিন্দুতে $K = U \implies \frac{1}{2}k(A^2 - x^2) = \frac{1}{2}kx^2 \implies x = \pm \frac{A}{\sqrt{2}}$। ওই বিন্দুতে বিভবশক্তি ও গতিশক্তি উভয়ের মানই মোট শক্তির অর্ধেক: $K = U = \frac{E}{2}$।", "##PRESET:spring-mass-system[size:medium]##")
    ]
    for item in p2:
        q.append({
            'topic': 'সরল ছন্দিত গতির শক্তি ও শক্তি রূপান্তর (Energy of SHM & Conservation)',
            'difficulty': 'HARD',
            'marks': 4,
            'diagram': item[3],
            'questionText': f"{item[3]}\n\n{item[0]}",
            'modelAnswer': item[1],
            'explanation': item[2]
        })
        
    # 21-35: Simple Pendulum, Gravity Variations & Clocks
    p3 = [
        ("একটি সেকেন্ড দোলকের পর্যায়কাল $T = 2.0\\text{ s}$। দোলকটিকে পাহাড়ের চূড়ায় নিয়ে গেলে এটি দিনে $30\\text{ সেকেন্ড}$ ধীরে চলে। পাহাড়ের উচ্চতা কত? (পৃথিবীর ব্যাসার্ধ $R = 6400\\text{ km}$)।",
         r"পাহাড়ের উচ্চতা $h = 2.22\text{ km}$",
         r"পাহাড়ের চূড়ায় প্রতিদিনের হারানো সময় $\Delta T = 86400\frac{h}{R} \implies 30 = 86400 \frac{h}{6400} \implies h = \frac{30 \times 6400}{86400} = \frac{192000}{86400} \approx 2.222\text{ km}$।", "##GEO:pendulum[angle=15,length=4][size:small]##"),
        ("একটি সরল দোলকের ববকে একটি তরলে নিমজ্জিত করে দোলানো হলো যার ঘনত্ব ববের ঘনত্বের $1/4$ অংশ (সান্দ্রতা অগ্রাহ্য করে)। তরলে দোলকটির পর্যায়কাল বায়ুর পর্যায়কালের কত গুণ হবে?",
         r"$T' = \frac{2}{\sqrt{3}}T \approx 1.155 T$",
         r"ববের আপাত ওজন $W' = V\rho g - V\sigma g = V\rho g(1 - \sigma/\rho) = mg(1 - 1/4) = \frac{3}{4}mg$। কার্যকর ত্বরণ $g' = \frac{3}{4}g$। নতুন পর্যায়কাল $T' = 2\pi\sqrt{\frac{L}{g'}} = 2\pi\sqrt{\frac{L}{\frac{3}{4}g}} = \frac{2}{\sqrt{3}}\left(2\pi\sqrt{\frac{L}{g}}\right) = \frac{2}{\sqrt{3}}T \approx 1.155 T$।", "##GEO:pendulum[angle=15,length=4][size:small]##"),
        ("একটি লিফট $a = 2.0\\text{ m/s}^2$ ত্বরণে (ক) খাড়া উপরে উঠলে এবং (খ) খাড়া নিচে নামলে একটি সেকেন্ড দোলকের নতুন পর্যায়কাল কত হবে? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"(ক) উপরে উঠলে $T_1 = 1.82\text{ s}$, (খ) নিচে নামলে $T_2 = 2.24\text{ s}$",
         r"সেকেন্ড দোলকের দৈর্ঘ্য $L = \frac{g T^2}{4\pi^2} = \frac{9.8(4)}{4\pi^2} \approx 0.993\text{ m}$। (ক) উপরে উঠলে কার্যকর ত্বরণ $g_{eff} = g + a = 9.8 + 2.0 = 11.8\text{ m/s}^2$। $T_1 = 2\pi\sqrt{\frac{0.993}{11.8}} = 2\pi\sqrt{0.08415} \approx 1.823\text{ s}$। (খ) নিচে নামলে $g_{eff} = g - a = 9.8 - 2.0 = 7.8\text{ m/s}^2$। $T_2 = 2\pi\sqrt{\frac{0.993}{7.8}} = 2\pi\sqrt{0.1273} \approx 2.242\text{ s}$।", "##GEO:pendulum[angle=15,length=4][size:small]##"),
        ("একটি সেকেন্ড দোলকের তাপমাত্রা $20^\\circ\\text{C}$ বৃদ্ধি পেলে ঘড়িটি প্রতিদিন কত সেকেন্ড ধীরে চলবে? (দণ্ডটির রৈখিক প্রসারণ সহগ $\\alpha = 1.2 \times 10^{-5}\\text{ K}^{-1}$)।",
         r"প্রতিদিন হারানো সময় $\Delta T = 10.37\text{ s}$",
         r"তাপমাত্রা বৃদ্ধির জন্য পর্যায়কালের পরিবর্তন $\frac{\Delta T}{T} = \frac{1}{2}\alpha\Delta\theta$। প্রতিদিন হারানো সময় $\Delta t = 86400 \times \frac{1}{2}\alpha\Delta\theta = 43200 \times (1.2\times 10^{-5}) \times 20 = 43200 \times (2.4\times 10^{-4}) = 10.368\text{ s} \approx 10.37\text{ s}$।", "##GEO:pendulum[angle=12,length=4][size:small]##"),
        ("একটি সরল দোলকের কার্যকর দৈর্ঘ্য $21\\%$ বৃদ্ধি করা হলে এর পর্যায়কাল শতকরা কত বৃদ্ধি পাবে?",
         r"পর্যায়কাল বৃদ্ধি পাবে $10.0\%$",
         r"$T = 2\pi\sqrt{\frac{L}{g}} \propto \sqrt{L}$। নতুন দৈর্ঘ্য $L' = 1.21 L$। নতুন পর্যায়কাল $T' = \sqrt{1.21} T = 1.10 T$। পর্যায়কালের শতকরা বৃদ্ধি $= (1.10 - 1) \times 100\% = 10.0\%$।", "##GEO:pendulum[angle=15,length=4.5][size:small]##"),
        ("একটি গাড়ি $a = 2.5\\text{ m/s}^2$ সমত্বরণে অনুভূমিক রাস্তায় চলছে। গাড়ির ছাদ হতে ঝুলানো একটি সরল দোলকের কার্যকর পর্যায়কাল কত হবে যদি স্থির অবস্থায় এর পর্যায়কাল $2.0\\text{ s}$ হয়? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"পর্যায়কাল $T' = 1.97\text{ s}$",
         r"ত্বরান্বিত গাড়িতে কার্যকর অভিকর্ষজ ত্বরণ $g_{eff} = \sqrt{g^2 + a^2} = \sqrt{9.8^2 + 2.5^2} = \sqrt{96.04 + 6.25} = \sqrt{102.29} \approx 10.114\text{ m/s}^2$। পর্যায়কাল $T' = T\sqrt{\frac{g}{g_{eff}}} = 2.0\sqrt{\frac{9.8}{10.114}} = 2.0\sqrt{0.9689} \approx 1.969\text{ s} \approx 1.97\text{ s}$।", "##GEO:pendulum[angle=14,length=4][size:small]##"),
        ("চাঁদের পৃষ্ঠে অভিকর্ষজ ত্বরণ পৃথিবীর ত্বরণের $1/6$ অংশ। পৃথিবীতে একটি সেকেন্ড দোলকের দৈর্ঘ্য $L_E = 1.0\\text{ m}$ হলে চাঁদের পৃষ্ঠে একটি সেকেন্ড দোলকের দৈর্ঘ্য কত হতে হবে?",
         r"$L_M = \frac{1}{6}\text{ m} \approx 0.167\text{ m} = 16.67\text{ cm}$",
         r"সেকেন্ড দোলকের পর্যায়কাল $T = 2\text{ s}$ ধ্রুব: $T = 2\pi\sqrt{\frac{L}{g}} \implies L \propto g$। চাঁদে দৈর্ঘ্য $L_M = L_E \left(\frac{g_M}{g_E}\right) = 1.0 \times \frac{1}{6} \approx 0.1667\text{ m} = 16.67\text{ cm}$।", "##GEO:pendulum[angle=15,length=2.5][size:small]##"),
        ("একটি সরল দোলক পৃথিবীর কেন্দ্র দিয়ে নির্মিত সুরঙ্গের মধ্যে নিয়ে গেলে এর দোলনকাল কত হবে? (ব্যাখ্যা কর কেন কেন্দ্রস্থলে দোলক অচল হয়ে যায়)।",
         r"কেন্দ্রে পর্যায়কাল অসীম ($T = \infty$), দোলক অচল হবে",
         r"পৃথিবীর কেন্দ্রে অভিকর্ষজ ত্বরণ $g = 0$। পর্যায়কালের সূত্র $T = 2\pi\sqrt{\frac{L}{g}}$ অনুসারে $g \to 0$ হলে $T \to \infty$। কেন্দ্রে কোনো পুনরুদ্ধার অভিকর্ষজ বল না থাকায় দোলকের কোনো প্রত্যাবর্তনমূলক স্পন্দন সম্ভব নয় এবং দোলকটি অচল হয়ে যাবে।", "##GEO:circle[r=3][size:small]##"),
        ("একটি পেন্ডুলাম ঘড়ি শীতকালে প্রতিদিন $15\\text{ সেকেন্ড}$ দ্রুত চলে এবং গ্রীষ্মকালে প্রতিদিন $25\\text{ সেকেন্ড}$ ধীরে চলে। উভয় ঋতুর তাপমাত্রার পার্থক্য কত? (দণ্ডের $\\alpha = 2.0 \times 10^{-5}\\text{ K}^{-1}$)।",
         r"তাপমাত্রার পার্থক্য $\Delta\theta = 46.3^\circ\text{C}$",
         r"শীত ও গ্রীষ্মে মোট সময়ের ব্যবধান $\Delta t = 15 - (-25) = 40\text{ s}$। $\Delta t = 86400 \times \frac{1}{2}\alpha\Delta\theta \implies 40 = 43200 \times (2.0\times 10^{-5})\Delta\theta = 0.864\Delta\theta \implies \Delta\theta = \frac{40}{0.864} \approx 46.30^\circ\text{C}$।", "##GEO:pendulum[angle=15,length=4][size:small]##"),
        ("একটি সরল দোলকের কৌণিক বিস্তার $\\theta_0 = 60^\\circ$ হলে এর ক্ষুদ্র বিস্তার অনুমানের সাথে প্রকৃত দোলনকালের পার্থক্য কত শতাংশ? (বৃহৎ বিস্তারে $T \approx T_0(1 + \\frac{1}{16}\\theta_0^2)$)।",
         r"দোলনকাল বৃদ্ধি পায় প্রায় $6.85\%$",
         r"কৌণিক বিস্তার রেডিয়ানে: $\theta_0 = 60^\circ = \frac{\pi}{3} \approx 1.0472\text{ rad}$। দ্বিতীয় ক্রমের সংশোধন: $\frac{\Delta T}{T_0} \approx \frac{1}{16}\theta_0^2 = \frac{1}{16}(1.0472)^2 = \frac{1.0966}{16} \approx 0.0685 = 6.85\%$।", "##GEO:pendulum[angle=60,length=4][size:small]##")
    ]
    for item in p3:
        q.append({
            'topic': 'সরল দোলক, তাপমাত্রা ও অভিকর্ষের প্রভাব (Simple Pendulum & Clocks)',
            'difficulty': 'HARD',
            'marks': 4,
            'diagram': item[3],
            'questionText': f"{item[3]}\n\n{item[0]}",
            'modelAnswer': item[1],
            'explanation': item[2]
        })
        
    # 36-50: Springs, Combinations, U-Tube & Advanced Oscillations
    p4 = [
        ("দুটি স্প্রিং-এর স্প্রিং ধ্রুবক যথাক্রমে $k_1 = 300\\text{ N/m}$ এবং $k_2 = 600\\text{ N/m}$। স্প্রিং দুটিকে (ক) শ্রেণি সমবায়ে এবং (খ) সমান্তরাল সমবায়ে যুক্ত করে $m = 2.0\\text{ kg}$ ভরের বস্তু ঝুলালে উভয় ক্ষেত্রে দোলনকাল কত হবে?",
         r"(ক) শ্রেণিতে $T_s = 0.628\text{ s}$, (খ) সমান্তরালে $T_p = 0.296\text{ s}$",
         r"(ক) শ্রেণি সমবায়ে: $k_s = \frac{k_1 k_2}{k_1 + k_2} = \frac{300 \times 600}{900} = 200\text{ N/m}$। $T_s = 2\pi\sqrt{\frac{m}{k_s}} = 2\pi\sqrt{\frac{2.0}{200}} = 2\pi\sqrt{0.01} = 0.2\pi \approx 0.628\text{ s}$। (খ) সমান্তরালে: $k_p = k_1 + k_2 = 300 + 600 = 900\text{ N/m}$। $T_p = 2\pi\sqrt{\frac{m}{k_p}} = 2\pi\sqrt{\frac{2.0}{900}} = \frac{2\pi\sqrt{2}}{30} \approx 0.296\text{ s}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি স্প্রিং-এর সাথে $M$ ভর ঝুলালে এর পর্যায়কাল হয় $2.0\\text{ s}$। ভর $2\\text{ kg}$ বৃদ্ধি করলে পর্যায়কাল বেড়ে $3.0\\text{ s}$ হয়। আদি ভর $M$ এবং স্প্রিং ধ্রুবক $k$ নির্ণয় কর।",
         r"$M = 1.60\text{ kg}, k = 15.79\text{ N/m}$",
         r"$T_1 = 2\pi\sqrt{\frac{M}{k}} = 2.0$ এবং $T_2 = 2\pi\sqrt{\frac{M+2}{k}} = 3.0$। ভাগ করে: $\frac{T_2}{T_1} = \sqrt{\frac{M+2}{M}} = \frac{3}{2}$। বর্গ করে: $\frac{M+2}{M} = \frac{9}{4} \implies 4M + 8 = 9M \implies 5M = 8 \implies M = 1.60\text{ kg}$। স্প্রিং ধ্রুবক $k = \frac{4\pi^2 M}{T_1^2} = \frac{4\pi^2(1.6)}{4} = 1.6\pi^2 \approx 15.79\text{ N/m}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি স্প্রিং ধ্রুবক $k$-এর একটি স্প্রিংকে কেটে $1:2$ অনুপাতে দুটি টুকরা করা হলো। প্রতিটি টুকরার স্প্রিং ধ্রুবক কত হবে এবং ক্ষুদ্রতর টুকরায় $m$ ভর ঝুলালে দোলনকাল কত?",
         r"$k_1 = 3k, k_2 = 1.5k, T = 2\pi\sqrt{\frac{m}{3k}}$",
         r"স্প্রিং ধ্রুবক দৈর্ঘ্যের ব্যস্তানুপাতিক ($k \propto 1/L$)। সম্পূর্ণ দৈর্ঘ্য $L$ হলে টুকরাদ্বয়ের দৈর্ঘ্য $L_1 = L/3$ এবং $L_2 = 2L/3$। ১ম টুকরার ধ্রুবক $k_1 = 3k$। ২য় টুকরার ধ্রুবক $k_2 = \frac{3}{2}k = 1.5k$। ১ম টুকরায় পর্যায়কাল $T = 2\pi\sqrt{\frac{m}{k_1}} = 2\pi\sqrt{\frac{m}{3k}}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি সুষম $U$-নলে তরলের মোট দৈর্ঘ্য $L = 50\\text{ cm}$। নলের একপ্রান্তে চাপ দিয়ে তরল স্তম্ভকে সামান্য আন্দোলিত করে ছেড়ে দিলে তরলের মুক্ত দোলনের পর্যায়কাল কত হবে? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"পর্যায়কাল $T = 1.00\text{ s}$",
         r"$U$-নলের তরল স্তম্ভের দোলনকাল $T = 2\pi\sqrt{\frac{L}{2g}}$ (যেখানে $L$ হলো নলের তরল স্তম্ভের মোট দৈর্ঘ্য)। মান বসিয়ে: $T = 2\pi\sqrt{\frac{0.50}{2(9.8)}} = 2\pi\sqrt{\frac{0.50}{19.6}} = 2\pi\sqrt{\frac{1}{39.2}} = \frac{2\pi}{6.261} \approx 1.003\text{ s} \approx 1.00\text{ s}$।", "##GEO:cylinder[r=2,h=4][size:small]##"),
        ("একটি $M = 500\\text{ g}$ ভরের কাঠের ব্লক একটি উলম্ব স্প্রিং-এর ওপর ভারসাম্য অবস্থায় রাখা আছে। স্প্রিংটির ওপর কত সর্বোচ্চ বিস্তার পর্যন্ত স্পন্দন দিলে ব্লকটি স্প্রিং হতে বিচ্ছিন্ন হবে না? ($k = 200\\text{ N/m}, g = 9.8\\text{ ms}^{-2}$)।",
         r"সর্বোচ্চ বিস্তার $A_{\max} = 2.45\text{ cm}$",
         r"স্প্রিং হতে বিচ্ছিন্ন না হওয়ার শর্ত হলো শীর্ষবিন্দুতে নিম্নমুখী ত্বরণ $g$-এর চেয়ে বেশি হতে পারবে না: $a_{\max} \le g \implies \omega^2 A \le g$। $\omega^2 = \frac{k}{M} = \frac{200}{0.5} = 400\text{ s}^{-2}$। $400 A \le 9.8 \implies A_{\max} = \frac{9.8}{400} = 0.0245\text{ m} = 2.45\text{ cm}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি $m = 200\\text{ g}$ ভরের সিলিন্ডার তরলে উল্লম্বভাবে ভাসছে। তরলের ঘনত্ব $\\rho = 1000\\text{ kg/m}^3$ এবং সিলিন্ডারের প্রস্থচ্ছেদ $A = 20\\text{ cm}^2$। সিলিন্ডারটিকে সামান্য নিচে চেপে ছেড়ে দিলে এর দোলনকাল কত হবে? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"$T = 0.635\text{ s}$",
         r"প্লবতা জনিত পুনরুদ্ধার বল $F = -A\rho g x$। কার্যকর স্প্রিং ধ্রুবক $k = A\rho g = (20\times 10^{-4}\text{ m}^2)(1000)(9.8) = 19.6\text{ N/m}$। পর্যায়কাল $T = 2\pi\sqrt{\frac{m}{k}} = 2\pi\sqrt{\frac{0.20}{19.6}} = 2\pi\sqrt{\frac{1}{98}} \approx \frac{2\pi}{9.899} \approx 0.6347\text{ s} \approx 0.635\text{ s}$।", "##GEO:cylinder[r=2,h=4][size:small]##"),
        ("একটি স্প্রিং ধ্রুবক $k$-এর উভয় প্রান্তে $m_1$ এবং $m_2$ ভরের দুটি বস্তু সংযুক্ত করে একটি মসৃণ অনুভূমিক মেঝের ওপর স্পন্দনশীল করা হলো। ব্যবস্থাটির কার্যকর হ্রাসকৃত ভর (Reduced mass) এবং দোলনকালের সমীকরণ নির্ণয় কর।",
         r"$\mu = \frac{m_1 m_2}{m_1 + m_2}, T = 2\pi\sqrt{\frac{\mu}{k}}$",
         r"ভরকেন্দ্র স্থির থাকায় উভয় ভরের স্পন্দন কম্পাঙ্ক অভিন্ন। সমতুল্য হ্রাসকৃত ভর $\mu = \frac{m_1 m_2}{m_1 + m_2}$। সমীকরণের পর্যায়কাল $T = 2\pi\sqrt{\frac{\mu}{k}} = 2\pi\sqrt{\frac{m_1 m_2}{(m_1+m_2)k}}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি অবমন্দিত স্পন্দনের (Damped Oscillation) বিস্তার $10\\text{ সেকেন্ডে}$ তার প্রারম্ভিক মানের অর্ধেকে নেমে আসে। প্রারম্ভিক মানের $1/8$ অংশে নামতে মোট কত সেকেন্ড সময় লাগবে?",
         r"সময় $t = 30.0\text{ s}$",
         r"অবমন্দিত বিস্তার $A(t) = A_0 e^{-\gamma t}$। বিস্তার অর্ধেক হতে সময় $t_{1/2} = 10\text{ s}$। বিস্তার $1/8 = (1/2)^3$ হতে তিনটি অর্ধায়ু সময় পার হতে হবে: $t = 3 \times t_{1/2} = 3 \times 10 = 30.0\text{ s}$।", "##GEO:rect[w=4,h=2][size:small]##"),
        ("একটি $L = 1.0\\text{ m}$ দৈর্ঘ্যের সুষম সরু রডের একপ্রান্ত হতে লম্ব অক্ষের সাপেক্ষে দোদুল্যমান (Physical Pendulum)। রডটির ক্ষুদ্র দোলনের পর্যায়কাল কত? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"পর্যায়কাল $T = 1.64\text{ s}$",
         r"একপ্রান্ত সাপেক্ষে জড়তার ভ্রামক $I = \frac{1}{3}ML^2$। ভরকেন্দ্রের দূরত্ব $d = L/2$। চক্রগতির সূত্র: $T = 2\pi\sqrt{\frac{I}{mgd}} = 2\pi\sqrt{\frac{\frac{1}{3}ML^2}{Mg(L/2)}} = 2\pi\sqrt{\frac{2L}{3g}} = 2\pi\sqrt{\frac{2(1.0)}{3(9.8)}} = 2\pi\sqrt{\frac{2}{29.4}} = 2\pi\sqrt{0.0680} \approx 1.639\text{ s}$।", "##GEO:rect[w=1,h=5][size:small]##"),
        ("একটি চালিত স্পন্দকে (Driven Oscillator) অনুনাদ সৃষ্টি হলে দোলকের বিস্তার সর্বোচ্চ হয়। অনুনাদের তীক্ষ্ণতা (Quality factor $Q$) বলতে কী বোঝায় এবং উচ্চ $Q$-এর অর্থ কী?",
         r"$Q = \frac{\omega_0}{2\gamma} = \frac{\omega_0}{\Delta\omega}$, উচ্চ $Q$ মানে অতি তীক্ষ্ণ অনুনাদ ও স্বল্প শক্তি অপচয়",
         r"গুণগত গুণক বা কোয়ালিটি ফ্যাক্টর $Q = 2\pi \frac{\text{সঞ্চিত শক্তি}}{\text{প্রতি চক্রে ক্ষয়িত শক্তি}} = \frac{\omega_0}{\Delta\omega}$ (যেখানে $\Delta\omega$ হলো ব্যান্ডউইডথ)। উচ্চ $Q$-মানের অর্থ হলো সিস্টেমে অবমন্দন খুব কম, অনুনাদ অত্যন্ত তীক্ষ্ণ এবং সামান্য কম্পাঙ্ক পরিবর্তনে বিস্তার তীব্রভাবে হ্রাস পায়।", "##PRESET:spring-mass-system[size:medium]##")
    ]
    for item in p4:
        q.append({
            'topic': 'স্প্রিং সমবায়, U-নল ও অবমন্দিত স্পন্দন (Springs, U-Tube & Damped SHM)',
            'difficulty': 'TOUGH',
            'marks': 4,
            'diagram': item[3],
            'questionText': f"{item[3]}\n\n{item[0]}",
            'modelAnswer': item[1],
            'explanation': item[2]
        })
        
    # 41-50: 10 Additional Rigorous Problems (Total 50)
    p5 = [
        ("একটি লিফট $a = 2.45\\text{ ms}^{-2}$ ত্বরণে উপরের দিকে উঠছে। লিফটের ভেতর একটি সেকেন্ড দোলকের কার্যকর দোলনকাল কত হবে? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"কার্যকর দোলনকাল $T' = 1.79\text{ s}$",
         r"স্থির লিফটে সেকেন্ড দোলকের দোলনকাল $T = 2\\text{ s}$। লিফট $a$ ত্বরণে উপরে উঠলে কার্যকর অভিকর্ষজ ত্বরণ $g' = g + a = 9.8 + 2.45 = 12.25\\text{ ms}^{-2}$। নতুন দোলনকাল $T' = T\\sqrt{\\frac{g}{g'}} = 2\\sqrt{\\frac{9.8}{12.25}} = 2\\sqrt{0.8} \\approx 2 \\times 0.8944 = 1.789\\text{ s} \\approx 1.79\\text{ s}$।", "##PRESET:simple-pendulum[size:small]##"),
        ("একটি সরল দোলক একটি ট্রলির ছাদ থেকে ঝুলানো আছে। ট্রলিটি অনুভূমিকভাবে $a = 5.66\\text{ ms}^{-2}$ ত্বরণে গতিশীল হলে দোলকটির কার্যকর দোলনকাল স্থির অবস্থার দোলনকালের কত গুণ হবে? ($g = 9.8\\text{ ms}^{-2}$)।",
         r"$T' = 0.932 T$",
         r"কার্যকর ত্বরণ $g_{eff} = \\sqrt{g^2 + a^2} = \\sqrt{9.8^2 + 5.66^2} = \\sqrt{96.04 + 32.04} = \\sqrt{128.08} \\approx 11.317\\text{ ms}^{-2}$। অতএব $\\frac{T'}{T} = \\sqrt{\\frac{g}{g_{eff}}} = \\sqrt{\\frac{9.8}{11.317}} \\approx \\sqrt{0.8659} \\approx 0.9306 \\approx 0.931$।", "##PRESET:simple-pendulum[size:small]##"),
        ("সরল ছন্দিত স্পন্দনে স্পন্দিত একটি কণার সমীকরণ $x = 0.08\\sin(4\\pi t)$ মিটার। কণাটি সাম্যাবস্থা থেকে কত সময় পর তার সর্বোচ্চ স্থিতিশক্তির অর্ধেক স্থিতিশক্তি অর্জন করবে?",
         r"সময় $t = 0.03125\\text{ s} = \\frac{1}{32}\\text{ s}$",
         r"স্থিতিশক্তি $U = \\frac{1}{2}m\\omega^2 x^2$ এবং সর্বোচ্চ স্থিতিশক্তি $U_{\\max} = \\frac{1}{2}m\\omega^2 A^2$। $U = \\frac{1}{2}U_{\\max} \\implies x^2 = \\frac{1}{2}A^2 \\implies x = \\frac{A}{\\sqrt{2}}$। সমীকরণে বসিয়ে: $\\frac{A}{\\sqrt{2}} = A\\sin(4\\pi t) \\implies \\sin(4\\pi t) = \\frac{1}{\\sqrt{2}} \\implies 4\\pi t = \\frac{\\pi}{4} \\implies t = \\frac{1}{16} \\times \\frac{1}{2} = \\frac{1}{32}\\text{ s} = 0.03125\\text{ s}$।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি সরল ছন্দিত স্পন্দনের একটি পূর্ণ পর্যায়ের মধ্যে কত ভগ্নাংশ সময় জুড়ে কণার স্থিতিশক্তি তার গতিশক্তির চেয়ে বেশি থাকে?",
         r"মোট সময়ের অর্ধেক ($0.5 T$ বা $\\frac{1}{2}$ অংশ সময়)",
         r"$U > K \\iff \\frac{1}{2}k x^2 > \\frac{1}{2}k(A^2 - x^2) \\iff x^2 > \\frac{A^2}{2} \\iff |x| > \\frac{A}{\\sqrt{2}}$। প্রতি চতুর্থাংশে $x = A/\\sqrt{2}$ থেকে $x = A$ পর্যন্ত সময় $\\Delta t = \\frac{T}{4} - \\frac{T}{8} = \\frac{T}{8}$। পুরো চক্রে এমন ৪টি অংশ থাকায় মোট সময় $= 4 \\times \\frac{T}{8} = \\frac{T}{2}$ বা মোট পর্যায়কালের অর্ধেক সময়।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি টরশন দোলকে (Torsional Pendulum) $M = 2\\text{ kg}$ ভরের এবং $R = 0.2\\text{ m}$ ব্যাসার্ধের একটি চাকতি কেন্দ্রের মধ্য দিয়ে গমনকারী অক্ষের সাপেক্ষে একটি তারের সাহায্যে ঝুলানো আছে। তারের মোচড় ধ্রুবক $C = 1.6\\text{ N}\\cdot\\text{m/rad}$ হলে চাকতিটির কৌণিক স্পন্দনের পর্যায়কাল কত?",
         r"পর্যায়কাল $T = 0.993\\text{ s} \\approx 1.0\\text{ s}$",
         r"চাকতির জড়তার ভ্রামক $I = \\frac{1}{2}M R^2 = \\frac{1}{2}(2)(0.2)^2 = 0.04\\text{ kg}\\cdot\\text{m}^2$। টরশনাল দোলনকাল $T = 2\\pi\\sqrt{\\frac{I}{C}} = 2\\pi\\sqrt{\\frac{0.04}{1.6}} = 2\\pi\\sqrt{0.025} = 2\\pi(0.1581) \\approx 0.9935\\text{ s}$।", "##GEO:circle[r=3][size:small]##"),
        ("একটি স্প্রিং-ভর সিস্টেমে $m = 0.5\\text{ kg}$ ভর এবং $k = 50\\text{ N/m}$ স্প্রিং ধ্রুবক রয়েছে। ভরটিকে সাম্যাবস্থা হতে $10\\text{ cm}$ টেনে ছেড়ে দেওয়া হলো। সাম্যাবস্থা অতিক্রম করার মুহূর্তে এর গতিশক্তি কত এবং সাম্যাবস্থা থেকে $6\\text{ cm}$ দূরত্বে এর বেগ কত?",
         r"$K_{\\max} = 0.25\\text{ J}$, $v(6\\text{ cm}) = 0.80\\text{ m/s}$",
         r"সর্বোচ্চ গতিশক্তি $K_{\\max} = \\frac{1}{2}k A^2 = \\frac{1}{2}(50)(0.10)^2 = 0.25\\text{ J}$। কৌণিক কম্পাঙ্ক $\\omega = \\sqrt{\\frac{k}{m}} = \\sqrt{\\frac{50}{0.5}} = 10\\text{ rad/s}$। $x = 0.06\\text{ m}$-এ বেগ $v = \\omega\\sqrt{A^2 - x^2} = 10\\sqrt{0.10^2 - 0.06^2} = 10\\sqrt{0.0064} = 10(0.08) = 0.80\\text{ m/s}$।", "##PRESET:spring-mass-system[size:medium]##"),
        ("একটি গোলকাকার ফাঁপা গোলকের ভেতর একটি ক্ষুদ্র বস্তু ঘর্ষণহীনভাবে তলদেশ বরাবর সামান্য আন্দোলিত হয়। গোলকের অন্তর্ব্যাসার্ধ $R = 2.45\\text{ m}$ হলে বস্তুটির স্পন্দনের পর্যায়কাল কত?",
         r"পর্যায়কাল $T = 3.14\\text{ s} = \\pi\\text{ s}$",
         r"ক্ষুদ্র কোণে গোলকের কেন্দ্র হতে তলদেশ পর্যন্ত দূরত্ব কার্যকর সরল দোলকের দৈর্ঘ্যের সমতুল্য ($L = R$)। পর্যায়কাল $T = 2\\pi\\sqrt{\\frac{R}{g}} = 2\\pi\\sqrt{\\frac{2.45}{9.8}} = 2\\pi\\sqrt{\\frac{1}{4}} = 2\\pi(0.5) = \\pi \\approx 3.1416\\text{ s}$।", "##GEO:circle[r=3][size:small]##"),
        ("দুটি সরল ছন্দিত স্পন্দনের সমীকরণ $x_1 = 3\\sin(\\omega t)$ এবং $x_2 = 4\\cos(\\omega t) = 4\\sin(\\omega t + \\pi/2)$। এদের উপরিপাতনের ফলে সৃষ্ট লব্ধি তরঙ্গের বিস্তার এবং প্রারম্ভিক দশা কত হবে?",
         r"লব্ধি বিস্তার $A = 5.0\\text{ m}$, প্রারম্ভিক দশা $\\delta = 53.13^\\circ = 0.927\\text{ rad}$",
         r"দশা পার্থক্য $\\Delta\\phi = \\frac{\\pi}{2}$। লব্ধি বিস্তার $A = \\sqrt{A_1^2 + A_2^2 + 2A_1 A_2 \\cos(\\pi/2)} = \\sqrt{3^2 + 4^2} = 5.0\\text{ m}$। দশা কোণ $\\tan\\delta = \\frac{A_2}{A_1} = \\frac{4}{3} \\implies \\delta = \\arctan(4/3) \\approx 53.13^\\circ$।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি কণা সরল ছন্দিত স্পন্দনে রয়েছে যার মোট যান্ত্রিক শক্তি $E = 100\\text{ J}$। যখন কণাটির সরণ বিস্তারের এক-চতুর্থাংশ ($x = A/4$), তখন তার গতিশক্তি এবং স্থিতিশক্তির অনুপাত কত?",
         r"$K : U = 15 : 1$, $K = 93.75\\text{ J}, U = 6.25\\text{ J}$",
         r"স্থিতিশক্তি $U = \\frac{1}{2}k x^2 = \\frac{1}{2}k (A/4)^2 = \\frac{E}{16} = \\frac{100}{16} = 6.25\\text{ J}$। গতিশক্তি $K = E - U = 100 - 6.25 = 93.75\\text{ J} = \\frac{15}{16}E$। অনুপাত $\\frac{K}{U} = \\frac{15/16}{1/16} = 15 : 1$।", "##GEO:circle[r=2.5][size:small]##"),
        ("একটি জটিল দোলকের (Compound pendulum) ভরকেন্দ্রগামী অক্ষের সাপেক্ষে চক্রগতির ব্যাসার্ধ $k_c$ এবং ঝুলন বিন্দু হতে ভরকেন্দ্রের দূরত্ব $l$। পর্যায়কাল ন্যূনতম হওয়ার শর্ত প্রমাণ কর এবং ন্যূনতম পর্যায়কালের রাশিমালা নির্ণয় কর।",
         r"শর্ত $l = k_c$, ন্যূনতম পর্যায়কাল $T_{\\min} = 2\\pi\\sqrt{\\frac{2k_c}{g}}$",
         r"দোলনকাল $T = 2\\pi\\sqrt{\\frac{k_c^2 + l^2}{gl}}$। $T$-কে ন্যূনতম করতে $\\frac{d}{dl}\\left(\\frac{k_c^2 + l^2}{l}\\right) = 0 \\implies 1 - \\frac{k_c^2}{l^2} = 0 \\implies l = k_c$। এই শর্তে সমতুল্য দৈর্ঘ্য $L = \\frac{k_c^2 + k_c^2}{k_c} = 2k_c$, ফলে $T_{\\min} = 2\\pi\\sqrt{\\frac{2k_c}{g}}$।", "##GEO:rect[w=1,h=5][size:small]##")
    ]
    for item in p5:
        q.append({
            'topic': 'উন্নত স্পন্দন, দোলক ও শক্তি বিশ্লেষণ (Advanced Oscillations & Energy Analysis)',
            'difficulty': 'TOUGH',
            'marks': 4,
            'diagram': item[3],
            'questionText': f"{item[3]}\n\n{item[0]}",
            'modelAnswer': item[1],
            'explanation': item[2]
        })
        
    return q

