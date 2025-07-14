const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const thoughtsRoutes = require('./routes/thoughts');
const friendsRoutes = require('./routes/friends');
const settingsRoutes = require('./routes/settings');
const notificationsRoutes = require('./routes/notifications');
const redisService = require('./services/redisService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    redis: redisService.isConnected ? 'connected' : 'disconnected'
  });
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    const supabase = require('./config/supabase');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('Database test error:', error);
      return res.status(500).json({ 
        error: 'Database connection failed',
        details: error 
      });
    }
    
    res.json({ 
      status: 'OK', 
      message: 'Database connection successful',
      data 
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      error: 'Database test failed',
      details: error.message 
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/thoughts', thoughtsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize Redis connection
async function startServer() {
  try {
    // Connect to Redis
    await redisService.connect();
    console.log('Redis connected successfully');
    
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });

    // Set up periodic cleanup of expired fallback tokens (every 10 minutes)
    setInterval(() => {
      redisService.cleanupExpiredTokens();
    }, 10 * 60 * 1000);
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await redisService.disconnect();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await redisService.disconnect();
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

 