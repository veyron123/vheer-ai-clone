#!/usr/bin/env bash
# Build script for Render deployment

# Exit on error
set -o errexit

# Backend build
echo "Building backend..."
cd server
npm install
npx prisma generate

# Frontend build
echo "Building frontend..."
cd ../client
npm install --include=dev
npm run build

echo "Build complete!"