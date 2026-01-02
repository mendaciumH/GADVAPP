#!/bin/bash

# Production Build Script
echo "Building React app for production..."

# Set production environment variable
# Replace with your actual API URL or set REACT_APP_API_URL environment variable
if [ -z "$REACT_APP_API_URL" ]; then
    export REACT_APP_API_URL=https://yourdomain.com/api
    echo "⚠️  Using default API URL. Set REACT_APP_API_URL environment variable for production."
else
    export REACT_APP_API_URL=$REACT_APP_API_URL
fi

# Install dependencies
npm install

# Build the application
npm run build

# Create deployment directory
mkdir -p public_html

# Copy built files
echo "Copying built files..."
cp -r build/* public_html/

# Create .htaccess for React Router
cat > public_html/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /

# Handle React Router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
EOF

echo "Production build completed!"
echo "⚠️  Make sure to configure your production domain in your deployment environment." 