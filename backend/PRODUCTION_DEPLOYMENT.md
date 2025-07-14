# Production Deployment Guide

## Redis Setup for Production

### Option 1: Redis Cloud (Recommended)
1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Get your connection URL from the dashboard
4. Set `REDIS_URL` in your environment variables

### Option 2: Upstash Redis
1. Sign up at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Copy the connection URL
4. Set `REDIS_URL` in your environment variables

### Option 3: Self-hosted Redis
1. Install Redis on your server
2. Configure Redis with authentication
3. Set up SSL/TLS if needed
4. Configure your connection URL

## Environment Variables for Production

```bash
# Required
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_very_secure_jwt_secret_key_here
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid

# Redis (choose one)
REDIS_URL=redis://username:password@host:port
# or for SSL
REDIS_URL=rediss://username:password@host:port

# Optional
PORT=3000
NODE_ENV=production
REDIS_TIMEOUT=10
```

## Deployment Platforms

### Heroku
1. Create a new Heroku app
2. Add Redis addon: `heroku addons:create heroku-redis:mini`
3. Set environment variables in Heroku dashboard
4. Deploy your code

### Railway
1. Connect your GitHub repository
2. Add Redis service in Railway dashboard
3. Set environment variables
4. Deploy automatically

### DigitalOcean App Platform
1. Connect your GitHub repository
2. Add Redis database component
3. Configure environment variables
4. Deploy

### AWS/GCP/Azure
1. Set up a Redis instance (ElastiCache, Memorystore, etc.)
2. Deploy your Node.js app
3. Configure environment variables
4. Set up load balancing

## Health Checks

Your app includes health check endpoints:
- `/health` - Basic server and Redis status
- `/test-db` - Database connection test

## Monitoring

### Redis Monitoring
- Monitor Redis memory usage
- Set up alerts for connection failures
- Track token storage/retrieval success rates

### Application Monitoring
- Set up logging (Winston, Bunyan, etc.)
- Monitor API response times
- Track error rates

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Enable Redis authentication
- [ ] Use SSL/TLS for Redis connections
- [ ] Set up proper CORS configuration
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up proper error handling
- [ ] Configure proper logging

## Fallback Strategy

The app includes a robust fallback strategy:
- If Redis is unavailable, tokens are stored in memory
- Automatic cleanup of expired tokens
- Graceful degradation without service interruption

## Troubleshooting

### Redis Connection Issues
1. Check `REDIS_URL` format
2. Verify network connectivity
3. Check Redis server status
4. Review connection logs

### Token Storage Issues
1. Check Redis memory usage
2. Verify token expiration settings
3. Review fallback storage logs

### Performance Issues
1. Monitor Redis response times
2. Check memory usage
3. Review connection pooling
4. Optimize token cleanup frequency 