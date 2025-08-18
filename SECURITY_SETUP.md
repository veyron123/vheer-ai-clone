# 🔒 Security Setup Guide for Vheer AI

## Overview
This guide covers the security improvements implemented in the Vheer AI platform and how to properly configure them.

## ✅ Implemented Security Improvements

### 1. API Keys Protection
- ✅ Removed all API keys from `render.yaml`
- ✅ Keys must now be configured in Render Dashboard or environment variables
- ✅ Added comments in `render.yaml` indicating which keys need to be set

### 2. Environment Variable Validation
- ✅ Created `server/config/validateEnv.js` for startup validation
- ✅ Application fails fast if critical variables are missing in production
- ✅ Provides clear error messages about missing configuration

### 3. Secure Logging
- ✅ Removed console.log statements with sensitive data
- ✅ Created `server/utils/logger.js` for safe logging
- ✅ Automatically masks sensitive data in logs

### 4. CORS Configuration
- ✅ Implemented proper CORS configuration in `server/config/cors.config.js`
- ✅ Environment-aware origin validation
- ✅ Security headers added (X-Frame-Options, CSP, etc.)

### 5. Enhanced .env.example
- ✅ Comprehensive documentation of all environment variables
- ✅ Clear instructions for generating secure secrets
- ✅ Organized by category for easy setup

## 🚀 Setup Instructions

### Step 1: Environment Variables

1. Copy the example file:
```bash
cp .env.example .env
```

2. Generate secure secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32
```

3. Fill in your API keys and configuration in `.env`

### Step 2: Render Dashboard Configuration

For production deployment on Render:

1. Go to your Render Dashboard
2. Navigate to your service
3. Go to "Environment" tab
4. Add the following environment variables:
   - `FLUX_API_KEY`
   - `FLUX_API_URL`
   - `GPT_IMAGE_API_KEY`
   - `GPTIMAGE_API_URL`
   - `IMGBB_API_KEY`
   - `VITE_FAL_API_KEY` (for frontend)
   - `VITE_FLUX_API_KEY` (for frontend)

### Step 3: CORS Configuration

Update `CORS_ORIGIN` in your environment:

**Development:**
```env
CORS_ORIGIN=http://localhost:5173
```

**Production:**
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Step 4: Verify Configuration

Start the server and check the console output:
```bash
npm run dev
```

You should see:
```
🔧 Environment Configuration Check
===================================
✅ All required environment variables are set
===================================
```

## 🛡️ Security Best Practices

### Never Commit Secrets
- ❌ Never commit `.env` files
- ❌ Never hardcode API keys
- ✅ Use environment variables
- ✅ Use Render Dashboard for production secrets

### Rotate Keys Regularly
- Change API keys every 90 days
- Update JWT secrets if compromised
- Monitor API usage for anomalies

### Monitor Logs
- Review logs regularly for suspicious activity
- Set up alerts for authentication failures
- Monitor CORS violations

### Keep Dependencies Updated
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📝 Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Token signing secret | 32+ character string |
| `FLUX_API_KEY` | Flux AI API key | Your API key |
| `GPT_IMAGE_API_KEY` | GPT Image API key | Your API key |
| `IMGBB_API_KEY` | Image storage API | Your API key |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |
| `SESSION_SECRET` | OAuth session secret | Generated |

## 🔍 Troubleshooting

### Missing Environment Variables
If you see errors about missing variables:
1. Check your `.env` file exists
2. Verify all required variables are set
3. Restart the server after changes

### CORS Errors
If you get CORS errors:
1. Check `CORS_ORIGIN` matches your frontend URL
2. Include protocol (http:// or https://)
3. Multiple origins must be comma-separated

### Authentication Issues
If authentication fails:
1. Verify `JWT_SECRET` is set and consistent
2. Check token expiration settings
3. Ensure cookies are enabled for OAuth

## 📞 Support

For security concerns or questions:
- Create an issue on GitHub (don't include sensitive data)
- Contact the development team
- Review the security documentation

---

**Last Updated:** 2025-01-18  
**Version:** 1.0.0