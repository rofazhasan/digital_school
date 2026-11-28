<div align="center">

# 🎓 Digital School Management System

<img src="./digital_school/public/hero-mockup.png" alt="Digital School Multi-Device Mockup" width="100%" style="border-radius: 14px; margin-bottom: 18px;" />

**Production-grade Academic LMS, Online & Offline Exam Engine, and High-Precision Optical Mark Recognition (OMR) + Blind-Grading CQ Platform — built for schools, coaching centers, and university admission batches.**

[![Live Platform](https://img.shields.io/badge/Live-rofazacademy.dev-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white)](https://rofazacademy.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.10-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Pooler-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Capacitor](https://img.shields.io/badge/Android-Capacitor_8-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com)
[![License](https://img.shields.io/badge/License-ISC-f97316?style=for-the-badge)](#-license)

[Key Capabilities](#-key-capabilities) • [Architecture](#-system-architecture) • [OMR & CQ Engine](#-omr--blind-grading-cq-engine) • [Quick Start](#-quick-start) • [Security](#-security--scalability) • [Deployment](#-deployment)

</div>

---

## ⚡ Why Digital School?

Most school systems stop at attendance and static PDFs. **Digital School** unifies **online CBT exams**, **offline printed OMR & Bangladesh Board 3-Part CQ exams**, **AI-assisted question authoring & mistake analysis**, and **instant result publishing** in a single, mobile-first Next.js 15 + Neon PostgreSQL platform.

| Capability | Production Benchmark / Guarantee |
| :--- | :--- |
| **OMR + Detached CQ Scanning** | **100.00% (100/100 papers)** verified on real production exam data (~105 ms/paper client-side via OpenCV.js WebWorkers — zero server CPU cost) |
| **Bulk Exam Sync** | **500+ sheets/exam** via chunked, resumable uploads (`25/chunk`) with deferred ranking recomputation |
| **Blind-Grading CQ Pairing** | Order-independent **Part 1 (`পরীক্ষার্থীর অংশ`) ↔ Part 2 (`পরীক্ষকের অংশ`)** pairing backed by PostgreSQL (`cq_strip_links`) across multiple simultaneous scanning stations |
| **Student Identity Resilience** | Strict DB-enforced **4-digit Roll** & **6-digit Registration** with 3-tier fault-tolerant matching, 1-digit typo auto-recovery, and 1-click HITL duplicate-roll disambiguation |
| **Security Posture** | Strict RBAC (`SUPER_USER`, `ADMIN`, `TEACHER`, `STUDENT`) across 115+ API routes, fail-closed JWT, IDOR protection, parameterized Prisma queries, and hardened HTTP security headers |

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Clients["Clients (Web • PWA • Android Capacitor 8)"]
        Portal["Role Portals<br/>Super Admin • Admin • Teacher • Student"]
        OMRWorker["Client-Side OMR Engine<br/>OpenCV.js • jsQR • Multi-Worker Pool"]
    end

    subgraph NextApp["Next.js 15 Standalone App (Microsoft Azure)"]
        MW["Edge Middleware<br/>Stateless JWT (jose) + RBAC"]
        API["115+ Hardened API Routes<br/>Zod Validation • Bounded Pagination"]
        AI["AI Services<br/>Gemini Question Gen • Mistake Analyzer"]
    end

    subgraph Data["Persistence & Media"]
        Neon[("Neon PostgreSQL<br/>PgBouncer Pooler • 36+ Migrations")]
        Cloud["Cloudinary / UploadThing"]
    end

    Portal --> MW --> API
    OMRWorker -->|"Chunked Resumable Sync (25/batch)"| API
    OMRWorker -->|"Multi-Device CQ Strip Pairing"| API
    API --> Neon
    API --> AI
    API --> Cloud
```

---

## 🎯 Key Capabilities

### 📝 OMR & Blind-Grading CQ Engine
- **Photocopy-Safe B&W OMR Sheets (`25Q–100Q`, `4` or `5` Options)**:
  - Crisp single-page borderless A4 printing (`<ExamName>_<Class>.pdf`), 4 Solid Pro concentric bullseye fiducials, lateral timing tracks, Latin `0–9` digits for Roll/Registration/Subject Code, and automatic zero-drift DOM coordinate calibration.
- **Bangladesh Board 3-Part Detachable CQ Top Cover**:
  - **Part 1 (`পরীক্ষার্থীর অংশ`)** & **Part 2 (`পরীক্ষকের অংশ`)** each carry independent 4-corner fiducials, clear quiet zones, edge-to-edge scissor perforation cut guides, English `0–9` bubbles, and matching cryptographic `serial` QR codes while keeping **Part 3 (`উত্তরপত্রের অংশ`)** untouched.
  - Detach Part 1 before blind grading; scan Part 1 and Part 2 on **any device in any order** — PostgreSQL (`cq_strip_links`) automatically pairs the student identity with the examiner's marks.
- **Template Studio & Batch Tools**:
  - Live X-Ray scanner calibration preview, Pre-Flight Scanability Health Score, 1-click enrolled class roster loader (`⚡ ক্লাস লোড`), pre-bubbled student batches, Master Answer Key scanning, Live AR Camera HUD, Live Absentee Tracker, Instant Batch Re-Grade, Printable Class Merit List, 2-sheet Excel export, and WhatsApp/SMS result copy.

### 🎓 Exam, Question Bank & Evaluation Suite
- **12 Question Types**: `MCQ`, `SMCQ`, `MC`, `CQ`, `SQ`, `INT`, `AR`, `MTF`, `DESCRIPTIVE`, `CMA`, `MPC`, and `CODING` with full **LaTeX / KaTeX / MathJax / Chemfig / Free-Body Diagram (FBD)** rendering.
- **Multi-Set Generation & Online/Offline Unification**: Auto-generates shuffled exam sets (`A`, `B`, `C`, `D`), prints matching Question Papers + OMR + CQ Top Covers, and routes both online CBT and scanned offline OMR/CQ submissions into `/exams/evaluations` for Superadmin review or auto-release directly to the Student Dashboard.
- **Digital Script Evaluation**: Canvas drawing/annotation on student scripts, evaluator assignment, scrutiny/review requests, and automated percentage-based negative marking.

### 👥 Multi-Role Portals & Student Corner
- **4-Tier Role Hierarchy**: `SUPER_USER`, `ADMIN`, `TEACHER`, and `STUDENT` with tailored dashboards, class/invoice/fee management, admit cards, seating plans, and activity audit logs.
- **Student Corner & Practice Arena**: Focus timer, syllabus tracker, mistake logbook with AI mistake analysis, revision planner, and `Prac-Perfect` adaptive practice sessions.
- **Mobile & Native Ready**: Mobile-first responsive Tailwind CSS 4 design system, WCAG-AA keyboard focus & reduced-motion support, Sonner toast notifications, PWA offline support, and **Capacitor 8 Android** build with native document scanner & biometrics.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js `>= 22.0.0`** (`node -v`)
- **PostgreSQL 14+** (recommended: [Neon Serverless Postgres](https://neon.tech) with connection pooling)
- **npm** & **Git**

### 1. Clone & Install
```bash
git clone https://github.com/rofazhasan/digital_school.git
cd digital_school/digital_school
npm install
```

### 2. Configure Environment Variables
Create `digital_school/.env.local`:

```env
# Database (Neon PostgreSQL pooled connection string)
DATABASE_URL="postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Security (REQUIRED in production — app fails closed if missing)
JWT_SECRET="replace-with-a-64-char-cryptographically-random-hex-string"
NEXTAUTH_SECRET="replace-with-a-separate-64-char-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional: AI Question Generation & Mistake Analyzer
GOOGLE_GENERATIVE_AI_API_KEY=""

# Optional: Cloud Image & File Uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""
```

> **Tip:** Generate cryptographically strong secrets with `npm run generate-secrets` or `openssl rand -hex 32`.

### 3. Apply Migrations & Start Development Server
```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — on a fresh database, visit `/setup` to initialize your institute and first `SUPER_USER` account.

---

## 📁 Project Structure

```text
digital_school/                       # Repository root
├── README.md
└── digital_school/                   # Next.js 15 application root
    ├── app/
    │   ├── api/                      # 115+ RBAC-protected REST API routes
    │   │   ├── admin/                # Admin & data engineering APIs
    │   │   ├── ai/                   # Gemini generation & mistake analyzer
    │   │   ├── auth/                 # JWT login, signup, OTP, email verify
    │   │   ├── exams/                # Online CBT, OMR batch sync, CQ strip links, evaluations
    │   │   ├── question-bank/        # Paginated CRUD & Excel bulk upload
    │   │   └── super-user/           # System audit, stats, approvals
    │   ├── components/
    │   │   ├── OMRSheet.tsx          # B&W Board-style auto-calibrating OMR sheet
    │   │   └── omr/                  # Template Studio, 3-Part CQ Sheet, Calibration, Merit List
    │   ├── exams/                    # Exam hub, /print, /omr-scan, /omr-templates, /evaluations, /online
    │   ├── admin/ teacher/ student/ super-user/
    │   ├── globals.css               # Tailwind v4 design tokens, responsive & A11y rules
    │   └── layout.tsx                # Fonts, ThemeProvider, MathJax, ErrorBoundary, Toaster
    ├── lib/
    │   ├── auth-config.ts            # Fail-closed JWT secret & algorithm config
    │   ├── db.ts                     # Singleton Prisma client
    │   ├── studentIdGenerator.ts     # 4-digit Roll & 6-digit Reg generator
    │   └── omr/                      # omrEngine, streamAutoScanner, studentIdentityMatcher, cqSerialLinker
    ├── prisma/
    │   ├── schema.prisma             # Full relational schema + 35+ indexes
    │   └── migrations/               # Version-controlled PostgreSQL migrations
    ├── middleware.ts                 # Edge JWT verification & role-based route protection
    └── next.config.ts                # Security headers, PWA, standalone build
```

---

## 🎯 Available Scripts

Run from `digital_school/digital_school`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Next.js 15 dev server with Turbopack |
| `npm run build` | Generate Prisma client and build production bundle |
| `npm run start` | Start production server (`PORT` defaults to `3000`) |
| `npm run lint` | Run ESLint across the codebase |
| `npm test` | Execute Jest test suite |
| `npm run db:setup` / `db:seed` | Initialize or seed the PostgreSQL database |
| `npm run cap:build` | Build web bundle and sync Android Capacitor project |
| `npm run cap:open` | Open the native Android project in Android Studio |

---

## 🔒 Security & Scalability

### Security Controls
- **Zero SQL Injection**: All database queries use Prisma ORM or parameterized tagged templates (`$queryRaw` / `$executeRaw`).
- **Defense-in-Depth RBAC**: Both Edge `middleware.ts` and server-side route handlers enforce `SUPER_USER` / `ADMIN` / `TEACHER` / `STUDENT` permissions, preventing unauthorized exam tampering, answer-key leaks, or cross-student IDOR.
- **Fail-Closed Auth**: `JWT_SECRET` is strictly required in production (`lib/auth-config.ts`); sessions use signed `HS256` tokens via `jose`.
- **Hardened HTTP Headers (`next.config.ts`)**: Enforces `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and disables `X-Powered-By`.
- **Safe Expression & Code Sandboxing**: Strict identifier allowlisting in `lib/math-parser.ts` and auth + payload/timeout caps on `/api/code/run`.

### Scalability Architecture
- **Edge-Offloaded Computer Vision**: OMR & CQ image alignment/decoding runs in client WebWorkers, allowing 500–2,000+ sheets to be scanned without saturating serverless compute.
- **Pooled & Paginated Data Layer**: Singleton Prisma client + Neon PgBouncer pooling + 35+ database indexes + bounded server-side pagination on Question Bank, Questions, and Exams endpoints.
- **Multi-Device CQ Sync**: Atomic Postgres transactions (`cq_strip_links`) enable parallel scanning across multiple workstations.

---

## 🚀 Deployment

### Microsoft Azure (Production)
`next.config.ts` is configured with `output: 'standalone'` for fast, container-ready Azure App Service / Azure Container Apps deployments:

1. Connect `rofazhasan/digital_school` (`main`) to your Azure App Service / GitHub Actions workflow (working directory: `digital_school`).
2. Configure **Application Settings / Environment Variables** in Azure:
   - `DATABASE_URL` — Neon PostgreSQL pooled connection string
   - `JWT_SECRET` — 64-char random secret (**required** in production)
   - `NEXTAUTH_SECRET` & `NEXTAUTH_URL` (`https://rofazacademy.dev`)
3. Build & start commands:
   ```bash
   npm ci && npm run build
   npm start
   ```

---

## 📝 License

Licensed under the **ISC License** — Copyright © 2024–2026 **Md. Rofaz Hasan Rafiu**.

---

<div align="center">

**Built with ❤️ by Md. Rofaz Hasan Rafiu** — Tangail, Dhaka, Bangladesh

[![Live](https://img.shields.io/badge/Live-rofazacademy.dev-6366f1?style=for-the-badge)](https://rofazacademy.dev)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://rofazhasan.github.io/rofaz-portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rofazhasan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/md-rofaz-hasan-rafiu)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mdrofazhasanrafiu@gmail.com)

</div>
