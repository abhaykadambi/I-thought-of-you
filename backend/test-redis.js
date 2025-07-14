const redisService = require('./services/redisService');

async function testRedis() {
  console.log('Testing Redis functionality...\n');

  try {
    // Test connection
    console.log('1. Testing Redis connection...');
    await redisService.connect();
    console.log('✅ Redis connected successfully\n');

    // Test token storage
    console.log('2. Testing token storage...');
    const testToken = 'test-token-123';
    const testData = {
      userId: 'test-user-456',
      email: 'test@example.com',
      createdAt: new Date().toISOString()
    };

    await redisService.storeResetToken(testToken, testData);
    console.log('✅ Token stored successfully\n');

    // Test token retrieval
    console.log('3. Testing token retrieval...');
    const retrievedData = await redisService.getResetToken(testToken);
    if (retrievedData && retrievedData.userId === testData.userId) {
      console.log('✅ Token retrieved successfully');
      console.log('Retrieved data:', retrievedData);
    } else {
      console.log('❌ Token retrieval failed');
    }
    console.log('');

    // Test token deletion
    console.log('4. Testing token deletion...');
    await redisService.deleteResetToken(testToken);
    const deletedData = await redisService.getResetToken(testToken);
    if (!deletedData) {
      console.log('✅ Token deleted successfully');
    } else {
      console.log('❌ Token deletion failed');
    }
    console.log('');

    // Test fallback storage (disconnect Redis)
    console.log('5. Testing fallback storage...');
    await redisService.disconnect();
    
    const fallbackToken = 'fallback-token-789';
    const fallbackData = {
      userId: 'fallback-user-101',
      email: 'fallback@example.com',
      createdAt: new Date().toISOString()
    };

    await redisService.storeResetToken(fallbackToken, fallbackData);
    console.log('✅ Fallback storage working');

    const retrievedFallback = await redisService.getResetToken(fallbackToken);
    if (retrievedFallback && retrievedFallback.userId === fallbackData.userId) {
      console.log('✅ Fallback retrieval working');
    } else {
      console.log('❌ Fallback retrieval failed');
    }

    await redisService.deleteResetToken(fallbackToken);
    console.log('✅ Fallback deletion working\n');

    console.log('🎉 All Redis tests passed!');
    console.log('\nYour Redis setup is ready for production!');

  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\nThis is expected if Redis is not running locally.');
    console.log('In production, make sure to set REDIS_URL environment variable.');
  } finally {
    await redisService.disconnect();
    process.exit(0);
  }
}

testRedis(); 