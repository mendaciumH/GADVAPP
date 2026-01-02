# API Deployment Guide

## Image URL Issue Fix

### Problem
When uploading images in deployment, the URLs are stored with `http://localhost:5000` instead of the actual domain URL because the `BASE_URL` environment variable is not set.

### Solution

#### 1. Set Environment Variable in Deployment

You need to set the `BASE_URL` environment variable in your deployment environment:

**For Docker deployment:**
```bash
# Add to your docker-compose.yml or docker run command
-e BASE_URL=https://yourdomain.com
```

**For cPanel/Shared Hosting:**
- Add environment variable in your hosting control panel
- Or create a `.env` file in your project root:
```
BASE_URL=https://yourdomain.com
```

**For VPS/Dedicated Server:**
```bash
export BASE_URL=https://yourdomain.com
```

#### 2. Fix Existing Image URLs

After setting the environment variable, you may need to update existing image URLs in the database. Create a migration script or endpoint to update them from localhost URLs to production URLs.

#### 3. Verify the Fix

Check that new image uploads use the correct URL by:
1. Uploading a new image
2. Checking the database to see the URL is stored with the correct domain
3. Verifying the image loads correctly in the frontend

### Environment Variables Checklist

Make sure these environment variables are set in your deployment:

- `BASE_URL=https://yourdomain.com` (your actual domain)
- `NODE_ENV=production`
- `JWT_SECRET=your_secure_jwt_secret`
- `PORT=5000` (or your preferred port)
- `CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com` (optional)

### Testing the Fix

1. **Check current image URLs** in your database

2. **Upload a new image** and verify it uses the correct URL format

3. **Verify images load correctly** in the frontend

### Expected URL Format

After the fix, image URLs should look like:
- ✅ `https://yourdomain.com/api/uploads/filename.jpg`
- ❌ `http://localhost:5000/uploads/filename.jpg`
