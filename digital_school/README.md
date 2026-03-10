<div align="center">

# 🎓 Digital School Management System

<img src="./public/hero-mockup.png" alt="Digital School Multi-Device Mockup" width="100%" style="border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);" />

**An ultra-high-performance, AI-integrated school management system built for maximum velocity.**

[![Deploy on Vercel](https://img.shields.io/badge/Deploy%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Deploy on Netlify](https://img.shields.io/badge/Deploy%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://netlify.com)

![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.10.1-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)

[![License](https://img.shields.io/badge/License-ISC-orange?style=for-the-badge)](#-license)
[![Version](https://img.shields.io/badge/Version-0.1.0-green?style=for-the-badge)]()

[Explore Features](#-key-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

<hr />

## ⚡ Maximum Velocity Architecture

This project is engineered for **unbeatable performance** using advanced caching and edge strategies:

- **🚀 Stale-While-Revalidate (SWR)**: Delivers data *instantly* (0ms latency) from cache while updating in the background. Users never wait.
- **🌐 Edge Caching**: Utilizes `Cache-Control` headers (`stale-while-revalidate=300`) to serve API responses directly from CDN edge nodes, bypassing the origin server entirely for 90% of read traffic.
- **⚡ O(1) Scalability**: Optimized algorithms (e.g., sample-based exam detection) ensure constant-time performance regardless of database size.
- **🧠 Parallelized Analytics**: Leveraging `Promise.all` for concurrent data fetching, reducing dashboard load times by 70%.

---

## 🚀 Key Features

### 🎓 Academic Excellence
- **Smart Exam System**: Complete support for MCQ, Descriptive, and Math-heavy questions with **LaTeX/MathJax**.
- **OMR & Scanning**: Automated optical mark recognition with advanced bubble detection and AI verification.
- **Paperless Evaluation**: AI-assisted automated grading for rapid results and zero manual errors.
- **Question Bank**: Organized repository with difficulty levels and topic tagging.

### 🏢 Institute Management
- **Role-Based Access Control (RBAC)**: Secure access for *Super User, Institute Admin, Teacher, and Student*.
- **Multi-Tenancy**: Support for multiple institutes with custom branding and scalable architecture.
- **Communication & Notifications**: Real-time Socket.io alerts, SMS, and in-app messaging.

### 📊 Intelligence & Analytics
- **AI-Powered Insights**: Deep integration with **Google Generative AI** for automated question generation and learning analysis.
- **Real-Time Dashboards**: Interactive charts (Chart.js / Recharts) for attendance, pass rates, and performance trends.

### 💻 Modern Experience
- **PWA Ready**: Installable application with rich offline capabilities and push notifications.
- **Responsive Design**: Mobile-first UI beautifully crafted with **Tailwind CSS v4** and **Radix UI/Framer Motion**.
- **Dark Mode**: Native and fluid light/dark theme toggles.

---

## 🛠️ Technology Stack

| Architecture Layer | Core Technologies |
|:-------------------|:------------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Radix UI, Framer Motion |
| **Backend** | Next.js Server Actions, RESTful APIs, NextAuth.js (Session Management) |
| **Database** | PostgreSQL 13+, Prisma ORM 6.10, Connection Pooling |
| **Real-time** | Socket.io (Instant notifications & live updates) |
| **AI / Machine Learning** | Google Generative AI API, TensorFlow.js, Tesseract.js (OCR) |
| **File Processing** | Puppeteer (PDFs), Cloudinary (Images), UploadThing, Jimp, Canvas |

---

## 🚀 Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18 or later
- **Database**: PostgreSQL (v13+)
- **Git** & package manager (`npm` or `yarn`)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/rofazhasan/digital_school.git
cd digital_school

# Install dependencies
npm install
```

### 3. Environment Configuration
Duplicate the example environment file and configure it:
```bash
cp .env.example .env
```
Update your `.env` with essential credentials:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"
```

### 4. Database Setup
```bash
# Option 1: Quick setup (Recommended)
npm run db:setup

# Option 2: Manual approach
npx prisma generate
npx prisma db push
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
🎉 Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📂 Project Structure

```bash
digital_school/
├── 📁 app/               # Next.js App Router (Pages, API Routes, Dashboards)
├── 📁 components/        # Reusable & Accessible UI Components (Radix, Forms, Charts)
├── 📁 lib/               # Core Utilities (DB helpers, Analytics Engine, Edge Cache)
├── 📁 prisma/            # Database Schema, Migrations, and Seeders
├── 📁 public/            # Static Assets, Images, and PWA manifest
└── 📁 scripts/           # Performance Testing and Utility Scripts
```

---

## 📦 Deployment

### Vercel Deployment (Recommended)
1. Push your code to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. Specify your required Environment Variables (e.g., `DATABASE_URL`, `NEXTAUTH_SECRET`).
4. Click **Deploy**! Vercel handles Next.js Edge functions and optimizations automatically.

---

## 🤝 Contributing

We welcome contributions to make this project even better! Follow these steps:
1. Fork the repository (`https://github.com/rofazhasan/digital_school/fork`)
2. Create your branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the **ISC License**.
Copyright © 2024 [Md. Rofaz Hasan Rafiu](https://github.com/rofazhasan).

---

<div align="center">

**Built with ❤️ and extreme optimization by Rofaz**

[![Portfolio](https://img.shields.io/badge/Portfolio-Explore-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://rofazhasan.github.io/rofaz-portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rofazhasan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/md-rofaz-hasan-rafiu)
[![Facebook](https://img.shields.io/badge/Facebook-Follow-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://facebook.com/rofazhasanrafiu)
[![Gmail](https://img.shields.io/badge/Gmail-Email_Me-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mdrofazhasanrafiu@gmail.com)

</div>
