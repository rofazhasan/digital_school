# Digital School Management System

<div align="center">

![Digital School](https://img.shields.io/badge/Digital-School-blue?style=for-the-badge&logo=next.js)
![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.10.1-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)

**A comprehensive digital school management system built with modern web technologies**

[![Deploy on Vercel](https://img.shields.io/badge/Deploy%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Deploy on Netlify](https://img.shields.io/badge/Deploy%20on-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://netlify.com)

</div>

---

## 👨‍💻 Developer Information

**Developer:** Md. Rofaz Hasan Rafiu  
**Email:** mdrofazhasanrafiu@gmail.com  
**Portfolio:** [rofazhasan.github.io](https://rofazhasan.github.io/rofaz-portfolio/)  
**GitHub:** [@rofazhasan](https://github.com/rofazhasan)  
**LinkedIn:** [Md. Rofaz Hasan Rafiu](https://linkedin.com/in/md-rofaz-hasan-rafiu)  
**Facebook:** [Rofaz Hasan Rafiu](https://facebook.com/rofazhasanrafiu)  

**Project:** Digital School Management System  
**Version:** 0.1.0  
**License:** ISC License  
**Status:** Active Development  


## 🚀 Features

### 🎓 Core Academic Features
- **Exam Management System**
  - Create and manage comprehensive exams
  - Support for multiple question types (MCQ, Descriptive, Math)
  - LaTeX and MathJax support for mathematical expressions
  - Question bank management with categorization
  - Exam scheduling and time management

- **OMR (Optical Mark Recognition) System**
  - Advanced bubble detection and classification
  - QR code integration for exam identification
  - Real-time image processing and validation
  - Batch processing capabilities
  - Error review and correction system

- **Result Management**
  - Automated grading and scoring
  - Detailed result analytics and reports
  - Individual and bulk result generation
  - Result review and appeal system
  - Export to PDF and Excel formats

### 👥 User Management
- **Role-Based Access Control**
  - Super User (System Administrator)
  - Institute Admin
  - Teacher/Evaluator
  - Student
  - Custom permission system

- **Institute Management**
  - Multi-institute support
  - Custom branding and themes
  - Institute-specific settings
  - User management per institute

### 📊 Analytics & Reporting
- **Comprehensive Analytics Dashboard**
  - Real-time performance metrics
  - Student progress tracking
  - Exam statistics and trends
  - Attendance monitoring
  - AI usage analytics

- **Advanced Reporting**
  - Custom report generation
  - Data export capabilities
  - Chart.js integration for visualizations
  - Export to multiple formats

### 🔔 Communication & Notifications
- **Real-time Notifications**
  - Socket.io integration
  - Push notifications
  - Email notifications
  - In-app notification system

- **Communication Tools**
  - Chat system for teachers and students
  - Notice board management
  - Announcement system
  - File sharing capabilities

### 🎨 Modern UI/UX
- **Responsive Design**
  - Mobile-first approach
  - Progressive Web App (PWA) support
  - Dark/Light theme toggle
  - Accessibility features

- **Advanced UI Components**
  - Radix UI components
  - Framer Motion animations
  - Custom design system
  - Interactive charts and graphs

### 🤖 AI Integration
- **Google Generative AI**
  - AI-powered question generation
  - Automated grading assistance
  - Content analysis and suggestions
  - Smart recommendations

### 📱 Progressive Web App
- **PWA Features**
  - Offline functionality
  - App-like experience
  - Push notifications
  - Install prompts
  - Service worker integration

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Database
- **Prisma 6.10.1** - Database ORM
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication system
- **Socket.io** - Real-time communication

### AI & ML
- **Google Generative AI** - AI-powered features
- **TensorFlow.js** - Machine learning capabilities
- **Tesseract.js** - OCR functionality

### File Processing
- **Puppeteer** - PDF generation
- **React PDF** - PDF rendering
- **Jimp** - Image processing
- **Canvas** - Graphics manipulation

### Math & Science
- **KaTeX** - Math rendering
- **MathJax** - Mathematical expressions
- **React MathLive** - Math input
- **Better React MathJax** - Enhanced math display

### Utilities
- **Cloudinary** - Cloud image management
- **UploadThing** - File upload service
- **QR Code** - QR code generation
- **Excel/CSV** - Data import/export

---

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn** package manager
- **PostgreSQL** database (13+)
- **Git** for version control

### System Requirements
- **RAM:** Minimum 4GB (8GB recommended)
- **Storage:** 2GB free space
- **OS:** Windows, macOS, or Linux

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rofazhasan/digital_school.git
cd digital_school
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloud Services (Optional)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# AI Services (Optional)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

# File Upload (Optional)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
```

### 4. Database Setup

#### Option 1: Quick Setup (Recommended)
```bash
npm run db:setup
```

#### Option 2: Manual Setup
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npm run db:seed
```

#### Option 3: Fresh Start
```bash
# Reset and setup database
npm run db:fresh
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🗄️ Database Setup Options

### Option 1: Vercel Postgres (Recommended for Vercel deployment)
1. Go to your [Vercel dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to Storage tab
4. Create a new Postgres database
5. Copy the connection string
6. Add it as `DATABASE_URL` environment variable

### Option 2: Supabase (Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string
5. Add it as `DATABASE_URL` environment variable

### Option 3: PlanetScale (Free tier available)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Copy the connection string
4. Add it as `DATABASE_URL` environment variable

### Option 4: Neon (Serverless Postgres)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it as `DATABASE_URL` environment variable

---

## 📁 Project Structure

```
digital_school/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 api/                      # API Routes
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   ├── 📁 exams/                # Exam management APIs
│   │   ├── 📁 analytics/            # Analytics and reporting
│   │   ├── 📁 student/              # Student-specific APIs
│   │   └── 📁 admin/                # Admin panel APIs
│   ├── 📁 dashboard/                # Main dashboard
│   ├── 📁 exams/                    # Exam management pages
│   ├── 📁 admin/                    # Admin panel
│   ├── 📁 student/                  # Student portal
│   ├── 📁 teacher/                  # Teacher portal
│   └── 📁 super-user/               # Super user panel
├── 📁 components/                    # Reusable UI components
│   ├── 📁 ui/                       # Base UI components
│   ├── 📁 analytics/                # Analytics components
│   └── 📁 forms/                    # Form components
├── 📁 lib/                          # Utility libraries
│   ├── 📁 api/                      # API utilities
│   ├── 📁 auth/                     # Authentication utilities
│   ├── 📁 db/                       # Database utilities
│   └── 📁 utils/                    # General utilities
├── 📁 prisma/                       # Database schema and migrations
│   ├── 📄 schema.prisma             # Database schema
│   ├── 📁 migrations/               # Database migrations
│   └── 📄 seed.ts                   # Database seeder
├── 📁 scripts/                      # Utility scripts
├── 📁 types/                        # TypeScript type definitions
├── 📁 public/                       # Static assets
└── 📁 utils/                        # Additional utilities
```

---

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database Management
npm run db:setup         # Quick database setup
npm run db:reset         # Reset database
npm run db:fresh         # Fresh database setup
npm run db:seed          # Seed database with initial data

# Production
npm run build:deploy     # Build for deployment
npm run deploy:netlify   # Deploy to Netlify

# Utilities
npm run generate-secrets # Generate secure secrets
npm run setup-production # Production environment setup
npm run monitor-performance # Performance monitoring
```

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

3. **Set Environment Variables**
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Your NextAuth secret
   - `NEXTAUTH_URL` - Your production URL

4. **Deploy**
   - Vercel will automatically build and deploy
   - Database migrations will run automatically

### Netlify Deployment

```bash
npm run deploy:netlify
```

### Manual Deployment

```bash
# Build the application
npm run build

# Start the production server
npm start
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ | - |
| `NEXTAUTH_URL` | Application URL | ✅ | `http://localhost:3000` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI API key | ❌ | - |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ❌ | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ❌ | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ❌ | - |

### Database Configuration

The application uses Prisma with PostgreSQL. Key features:

- **Connection Pooling** - Optimized database connections
- **Migration System** - Version-controlled schema changes
- **Seeding** - Initial data population
- **Optimization** - Query optimization and indexing

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=exam
```

---

## 📊 Performance Optimization

### Database Optimization
- Connection pooling
- Query optimization
- Indexed queries
- Efficient migrations

### Frontend Optimization
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

### Caching Strategy
- Redis caching (optional)
- Browser caching
- CDN integration
- Static generation

---

## 🔒 Security Features

- **Authentication & Authorization**
  - NextAuth.js integration
  - Role-based access control
  - JWT token management
  - Session management

- **Data Protection**
  - Input validation with Zod
  - SQL injection prevention
  - XSS protection
  - CSRF protection

- **File Security**
  - Secure file uploads
  - File type validation
  - Size limits
  - Virus scanning

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation
- Follow the existing code style

---

## 📝 License

This project is licensed under the **ISC License**.

```
Copyright (c) 2024 Md. Rofaz Hasan Rafiu

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 📞 Support & Contact

**Developer:** Md. Rofaz Hasan Rafiu  
**Email:** mdrofazhasanrafiu@gmail.com  
**Portfolio:** [rofazhasan.github.io](https://rofazhasan.github.io/rofaz-portfolio/)  
**GitHub:** [@rofazhasan](https://github.com/rofazhasan)  
**LinkedIn:** [Md. Rofaz Hasan Rafiu](https://linkedin.com/in/md-rofaz-hasan-rafiu)  
**Facebook:** [Rofaz Hasan Rafiu](https://facebook.com/rofazhasanrafiu)  
**Address:** Tangail, Dhaka, Bangladesh

### 💼 Professional Services
Feel free to reach out to me with any inquiries, project proposals, or just to say hello. I'm here to assist you with any questions you may have. Let's start a conversation and explore how we can collaborate to bring your ideas to life.

**Services Available:**
- 🎨 **Web Design & Development**
- 📱 **Mobile App Development**
- 📢 **Digital Advertising & Marketing**
- 🤖 **AI & Machine Learning Solutions**
- 📊 **Data Analysis & Visualization**

### Getting Help

- 📖 **Documentation:** Check the project wiki
- 🐛 **Bug Reports:** Create an issue on GitHub
- 💡 **Feature Requests:** Submit via GitHub issues
- 💬 **Discussions:** Join our GitHub discussions
- 📧 **Direct Contact:** mdrofazhasanrafiu@gmail.com

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Prisma Team** - For the excellent ORM
- **Vercel Team** - For seamless deployment
- **Open Source Community** - For all the amazing libraries

---

<div align="center">

**Made with ❤️ by Md. Rofaz Hasan Rafiu**

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=About.me&logoColor=white)](https://rofazhasan.github.io/rofaz-portfolio/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/rofazhasan)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/md-rofaz-hasan-rafiu)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://facebook.com/rofazhasanrafiu)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:mdrofazhasanrafiu@gmail.com)

</div> 
