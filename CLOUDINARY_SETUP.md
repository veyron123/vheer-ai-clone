# 🖼️ Cloudinary Setup for Render Deployment

## 📋 Contents
1. [Creating Cloudinary Account](#1-creating-cloudinary-account)
2. [Getting API Keys](#2-getting-api-keys)
3. [Setting up Render Environment Variables](#3-setting-up-render-environment-variables)
4. [Testing Integration](#4-testing-integration)
5. [Monitoring and Debugging](#5-monitoring-and-debugging)

---

## 1. Creating Cloudinary Account

### Step 1: Registration
1. Go to [cloudinary.com](https://cloudinary.com)
2. Click **"Start for free"**
3. Fill out the registration form
4. Confirm your email

### Step 2: Free Plan
✅ **Free plan includes:**
- 25GB storage
- 25GB monthly bandwidth
- 25,000 transformations
- Global CDN
- Automatic optimization

---

## 2. Getting API Keys

### Step 1: Dashboard
1. Log in to [Cloudinary Console](https://console.cloudinary.com)
2. On the main page, find the **"Account Details"** section

### Step 2: Copy Credentials
Copy the following data:

```bash
Cloud Name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz-ABCD
```

### 🔐 Security
⚠️ **IMPORTANT:** Never publish API Secret in your code!

---

## 3. Setting up Render Environment Variables

### Step 1: Render Dashboard
1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Select your Web Service
3. Go to **Environment**

### Step 2: Adding Variables
Add the following environment variables:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz-ABCD

# Production settings
NODE_ENV=production
SERVER_URL=https://your-service.onrender.com
```

### Step 3: Deploy
After adding variables, click **"Manual Deploy"**

---

## 4. Testing Integration

### Step 1: Check Logs
In Render Dashboard, check the startup logs:

```bash
✅ Look for logs like:
🟢 Cloudinary configured for production storage
```

### Step 2: Test Generation
1. Login as `@unitradecargo_1755153796918`
2. Generate an image
3. Check "My Images" in profile

### Step 3: Cloudinary Media Library
1. In Cloudinary Console go to **Media Library**
2. Check the `vheer-ai/generated` folder
3. Uploaded images should appear

---

## 5. Monitoring and Debugging

### Cloudinary Usage
In Cloudinary Dashboard:
- **Dashboard > Usage** - usage statistics
- **Media Library** - all uploaded files
- **Transformations** - transformation history

### Render Logs
In Render Dashboard:
```bash
# Successful upload
📤 Uploading to Cloudinary: generated/uuid.png
✅ Cloudinary upload successful: https://res.cloudinary.com/...

# Errors
❌ Cloudinary upload failed: [error details]
```

### Debugging Commands
To check variables:
```bash
# In Render Shell
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $NODE_ENV
```

---

## 🎯 File Structure in Cloudinary

### Folders:
```
vheer-ai/
├── generated/          # Generated images
├── originals/          # Original uploaded images  
└── thumbnails/         # Thumbnails (auto-generated)
```

### URL format:
```
Original: https://res.cloudinary.com/your-cloud/image/upload/vheer-ai/generated/uuid.png
Thumbnail: https://res.cloudinary.com/your-cloud/image/upload/w_300,h_300,c_fill,q_80,f_webp/vheer-ai/generated/uuid.png
```

---

## 🚀 Cloudinary + Render Benefits

### Performance
- ✅ **Global CDN** - fast loading worldwide
- ✅ **Auto-optimization** - automatic compression
- ✅ **Format conversion** - WebP for supporting browsers

### Reliability  
- ✅ **99.95% uptime** SLA
- ✅ **Automatic backup** - files don't get lost on Render restart
- ✅ **Scalability** - automatic scaling

### Cost Efficiency
- ✅ **Free tier** - 25GB free
- ✅ **Pay as you grow** - only pay for usage
- ✅ **No server storage** - saves Render disk space

---

## 🆘 Troubleshooting

### Issue: "Cloudinary upload failed"
**Solution:**
1. Check API keys in Render Environment
2. Check quotas in Cloudinary Dashboard
3. Check network settings

### Issue: "Images not saving"
**Solution:**
1. Check `NODE_ENV=production` in Render
2. Check Render logs for errors
3. Make sure user has paid subscription

### Issue: "Thumbnails not generating"
**Solution:**
1. Cloudinary automatically generates thumbnails via URL
2. Check URL format in database
3. Check access permissions in Cloudinary

---

## 📞 Support

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Render Docs:** https://render.com/docs
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration

---

## ✅ Deployment Checklist

- [ ] Created Cloudinary account
- [ ] Got API keys
- [ ] Added environment variables to Render
- [ ] Deployed service on Render
- [ ] Checked startup logs
- [ ] Tested image generation
- [ ] Checked Media Library in Cloudinary
- [ ] Verified "My Images" page

**Done! 🎉 Your images are now saved in the cloud!**