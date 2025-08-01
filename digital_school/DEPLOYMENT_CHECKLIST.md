# Netlify Deployment Checklist

## Pre-Deployment Checklist

- [ ] **Database Setup**
  - [ ] Create PostgreSQL database (Supabase/Railway/Neon)
  - [ ] Get DATABASE_URL
  - [ ] Test database connection locally

- [ ] **Environment Variables**
  - [ ] Generate secrets: `npm run generate-secrets`
  - [ ] Prepare DATABASE_URL
  - [ ] Set NEXTAUTH_URL (your Netlify domain)
  - [ ] Set NEXT_PUBLIC_APP_URL (your Netlify domain)

- [ ] **Code Preparation**
  - [ ] Commit all changes to Git
  - [ ] Push to GitHub repository
  - [ ] Test build locally: `npm run build`

## Deployment Steps

1. **Connect to Netlify**
   - [ ] Go to [netlify.com](https://netlify.com)
   - [ ] Click "New site from Git"
   - [ ] Select your GitHub repository

2. **Configure Build Settings**
   - [ ] Build command: `npm run build`
   - [ ] Publish directory: `.next`
   - [ ] Node version: `18`

3. **Set Environment Variables**
   - [ ] Go to Site settings > Environment variables
   - [ ] Add DATABASE_URL
   - [ ] Add NEXTAUTH_SECRET
   - [ ] Add JWT_SECRET
   - [ ] Add NEXTAUTH_URL
   - [ ] Add NEXT_PUBLIC_APP_URL
   - [ ] Add GOOGLE_AI_API_KEY (if using)

4. **Deploy**
   - [ ] Click "Deploy site"
   - [ ] Wait for build to complete
   - [ ] Check for any build errors

## Post-Deployment Checklist

- [ ] **Database Setup**
  - [ ] Run Prisma migrations: `npx prisma db push`
  - [ ] Seed database if needed: `npm run db:seed`

- [ ] **Application Testing**
  - [ ] Visit your Netlify URL
  - [ ] Navigate to `/setup`
  - [ ] Create super user account
  - [ ] Test login/logout
  - [ ] Test file uploads
  - [ ] Test exam creation
  - [ ] Test API endpoints

- [ ] **Domain Configuration**
  - [ ] Set up custom domain (optional)
  - [ ] Configure DNS settings
  - [ ] Enable HTTPS

## Troubleshooting

### Build Fails
- [ ] Check build logs in Netlify
- [ ] Verify all dependencies in package.json
- [ ] Check Node.js version is 18

### Database Issues
- [ ] Verify DATABASE_URL is correct
- [ ] Check database allows external connections
- [ ] Ensure SSL is enabled

### Authentication Issues
- [ ] Verify NEXTAUTH_SECRET and JWT_SECRET
- [ ] Check NEXTAUTH_URL matches domain
- [ ] Test cookie settings

### API Routes Not Working
- [ ] Check Next.js plugin is installed
- [ ] Verify netlify.toml redirects
- [ ] Test environment variables

## Quick Commands

```bash
# Generate secrets
npm run generate-secrets

# Test build locally
npm run build

# Deploy to Netlify (if using CLI)
npm run deploy:netlify

# Check environment variables
curl https://your-app.netlify.app/api/test-simple
```

## Environment Variables Template

```
DATABASE_URL=postgresql://user:pass@host:port/db
NEXTAUTH_SECRET=your-generated-secret
JWT_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-app.netlify.app
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
GOOGLE_AI_API_KEY=your-api-key
```

## Support

If you encounter issues:
1. Check the build logs in Netlify
2. Review the troubleshooting section
3. Check the application logs
4. Verify all environment variables are set correctly 