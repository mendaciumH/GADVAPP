# Deployment Guide

## Environment Variables

### Required Environment Variables

1. **BASE_URL** - Set this to your production domain
   ```bash
   BASE_URL=https://yourdomain.com
   ```
   
   **Important**: This variable is used for generating image URLs. Without it, images will be saved with localhost URLs.

2. **JWT_SECRET** - Your JWT secret key
   ```bash
   JWT_SECRET=your_secure_jwt_secret_here
   ```

3. **Database Configuration**
   ```bash
   DB_HOST=your_database_host
   DB_PORT=5432
   DB_USERNAME=your_db_username
   DB_PASSWORD=your_db_password
   DB_DATABASE=your_database_name
   ```

4. **CORS Configuration** (optional, comma-separated)
   ```bash
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

5. **Email Configuration** (optional, for contact form)
   ```bash
   EMAIL_HOST=mail.yourdomain.com
   EMAIL_PORT=465
   EMAIL_USER=contact@yourdomain.com
   EMAIL_PASS=your_email_password
   EMAIL_SECURE=true
   ```

## Quick Setup

1. **Run the setup script** (if available):
   ```bash
   chmod +x scripts/setup-production.sh
   ./scripts/setup-production.sh
   ```

2. **Or manually create/update your .env file**:
   ```bash
   echo "BASE_URL=https://yourdomain.com" >> .env
   echo "JWT_SECRET=your_secure_jwt_secret_here" >> .env
   echo "DB_HOST=your_database_host" >> .env
   echo "DB_PORT=5432" >> .env
   echo "DB_USERNAME=your_db_username" >> .env
   echo "DB_PASSWORD=your_db_password" >> .env
   echo "DB_DATABASE=your_database_name" >> .env
   echo "CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com" >> .env
   ```

3. **Test the configuration**:
   ```bash
   GET https://yourdomain.com/api/health
   ```
   This should return the application status.

## Fixing Image URLs

After deployment, you may need to fix existing image URLs in the database if they were created with localhost URLs. You can create a migration script or endpoint to update them.

## New Image Uploads

With the correct BASE_URL set, new image uploads will automatically use the production domain:
- ✅ Images: `https://yourdomain.com/api/uploads/filename.jpg`
- ✅ Payment receipts: `https://yourdomain.com/api/uploads/paiement/filename.jpg`

## CORS Configuration

The application uses the `CORS_ORIGINS` environment variable to configure allowed origins. If not set, it defaults to localhost origins for development.

For production, set:
```bash
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Static Files

Images are served from the `/api/uploads/` directory and are accessible at:
- `https://yourdomain.com/api/uploads/filename.jpg`
- `https://yourdomain.com/api/uploads/paiement/filename.jpg`

## Frontend Configuration

The frontend uses the `REACT_APP_API_URL` environment variable. Set it during build:
```bash
REACT_APP_API_URL=https://yourdomain.com/api npm run build
```

Or set it in your `.env` file before building:
```bash
REACT_APP_API_URL=https://yourdomain.com/api
```

## Troubleshooting

### Images not loading in production:
1. Check if BASE_URL is set correctly in your environment
2. Verify the uploads directory is accessible
3. Restart the application after setting environment variables

### New uploads still using localhost:
1. Verify BASE_URL is set in your environment
2. Restart the application
3. Test with a new upload

### CORS errors:
1. Verify CORS_ORIGINS includes your frontend domain
2. Check that the frontend is using the correct API URL
3. Restart the application after updating CORS_ORIGINS
