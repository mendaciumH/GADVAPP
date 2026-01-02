#!/bin/bash

# Production Environment Setup Script
echo "Setting up production environment variables..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    touch .env
fi

# Set BASE_URL for production
# Replace with your actual production domain
echo "Setting BASE_URL..."
if [ -z "$BASE_URL" ]; then
    echo "BASE_URL=https://yourdomain.com" >> .env
    echo "⚠️  Please update BASE_URL in .env with your actual production domain"
else
    echo "BASE_URL=$BASE_URL" >> .env
fi

# Set JWT_SECRET if not already set
if ! grep -q "JWT_SECRET" .env; then
    echo "Setting JWT_SECRET..."
    echo "JWT_SECRET=your_secure_jwt_secret_here" >> .env
fi

# Set database configuration if not already set
if ! grep -q "DB_HOST" .env; then
    echo "Setting database configuration..."
    echo "DB_HOST=your_database_host" >> .env
    echo "DB_PORT=3306" >> .env
    echo "DB_USERNAME=your_db_username" >> .env
    echo "DB_PASSWORD=your_db_password" >> .env
    echo "DB_DATABASE=your_database_name" >> .env
fi

echo "Environment variables set up successfully!"
echo ""
echo "Please update the following in your .env file:"
echo "1. Replace 'your_secure_jwt_secret_here' with a secure JWT secret"
echo "2. Update database configuration with your actual database credentials"
echo ""
echo "After updating the .env file, restart your application."
