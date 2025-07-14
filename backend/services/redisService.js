const redis = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackStorage = new Map(); // In-memory fallback
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: (process.env.REDIS_TIMEOUT || 10) * 1000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis connection failed after 10 retries');
              return false; // Stop retrying
            }
            return Math.min(retries * 100, 3000); // Exponential backoff
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Store reset token with expiration (1 hour)
  async storeResetToken(token, resetData) {
    const key = `reset:${token}`;
    const value = JSON.stringify(resetData);
    const expiration = 3600; // 1 hour in seconds

    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, expiration, value);
        console.log(`Reset token stored in Redis: ${token}`);
      } catch (error) {
        console.error('Redis storage failed, using fallback:', error);
        // Fallback to in-memory storage
        this.fallbackStorage.set(key, {
          value,
          expiresAt: Date.now() + (expiration * 1000)
        });
        console.log(`Reset token stored in fallback: ${token}`);
      }
    } else {
      // Use fallback storage
      this.fallbackStorage.set(key, {
        value,
        expiresAt: Date.now() + (expiration * 1000)
      });
      console.log(`Reset token stored in fallback: ${token}`);
    }
  }

  // Retrieve reset token
  async getResetToken(token) {
    const key = `reset:${token}`;

    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.error('Redis retrieval failed, trying fallback:', error);
      }
    }

    // Try fallback storage
    const fallbackData = this.fallbackStorage.get(key);
    if (fallbackData) {
      // Check if expired
      if (Date.now() > fallbackData.expiresAt) {
        this.fallbackStorage.delete(key);
        return null;
      }
      return JSON.parse(fallbackData.value);
    }

    return null;
  }

  // Delete reset token
  async deleteResetToken(token) {
    const key = `reset:${token}`;

    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        console.log(`Reset token deleted from Redis: ${token}`);
      } catch (error) {
        console.error('Redis deletion failed:', error);
      }
    }

    // Also delete from fallback storage
    this.fallbackStorage.delete(key);
    console.log(`Reset token deleted from fallback: ${token}`);
  }

  // Cleanup expired fallback tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, data] of this.fallbackStorage.entries()) {
      if (now > data.expiresAt) {
        this.fallbackStorage.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired fallback tokens`);
    }
  }
}

module.exports = new RedisService(); 