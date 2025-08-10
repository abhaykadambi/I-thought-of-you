require('dotenv').config();

console.log('🍎 Apple Sign-In Configuration Test\n');

// Check if all required variables are set
const requiredVars = [
  'APPLE_BUNDLE_ID',
  'APPLE_TEAM_ID', 
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY'
];

let allSet = true;

console.log('Checking required environment variables:\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'APPLE_PRIVATE_KEY' ? 'SET (hidden for security)' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allSet) {
  console.log('🎉 All Apple Sign-In environment variables are set!');
  console.log('Your backend should now be able to verify Apple Sign-In tokens.');
} else {
  console.log('⚠️  Some environment variables are missing.');
  console.log('Please set all required variables before testing Apple Sign-In.');
}

console.log('\n' + '='.repeat(50));

// Additional validation
if (process.env.APPLE_BUNDLE_ID) {
  if (process.env.APPLE_BUNDLE_ID === 'com.ithoughtofyou.app') {
    console.log('✅ Bundle ID matches your app configuration');
  } else {
    console.log('⚠️  Bundle ID does not match your app configuration');
    console.log(`   Expected: com.ithoughtofyou.app`);
    console.log(`   Found: ${process.env.APPLE_BUNDLE_ID}`);
  }
}

if (process.env.APPLE_TEAM_ID) {
  if (process.env.APPLE_TEAM_ID.length === 10) {
    console.log('✅ Team ID format looks correct (10 characters)');
  } else {
    console.log('⚠️  Team ID format may be incorrect');
    console.log(`   Expected: 10 characters, Found: ${process.env.APPLE_TEAM_ID.length} characters`);
  }
}

if (process.env.APPLE_KEY_ID) {
  if (process.env.APPLE_KEY_ID.length === 10) {
    console.log('✅ Key ID format looks correct (10 characters)');
  } else {
    console.log('⚠️  Key ID format may be incorrect');
    console.log(`   Expected: 10 characters, Found: ${process.env.APPLE_KEY_ID.length} characters`);
  }
}

if (process.env.APPLE_PRIVATE_KEY) {
  if (process.env.APPLE_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('✅ Private key format looks correct (contains BEGIN marker)');
  } else {
    console.log('⚠️  Private key format may be incorrect');
    console.log('   Should contain "-----BEGIN PRIVATE KEY-----"');
  }
}

console.log('\n' + '='.repeat(50));
console.log('Run this script with: node test-apple-config.js');
console.log('Make sure you have a .env file in your backend folder!');
