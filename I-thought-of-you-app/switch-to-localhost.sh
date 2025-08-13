#!/bin/bash

echo "🔄 Switching to localhost URLs for testing..."

# Update services/api.js
sed -i '' 's|baseURL: .https://i-thought-of-you-production.up.railway.app/api.*|baseURL: '\''http://localhost:3000/api'\'',|' services/api.js

# Update uploadAvatar function
sed -i '' 's|fetch('\''https://i-thought-of-you-production.up.railway.app/api/auth/upload-avatar'\''|fetch('\''http://localhost:3000/api/auth/upload-avatar'\''|' services/api.js

# Update ComposeThoughtScreen image upload
sed -i '' 's|fetch('\''https://i-thought-of-you-production.up.railway.app/api/thoughts/upload-image'\''|fetch('\''http://localhost:3000/api/thoughts/upload-image'\''|' screens/ComposeThoughtScreen.js

echo "✅ Switched to localhost URLs!"
echo "🌐 Base URL: http://localhost:3000/api"
echo "🧪 Ready for local testing!"
