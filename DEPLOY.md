# Deployment Guide for Vheer AI on Render

## Prerequisites
- GitHub account
- Render account (https://render.com)

## Deployment Steps

### 1. Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/vheer-clone.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Using render.yaml (Recommended)
1. Go to https://dashboard.render.com/
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create:
   - PostgreSQL database (vheer-db)
   - Backend API service (vheer-api)
   - Frontend static site (vheer-client)

#### Option B: Manual Setup
1. Create PostgreSQL Database:
   - Go to Dashboard → New → PostgreSQL
   - Name: vheer-db
   - Database: vheer_production
   - User: vheer_admin
   - Region: Oregon (US West)
   - Plan: Free

2. Create Backend Service:
   - Go to Dashboard → New → Web Service
   - Connect GitHub repository
   - Name: vheer-api
   - Root Directory: server
   - Build Command: `npm install`
   - Start Command: `node index.js`
   - Add environment variables from `.env.example`

3. Create Frontend Service:
   - Go to Dashboard → New → Static Site
   - Connect GitHub repository
   - Name: vheer-client
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`

### 3. Environment Variables

Backend service needs:
```
NODE_ENV=production
PORT=5000
DATABASE_URL=(auto-filled from database)
JWT_SECRET=(generate secure random string)
FLUX_API_KEY=2f58d1ef-d2d1-48f0-8c1f-a7b5525748c0
GPT_IMAGE_API_KEY=b5cfe077850a194e434914eedd7111d5
IMGBB_API_KEY=d5872cba0cfa53b44580045b14466f9c
CORS_ORIGIN=https://vheer-client.onrender.com
BASE_URL=https://vheer-api.onrender.com
```

Frontend build needs:
```
VITE_API_URL=https://vheer-api.onrender.com/api
NODE_ENV=production
```

### 4. Post-Deployment

1. Wait for services to deploy (10-15 minutes)
2. Access your app at: https://vheer-client.onrender.com
3. Test API health: https://vheer-api.onrender.com/api/health

## Custom Domain

To add custom domain (e.g., vheer.ai):
1. Go to service settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

## Monitoring

- Check logs in Render Dashboard
- Monitor database connections
- Set up alerts for service health

## Troubleshooting

### CORS Issues
- Ensure CORS_ORIGIN in backend matches frontend URL
- Check that frontend uses correct VITE_API_URL

### Database Connection
- Verify DATABASE_URL is correctly set
- Check PostgreSQL service is running

### Build Failures
- Review build logs in Render Dashboard
- Ensure all dependencies are in package.json
- Check Node.js version compatibility

## Support
For issues, check:
- Render documentation: https://render.com/docs
- Service logs in Render Dashboard
- GitHub repository issues