# Environment Variables Setup Guide

## Required Environment Variables

Copy these to your `.env` file in the backend directory:

```bash
# ========================================
# SUPABASE CONFIGURATION (Required)
# ========================================
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ========================================
# JWT SECURITY (Required)
# ========================================
JWT_SECRET=your_very_secure_jwt_secret_key_here

# ========================================
# SERVER CONFIGURATION (Optional)
# ========================================
PORT=3000
NODE_ENV=development

# ========================================
# EMAIL SERVICE - SENDGRID (Required for email reset)
# ========================================
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# ========================================
# SMS SERVICE - TWILIO (Required for phone OTP)
# ========================================
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid

# ========================================
# REDIS CONFIGURATION (Optional - has fallback)
# ========================================
# Development (local Redis)
REDIS_URL=redis://localhost:6379

# Production (choose one):
# REDIS_URL=redis://username:password@host:port
# REDIS_URL=rediss://username:password@host:port (SSL)
# REDIS_TIMEOUT=10

# ========================================
# APPLE SIGN-IN CONFIGURATION (Required for Apple Sign-In)
# ========================================
APPLE_BUNDLE_ID=com.ithoughtofyou.app
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_KEY_ID=your_apple_key_id_here
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
your_apple_private_key_content_here
-----END PRIVATE KEY-----
```

## How to Get Each Value

### 1. Supabase Configuration
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing one
3. Go to Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. JWT Secret
Generate a secure random string:
```bash
# Option 1: Use openssl
openssl rand -base64 32

# Option 2: Use node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Use online generator
# Go to https://generate-secret.vercel.app/32
```

### 3. SendGrid Setup
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Go to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key → `SENDGRID_API_KEY`
5. Set your verified sender email → `SENDGRID_FROM_EMAIL`

### 4. Twilio Setup
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Go to Verify → Services → Create a new service
4. Copy the Service SID → `TWILIO_VERIFY_SERVICE_SID`

### 5. Redis Setup (Optional)
#### Development (Local):
```bash
# Install Redis locally
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu
```

#### Production Options:
- **Redis Cloud**: Get URL from dashboard
- **Upstash**: Get URL from dashboard
- **Heroku**: `heroku addons:create heroku-redis:mini`

## Environment Setup by Platform

### Local Development
1. Copy `.env.example` to `.env`
2. Fill in the values above
3. Start your server: `npm run dev`

### Heroku
```bash
# Set each variable
heroku config:set SUPABASE_URL=your_url
heroku config:set SUPABASE_ANON_KEY=your_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_key
heroku config:set JWT_SECRET=your_secret
heroku config:set SENDGRID_API_KEY=your_key
heroku config:set SENDGRID_FROM_EMAIL=your_email
heroku config:set TWILIO_ACCOUNT_SID=your_sid
heroku config:set TWILIO_AUTH_TOKEN=your_token
heroku config:set TWILIO_VERIFY_SERVICE_SID=your_service_sid
heroku config:set REDIS_URL=your_redis_url
```

### Railway
1. Go to your project dashboard
2. Add each variable in the Variables tab

### DigitalOcean App Platform
1. Go to your app settings
2. Add each variable in the Environment Variables section

### Vercel
1. Go to your project settings
2. Add each variable in the Environment Variables section

## Validation Checklist

Before deploying, verify:

- [ ] All Supabase keys are correct
- [ ] JWT secret is at least 32 characters long
- [ ] SendGrid API key has "Mail Send" permissions
- [ ] SendGrid sender email is verified
- [ ] Twilio Verify service is created and active
- [ ] Redis URL is accessible (if using Redis)
- [ ] All URLs use HTTPS in production

## Testing Your Setup

Run the test script to verify everything works:
```bash
node test-redis.js
```

## Security Notes

- Never commit `.env` files to git
- Use different secrets for development and production
- Rotate secrets regularly in production
- Use strong, unique passwords for all services
- Enable 2FA on all service accounts 