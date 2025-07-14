# Environment Variables Quick Reference

## 🚨 CRITICAL - Must Set These

```bash
# Supabase (Database)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Email (Password Reset)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# SMS (Phone OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
```

## 📍 OPTIONAL - Nice to Have

```bash
# Server
PORT=3000
NODE_ENV=production

# Redis (Password Reset Tokens)
REDIS_URL=redis://localhost:6379
REDIS_TIMEOUT=10
```

## 🔧 Quick Setup Commands

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Test Redis (if using)
```bash
node test-redis.js
```

### Start Development Server
```bash
npm run dev
```

## 📋 Deployment Checklist

- [ ] Supabase project created and keys copied
- [ ] JWT secret generated (32+ characters)
- [ ] SendGrid account with verified sender email
- [ ] Twilio account with Verify service created
- [ ] Redis URL configured (optional)
- [ ] All variables set in deployment platform
- [ ] Test password reset flow
- [ ] Test phone OTP flow 