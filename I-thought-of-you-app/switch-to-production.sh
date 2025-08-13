#!/bin/bash

echo "🔄 Switching to production URLs..."

# Update services/api.js
sed -i '' 's|baseURL: .http://localhost:3000/api.*|baseURL: '\''https://i-thought-of-you-production.up.railway.app/api'\'',|' services/api.js

# Update uploadAvatar function
sed -i '' 's|fetch('\''http://localhost:3000/api/auth/upload-avatar'\''|fetch('\''https://i-thought-of-you-production.up.railway.app/api/auth/upload-avatar'\''|' services/api.js

# Update ComposeThoughtScreen image upload
sed -i '' 's|fetch('\''http://localhost:3000/api/thoughts/upload-image'\''|fetch('\''https://i-thought-of-you-production.up.railway.app/api/thoughts/upload-image'\''|' screens/ComposeThoughtScreen.js

# Remove TODO comments
sed -i '' '/TODO: Before building for production, change this back to:/d' services/api.js
sed -i '' '/TODO: Before building for production, change this back to:/d' screens/ComposeThoughtScreen.js

echo "✅ Switched to production URLs!"
echo "🌐 Base URL: https://i-thought-of-you-production.up.railway.app/api"
echo "📱 Ready to build for production!"
