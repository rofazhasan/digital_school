# Setup Page Troubleshooting Guide

This guide helps you resolve the internal server error on the setup page at `https://digitalsch.netlify.app/setup`.

## Quick Diagnosis

Run the diagnostic script to identify the issue:

```bash
node scripts/diagnose-setup-error.js
```

## Common Causes and Solutions

### 1. Missing Environment Variables

**Symptoms:**
- 500 Internal Server Error
- Error messages mentioning "DATABASE_URL" or "JWT_SECRET"

**Solution:**
Set the required environment variables in your deployment platform:

#### For Netlify:
1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Add the following variables:

```bash
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-jwt-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="https://digitalsch.netlify.app"
```

#### For Render:
1. Go to your Render dashboard
2. Navigate to your service → Environment
3. Add the environment variables listed above

#### For Vercel:
1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Environment Variables
3. Add the environment variables listed above

### 2. Database Connection Issues

**Symptoms:**
- 500 Internal Server Error
- Error messages mentioning "connection" or "database"

**Solution:**
1. Verify your `DATABASE_URL` is correct
2. Ensure your database is accessible from your deployment platform
3. Run database migrations:

```bash
npx prisma migrate deploy
```

### 3. Super User Already Exists

**Symptoms:**
- 400 Bad Request
- Error message: "Super user already exists"

**Solution:**
This is expected behavior. Only one super user can exist in the system. If you need to reset:

1. Access your database directly
2. Delete the existing super user and institute
3. Or use the reset script:

```bash
node scripts/reset-db.js
```

### 4. JWT Configuration Issues

**Symptoms:**
- 500 Internal Server Error
- Error messages mentioning "JWT_SECRET"

**Solution:**
1. Generate a secure JWT secret:

```bash
node scripts/generate-secrets.js
```

2. Set the generated `JWT_SECRET` in your environment variables

### 5. Prisma Client Issues

**Symptoms:**
- 500 Internal Server Error
- Error messages mentioning "schema" or "Prisma"

**Solution:**
1. Regenerate Prisma client:

```bash
npx prisma generate
```

2. Run database migrations:

```bash
npx prisma migrate deploy
```

## Testing the Setup API

Test the API endpoint directly:

```bash
node scripts/test-setup-api.js
```

This will help identify if the issue is with the API or the frontend.

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key-here` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | `your-nextauth-secret` |
| `NEXTAUTH_URL` | Your site URL | `https://digitalsch.netlify.app` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_AI_API_KEY` | Google Gemini API key | `your-gemini-api-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `your-api-key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `your-api-secret` |

## Database Setup

### PostgreSQL Database Requirements

1. **Database Type:** PostgreSQL
2. **Required Tables:** The application will create tables automatically via Prisma migrations
3. **Connection:** Must be accessible from your deployment platform

### Database Migration

If you need to run migrations manually:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional)
npm run db:seed
```

## Deployment Platform Specific Instructions

### Netlify

1. **Environment Variables:**
   - Go to Site settings → Environment variables
   - Add all required variables

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Functions:**
   - Ensure Netlify Functions are enabled
   - API routes should work automatically

### Render

1. **Environment Variables:**
   - Go to your service → Environment
   - Add all required variables

2. **Build Settings:**
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

### Vercel

1. **Environment Variables:**
   - Go to your project → Settings → Environment Variables
   - Add all required variables

2. **Build Settings:**
   - Framework preset: Next.js
   - Build command: `npm run build`

## Debugging Steps

1. **Check Environment Variables:**
   ```bash
   node scripts/diagnose-setup-error.js
   ```

2. **Test Database Connection:**
   ```bash
   node scripts/test-db-connection.js
   ```

3. **Test API Endpoint:**
   ```bash
   node scripts/test-setup-api.js
   ```

4. **Check Logs:**
   - Netlify: Functions → Logs
   - Render: Logs tab
   - Vercel: Functions → Logs

## Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "DATABASE_URL environment variable is not set" | Missing database URL | Set DATABASE_URL environment variable |
| "JWT_SECRET environment variable is not set" | Missing JWT secret | Set JWT_SECRET environment variable |
| "Super user already exists" | Super user already created | This is expected - only one super user allowed |
| "Database connection error" | Database not accessible | Check DATABASE_URL and database accessibility |
| "Database schema error" | Missing migrations | Run `npx prisma migrate deploy` |

## Getting Help

If you're still experiencing issues:

1. Run the diagnostic script and share the output
2. Check your deployment platform logs
3. Verify all environment variables are set correctly
4. Ensure your database is accessible from your deployment platform

## Security Notes

- Never commit environment variables to version control
- Use strong, unique secrets for JWT_SECRET and NEXTAUTH_SECRET
- Regularly rotate your secrets in production
- Use environment-specific databases (dev/staging/prod) 