# World-Class Admission Test Question Paper & Print-Layout Optimization Engine
## Magnum Opus Master Architecture Blueprint

---

## Executive Summary

For an **admission-test question paper**, ordinary document rendering engines that simply "put questions until the page is full" fail catastrophically. They produce clipped text, broken options across page breaks, orphaned question numbers, unbalanced columns, wasted blank spaces, and incorrect booklet imposition.

This blueprint specifies a **multi-stage constraint-based optimization engine** whose output matches the standard of prestigious university admission examination papers (BUET, Dhaka University, Medical, Krishi Guchho, etc.).

### Golden Operational Standard
* **Zero clipping / overflow** — No element extends outside printable safe boundaries.
* **Atomic integrity** — No question stem, formula, diagram, or option group is split across page boundaries.
* **Absolute page safety boundary** — Hard margins + safety buffers protect against physical printer tolerances.
* **Balanced columns** — Left and right columns on every page are balanced to minimize height discrepancy.
* **Elimination of accidental blank regions** — Waste scores are minimized via dynamic look-ahead distribution.
* **Intelligent typography & spacing** — Spacing compresses dynamically before any font reduction; body font never shrinks below readable thresholds (10pt minimum).
* **Dynamic option geometry** — MCQ options format dynamically into 1-column, 2-column, or 4-column layouts based on visual width, option count, and LaTeX math formulas.
* **True booklet imposition** — Imposition occurs only after individual pages achieve 100% pre-flight validation.

---

# 1. The Core Multi-Stage Pipeline

```text
QUESTION BANK / INPUT DATA
            ↓
1. Question Normalization & Sanitization
            ↓
2. Content Measurement (Real CSS & KaTeX Metrics)
            ↓
3. Layout Candidate Generation (1-col, 2-col, 4-col options)
            ↓
4. Constraint Validation (Atomic blocks, min body font)
            ↓
5. Page Packing Optimization (2D Bin Packing & Look-Ahead)
            ↓
6. Column Balancing (Minimizing |LeftHeight - RightHeight|)
            ↓
7. Vertical Space Optimization (Intelligent spacing compression)
            ↓
8. Typography & Readability Check (Min 10pt limit)
            ↓
9. Overflow & Clipping Preflight (Layer 1 Geometry + Layer 2 Edge Scan)
            ↓
10. Page-by-Page Validation (Hard Gate: 100% Pass Required)
            ↓
11. NORMAL FINAL SPREAD / PAGINATED PDF
            ↓
12. BOOKLET IMPOSITION (N-page convergence: N multiple of 4)
            ↓
13. PRINT PRE-FLIGHT
            ↓
14. PRINT-READY PRESS PDF
```

> **Cardinal Rule:** A document is never considered finished until every single page passes pre-flight validation. If even **0.1 mm** overflows the safe boundary, the layout engine rejects the candidate and triggers intelligent re-packing.

---

# 2. Atomic Layout Block Architecture

Questions are never treated as arbitrary strings of text. Every question is an immutable **`QuestionBlock`**:

```text
QuestionBlock
│
├── id: string
├── subject: string
├── number: number | string
├── stem: FormattedRichText (KaTeX, Bengali, English)
├── figures: Diagram[] | Image[]
├── tables: TabularData[]
├── options: OptionItem[] (stem + bubble + label)
├── marks: number
├── canonicalSubject: string
└── spacingMetrics:
    ├── minTopMargin: Length
    ├── minBottomMargin: Length
    └── idealHeight: Length
```

### Measured Bounding Box
Each block has an exact measured bounding box:

```text
┌───────────────────────────────────────────┐
│ Q17. A uniform rod of mass m and length L │
│      rotates freely about a pivot...      │
│                                           │
│  [  Vector / Circuit / KaTeX Diagram  ]   │
│                                           │
│  (A) 12.5 N/m          (B) 25.0 N/m       │
│  (C) 37.5 N/m          (D) 50.0 N/m       │
└───────────────────────────────────────────┘
 width  = 88 mm
 height = 44 mm
```

The pagination engine **never** cuts or fragments this block. CSS rule: `break-inside: avoid !important; page-break-inside: avoid !important;`.

---

# 3. Absolute Page Safety Boundary & Geometry

Hard margins are calculated for each standard paper size:

| Paper Size | Dimensions (W × H) | Top Margin | Bottom Margin | Left Margin | Right Margin | Usable W × H |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A4 Portrait** | 210 × 297 mm | 12 mm | 12 mm | 14 mm | 14 mm | 182 × 273 mm |
| **A3 Landscape** | 420 × 297 mm | 12 mm | 12 mm | 14 mm | 14 mm | 392 × 273 mm |
| **Legal Portrait**| 216 × 356 mm | 12 mm | 12 mm | 14 mm | 14 mm | 188 × 332 mm |
| **Letter Portrait**| 216 × 279 mm | 12 mm | 12 mm | 14 mm | 14 mm | 188 × 255 mm |

### Hard Mathematical Invariant
For any element $E$:
$$\begin{aligned}
x_E &\ge \text{margin}_{\text{left}} \\
y_E &\ge \text{margin}_{\text{top}} \\
x_E + w_E &\le \text{pageWidth} - \text{margin}_{\text{right}} \\
y_E + h_E &\le \text{pageHeight} - \text{margin}_{\text{bottom}}
\end{aligned}$$

---

# 4. The Two-Layer Safety Buffer

Printers exhibit mechanical feeding drift, rasterization differences, and font-metrics rounding. Therefore, the engine adds a **2.0 mm internal safety buffer**:

```text
safeTop    = topMargin    + safetyBuffer = 12mm + 2mm = 14mm
safeBottom = bottomMargin + safetyBuffer = 12mm + 2mm = 14mm
safeLeft   = leftMargin   + safetyBuffer = 14mm + 2mm = 16mm
safeRight  = rightMargin  + safetyBuffer = 14mm + 2mm = 16mm
```

Any element encroaching into the safety buffer triggers warning flags; any element extending past the hard margin marks the page as **`INVALID`**.

---

# 5. Dynamic Content Measurement (No Fixed Questions Per Page)

Fixed question allocations (e.g. "exactly 25 questions per page") are banned.
* Q1 might have a 2-line stem with 4 short numeric options ($h = 16\text{ mm}$).
* Q4 might contain a 6-line passage, a KaTeX double integral, and a physics schematic ($h = 78\text{ mm}$).

### Measurement Pipeline
1. Render question candidate in offscreen measurement sandbox with exact target column width (e.g., $88\text{ mm}$).
2. Resolve KaTeX equations to their exact rendered DOM dimensions.
3. Compute exact rendered bounding box:
$$\text{Height}_{\text{total}} = \text{Height}_{\text{stem}} + \text{Height}_{\text{diagram}} + \text{Height}_{\text{options}} + \text{Margin}_{\text{bottom}}$$

---

# 6. Option Layout Optimization Engine

MCQ options dynamically adapt to one of three layout formats:

### Mode 1: 4 Columns (Single Row)
Used for short options (numbers, single words, chemical formulas):
```text
(A) Dhaka        (B) Rajshahi        (C) Khulna        (D) Sylhet
```
* Condition: $\max(\text{len}_i) \le 12 \times \text{fontFactor}$ and $\sum \text{len}_i \le 45 \times \text{fontFactor}$
* Space savings: ~65% vertical reduction.

### Mode 2: 2 Columns (Two Rows)
Used for moderate length phrases:
```text
(A) Increases quadratically          (B) Decreases exponentially
(C) Remains strictly constant        (D) Oscillates sinusoidally
```
* Condition: $\max(\text{len}_i) \le 34 \times \text{fontFactor}$ and $\sum \text{len}_i \le 125 \times \text{fontFactor}$
* Space savings: ~45% vertical reduction.

### Mode 3: 1 Column (Four Rows)
Used for lengthy analytical sentences or multi-step options:
```text
(A) The kinetic energy exceeds the electrostatic potential barrier at radius R.
(B) The momentum remains conserved only along the tangential coordinate.
(C) ...
(D) ...
```

### KaTeX / Math Formula Length Normalization
Raw LaTeX strings like `$\sqrt{\frac{a^2 + b^2}{c^2}}$` contain 33 ASCII characters, but render to a compact visual symbol. The engine normalizes LaTeX formulas to their rendered visual character-equivalent before computing grid layout.

---

# 7. 2D Bin Packing & Column Balancing

For standard 2-column examination papers:
```text
┌────────────────────────────────────────────────────────┐
│                    PAGE HEADER                         │
├───────────────────────────┬────────────────────────────┤
│         COLUMN A          │          COLUMN B          │
│ Q1  [22mm]                │ Q7  [18mm]                 │
│ Q2  [34mm]                │ Q8  [42mm]                 │
│ Q3  [19mm]                │ Q9  [31mm]                 │
│ Q4  [40mm]                │ Q10 [26mm]                 │
│ Q5  [28mm]                │ Q11 [35mm]                 │
│ Q6  [30mm]                │ Q12 [21mm]                 │
├───────────────────────────┴────────────────────────────┤
│                    PAGE FOOTER                         │
└────────────────────────────────────────────────────────┘
```

### Column Balance Objective Function
$$\text{BalanceError} = |H_{\text{ColumnLeft}} - H_{\text{ColumnRight}}|$$

The engine optimizes split points within each page to minimize $\text{BalanceError}$. If $H_{\text{left}} = 240\text{ mm}$ and $H_{\text{right}} = 130\text{ mm}$, the layout is rejected and re-balanced.

---

# 8. Waste Score & Look-Ahead Allocation

The engine rejects naive greedy page-packing. Greedy packing fills Page 1 until full, often leaving Page 2 with massive awkward voids.

### Waste Score Formula
$$\text{WasteRatio} = \frac{\text{UsablePageArea} - \sum \text{Area}(Q_k)}{\text{UsablePageArea}}$$

### Look-Ahead Algorithm
When distributing questions across pages:
1. Estimate total exam weight $W = \sum w_i$.
2. Compute target capacity per page $C_p$:
   - Page 1: $C_1 = 0.82 \times \text{BaseCapacity}$ (accounts for institution header, exam instructions, candidate info).
   - Page 2..$N$: $C_k = 1.00 \times \text{BaseCapacity}$.
3. Balance question weights across pages proportionally to capacity.
4. Align with subject boundaries whenever possible, but never allow an empty or underfilled page (waste ratio $> 25\%$) when subsequent pages overflow.

---

# 9. Intelligent Spacing Compression & Typography Limits

When a page exceeds target bounds by $< 8\%$, the engine employs **proportional space compression** before any font reduction:

```text
Question spacing:
  Default: 4.5 mm
  Level 1: 3.8 mm
  Level 2: 3.0 mm
  Hard Floor: 2.2 mm (Questions must NEVER touch)

Option row spacing:
  Default: 2.0 mm
  Hard Floor: 1.2 mm
```

### Strict Typography Floor
* Body font preferred: `10.5 pt`
* Body font minimum: `10.0 pt` (Strict limit — shrinking below 10pt is disallowed)
* Heading font: `11.5 pt` – `13.0 pt`

---

# 10. Preflight Verification Checklist

Every single page must pass this automated verification before export:

```text
[ ] Geometric boundary check (0 elements outside safe margin)
[ ] Safety buffer check (no text encroaching into 2mm safety border)
[ ] Question block integrity (no orphaned numbers, no split questions)
[ ] Diagram & figure cohesion (diagrams stay within parent question block)
[ ] Column balance tolerance (|HeightLeft - HeightRight| <= 28mm)
[ ] Waste score tolerance (WasteRatio <= 22% unless final page)
[ ] Minimum font size validation (All body text >= 10pt)
[ ] KaTeX rendering check (Zero unparsed raw LaTeX strings)
[ ] Header & footer consistency (Page number, subject indicator correct)
```

---

# 11. Generalized Booklet Imposition Algorithm

When booklet printing is selected, imposition re-arranges the verified logical pages into printer spreads for 2-sided (duplex) printing, folding, and center-stapling.

### Universal Convergence Algorithm
For any document with $P$ logical pages:
1. Pad $P$ to the next multiple of 4:
$$N = 4 \times \lceil P / 4 \rceil$$
   *(Example: 4 pages $\to N=4$; 7 pages $\to N=8$; 13 pages $\to N=16$; 18 pages $\to N=20$)*

2. Calculate total required physical sheets:
$$\text{NumSheets} = \frac{N}{4}$$

3. Initialize pointers:
$$\text{left} = 1, \quad \text{right} = N$$

4. For sheet $s = 1$ to $\text{NumSheets}$:
   * **Front Spread (Outer Side):** `[ Page right | Page left ]`
   * **Back Spread (Inner Side):** `[ Page left + 1 | Page right - 1 ]`
   * Update pointers:
   $$\text{left} \leftarrow \text{left} + 2, \quad \text{right} \leftarrow \text{right} - 2$$

### Imposition Lookup Reference

#### 4-Page Single Sheet Booklet (Standard Admission Paper):
| Sheet | Side | Left Half | Right Half | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Sheet 1** | Front | **Page 4** (Back Cover) | **Page 1** (Exam Cover) | Outside of folded booklet |
| **Sheet 1** | Back | **Page 2** (Inner Left) | **Page 3** (Inner Right) | Inside reading spread |

#### 8-Page Two-Sheet Booklet:
| Sheet | Side | Left Half | Right Half |
| :--- | :--- | :--- | :--- |
| **Sheet 1** | Front | Page 8 | Page 1 |
| **Sheet 1** | Back | Page 2 | Page 7 |
| **Sheet 2** | Front | Page 6 | Page 3 |
| **Sheet 2** | Back | Page 4 | Page 5 |

#### 16-Page Four-Sheet Booklet:
| Sheet | Side | Left Half | Right Half |
| :--- | :--- | :--- | :--- |
| **Sheet 1** | Front | Page 16 | Page 1 |
| **Sheet 1** | Back | Page 2 | Page 15 |
| **Sheet 2** | Front | Page 14 | Page 3 |
| **Sheet 2** | Back | Page 4 | Page 13 |
| **Sheet 3** | Front | Page 12 | Page 5 |
| **Sheet 3** | Back | Page 6 | Page 11 |
| **Sheet 4** | Front | Page 10 | Page 7 |
| **Sheet 4** | Back | Page 8 | Page 9 |

---

# 12. Architectural Modules Summary

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. CONTENT & NORMALIZATION ENGINE                           │
│    - Extracts question bank, parses LaTeX, cleans artifacts │
│    - Assigns canonical subjects & question numbers          │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. DYNAMIC LAYOUT & MEASUREMENT ENGINE                      │
│    - Calculates exact bounding boxes for questions          │
│    - Optimizes options: 1-col, 2-col, or 4-col              │
│    - Enforces atomic non-splittable block boundaries        │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CONSTRAINT PAGINATION OPTIMIZER                          │
│    - 2D bin packing with look-ahead                         │
│    - Balances columns and minimizes waste scores            │
│    - Zero clipping, zero vacant pages                       │
└──────────────────────────────┬──────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. PREFLIGHT & IMPOSITION ENGINE                            │
│    - Validates safety boundaries & margin buffer            │
│    - Imposes N-page booklets (N multiple of 4)              │
│    - Renders print-ready press PDF                          │
└─────────────────────────────────────────────────────────────┘
```

This ensures every question paper produced is completely free of page overflow, clipped text, broken questions, or awkward blank voids.
