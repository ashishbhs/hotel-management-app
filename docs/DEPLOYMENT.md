# Hotel Management Pro - Deployment Guide

## Overview

This guide covers deploying the Hotel Management Pro application to Vercel with Supabase as the backend database.

## Prerequisites

- Node.js 18+ installed
- Vercel account
- Supabase account
- Git repository (recommended)

## Step 1: Set Up Supabase

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub, Google, or email
4. Create a new organization (or use existing)
5. Create a new project:
   - **Project name**: `hotel-management-pro`
   - **Database password**: Generate a strong password
   - **Region**: Choose closest to your users
   - **Pricing tier**: Free tier is sufficient for development

### 1.2 Get Database Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (SUPABASE_URL)
   - **service_role** key (SUPABASE_SERVICE_KEY)
   - **anon** key (SUPABASE_ANON_KEY)

### 1.3 Set Up Database Tables

1. Go to **SQL Editor** in Supabase
2. Copy and paste the SQL from `scripts/setup-database.js`
3. Click **Run** to execute the SQL

Alternatively, run the setup script:
```bash
# Create .env file with your Supabase credentials
cp .env.example .env
# Edit .env with your actual credentials

# Run the setup script
npm run setup-db
```

## Step 2: Set Up Vercel

### 2.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 2.2 Login to Vercel

```bash
vercel login
```

### 2.3 Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

### 2.4 Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Deploy from project root
vercel

# Follow the prompts:
# - Set up and deploy? [Y/n] y
# - Which scope do you want to deploy to? (choose your account)
# - Link to existing project? [y/N] n
# - What's your project's name? hotel-management-pro
# - In which directory is your code located? ./
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`

### 2.5 Add Environment Variables in Vercel

1. In Vercel dashboard, go to your project
2. Go to **Settings** → **Environment Variables**
3. Add the following variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

## Step 3: Configure CORS

### 3.1 Update Supabase CORS Settings

1. In Supabase, go to **Settings** → **API**
2. Under **CORS**, add your Vercel URL:
   - `https://your-app-name.vercel.app`
   - `http://localhost:3000` (for local development)

### 3.2 Update API CORS Origins

In each API file (`api/guests.js`, `api/rooms.js`, `api/bookings.js`), update the CORS origins:

```javascript
const corsMiddleware = cors({
  origin: [
    'http://localhost:3000',
    'https://your-app-name.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
```

## Step 4: Verify Deployment

### 4.1 Test API Endpoints

```bash
# Test guests endpoint
curl https://your-app-name.vercel.app/api/guests

# Test rooms endpoint
curl https://your-app-name.vercel.app/api/rooms

# Test bookings endpoint
curl https://your-app-name.vercel.app/api/bookings
```

### 4.2 Test Frontend

Visit your deployed application:
`https://your-app-name.vercel.app`

## Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Vercel

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Click **Add** and enter your domain
3. Follow the DNS configuration instructions

### 5.2 Update CORS Origins

Add your custom domain to:
- Supabase CORS settings
- API CORS origins array

## Environment Configuration

### Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

### Production Environment

```bash
# Deploy to Vercel
vercel --prod
```

## Troubleshooting

### Common Issues

#### 1. CORS Errors
**Problem**: Browser shows CORS policy errors
**Solution**: 
- Verify your Vercel URL is added to Supabase CORS settings
- Check API CORS origins include your deployed URL

#### 2. Database Connection Errors
**Problem**: API returns database connection errors
**Solution**:
- Verify environment variables are correctly set in Vercel
- Check Supabase project is active
- Ensure service role key has correct permissions

#### 3. Build Failures
**Problem**: Vercel build fails
**Solution**:
- Check package.json has correct dependencies
- Ensure all API files have correct syntax
- Verify import statements are correct

#### 4. Runtime Errors
**Problem**: Application loads but API calls fail
**Solution**:
- Check Vercel function logs
- Verify Supabase tables exist
- Check API routes are correctly configured

### Debugging Steps

1. **Check Vercel Logs**:
   ```bash
   vercel logs
   ```

2. **Test API Directly**:
   ```bash
   curl -X GET https://your-app.vercel.app/api/guests
   ```

3. **Check Environment Variables**:
   ```bash
   vercel env ls
   ```

4. **Verify Database**:
   - Check Supabase dashboard
   - Run test queries in SQL Editor

## Performance Optimization

### 1. Enable Caching
Add caching headers to API responses:
```javascript
res.setHeader('Cache-Control', 'public, max-age=300');
```

### 2. Optimize Images
Compress images in `public/images/` directory.

### 3. Enable Compression
Vercel automatically compresses responses.

### 4. Database Indexing
Ensure proper indexes exist on frequently queried columns.

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to Git
- Use Vercel environment variables for production
- Rotate keys regularly

### 2. API Security
- Rate limiting is configured (100 requests/minute)
- Input validation on all endpoints
- SQL injection protection via Supabase

### 3. HTTPS
- Vercel automatically provides SSL certificates
- All API calls should use HTTPS

## Monitoring and Analytics

### 1. Vercel Analytics
Enable in Vercel dashboard for usage insights.

### 2. Supabase Monitoring
Monitor database usage and performance in Supabase dashboard.

### 3. Error Tracking
Consider integrating error tracking services.

## Backup and Recovery

### 1. Database Backups
Supabase automatically creates daily backups on paid tiers.

### 2. Code Backup
Keep code in Git repository for easy recovery.

### 3. Configuration Backup
Document environment variables and settings.

## Scaling Considerations

### 1. Database Scaling
- Monitor Supabase usage limits
- Consider upgrading to paid tier for higher limits

### 2. API Scaling
- Vercel automatically scales serverless functions
- Monitor function execution time and memory usage

### 3. Frontend Optimization
- Implement lazy loading for large datasets
- Consider pagination for improved performance

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Repository](https://github.com/your-username/hotel-management-pro)

For specific issues:
1. Check Vercel function logs
2. Review Supabase error logs
3. Verify API endpoint functionality
4. Test with sample data
