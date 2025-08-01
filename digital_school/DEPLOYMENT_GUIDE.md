# Netlify Deployment Guide for Digital School

This guide will help you deploy your Digital School application on Netlify.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **Database**: You'll need a PostgreSQL database (recommended: Supabase, Railway, or Neon)
4. **Environment Variables**: Prepare your environment variables

## Step 1: Prepare Your Database

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your database URL from Settings > Database
4. Run your Prisma migrations:
   ```bash
   npx prisma db push
   ```

### Option B: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Get your database URL from the database settings

### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Get your database URL from the connection details

## Step 2: Set Up Environment Variables

You'll need to set these environment variables in Netlify:

### Required Variables:
- `DATABASE_URL`: Your PostgreSQL database URL
- `NEXTAUTH_SECRET`: A random string for NextAuth (generate with `openssl rand -base64 32`)
- `JWT_SECRET`: A random string for JWT (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your Netlify app URL (e.g., `https://your-app.netlify.app`)
- `NEXT_PUBLIC_APP_URL`: Your Netlify app URL

### Optional Variables:
- `GOOGLE_AI_API_KEY`: For AI features (if you have one)

## Step 3: Deploy to Netlify

### Method 1: Deploy from Git (Recommended)

1. **Connect to GitHub**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose GitHub and select your repository

2. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: `18`

3. **Set Environment Variables**:
   - Go to Site settings > Environment variables
   - Add all the required environment variables listed above

4. **Deploy**:
   - Click "Deploy site"
   - Wait for the build to complete

### Method 2: Deploy from CLI

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**:
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Step 4: Configure Custom Domain (Optional)

1. Go to your Netlify site settings
2. Click "Domain settings"
3. Add your custom domain
4. Configure DNS settings as instructed

## Step 5: Set Up Database

After deployment, you need to set up your database:

1. **Run Prisma Migrations**:
   ```bash
   npx prisma db push
   ```

2. **Seed the Database** (if needed):
   ```bash
   npm run db:seed
   ```

## Step 6: Verify Deployment

1. Visit your Netlify URL
2. Navigate to `/setup` to create your first super user
3. Test the main features:
   - Login/logout
   - Create exams
   - Upload files
   - Generate reports

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check the build logs in Netlify
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version is 18

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Check if your database allows external connections
   - Ensure SSL is enabled for production databases

3. **API Routes Not Working**:
   - Check that the Next.js plugin is installed
   - Verify redirects in `netlify.toml`
   - Check environment variables

4. **Authentication Issues**:
   - Verify `NEXTAUTH_SECRET` and `JWT_SECRET` are set
   - Check `NEXTAUTH_URL` matches your domain
   - Ensure cookies are working (check domain settings)

5. **File Upload Issues**:
   - Check if your upload directory is writable
   - Verify file size limits
   - Check CORS settings

### Debug Commands:

```bash
# Check build locally
npm run build

# Test database connection
npm run db:setup

# Check environment variables
npm run test-simple
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `NEXTAUTH_SECRET` | Secret for NextAuth | `generated-random-string` |
| `JWT_SECRET` | Secret for JWT tokens | `generated-random-string` |
| `NEXTAUTH_URL` | Your app URL | `https://your-app.netlify.app` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://your-app.netlify.app` |
| `GOOGLE_AI_API_KEY` | Google AI API key | `your-api-key` |

## Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **Database**: Use SSL connections in production
3. **CORS**: Configure CORS properly for your domain
4. **Headers**: Security headers are configured in `netlify.toml`
5. **HTTPS**: Netlify provides HTTPS by default

## Performance Optimization

1. **Caching**: Static assets are cached for 1 year
2. **CDN**: Netlify provides global CDN
3. **Image Optimization**: Configured in `next.config.ts`
4. **Bundle Analysis**: Use `@next/bundle-analyzer` for optimization

## Monitoring

1. **Netlify Analytics**: Enable in site settings
2. **Error Tracking**: Consider adding Sentry
3. **Performance**: Monitor Core Web Vitals
4. **Database**: Monitor connection pool and queries

## Support

If you encounter issues:

1. Check the build logs in Netlify
2. Review the troubleshooting section above
3. Check the application logs
4. Verify all environment variables are set correctly

## Next Steps

After successful deployment:

1. Set up monitoring and analytics
2. Configure backups for your database
3. Set up CI/CD for automatic deployments
4. Consider setting up staging environment
5. Implement proper logging and error tracking 