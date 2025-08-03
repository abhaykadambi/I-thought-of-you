const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Register push token for current user
router.post('/register-token', authenticateToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.userId;

    if (!pushToken) {
      return res.status(400).json({ error: 'Push token is required' });
    }

    // Update user's push token
    const { error } = await supabase
      .from('users')
      .update({ push_token: pushToken })
      .eq('id', userId);

    if (error) {
      console.error('Error updating push token:', error);
      return res.status(500).json({ error: 'Failed to register push token' });
    }

    res.json({ message: 'Push token registered successfully' });

  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unregister push token for current user
router.delete('/unregister-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Remove user's push token
    const { error } = await supabase
      .from('users')
      .update({ push_token: null })
      .eq('id', userId);

    if (error) {
      console.error('Error removing push token:', error);
      return res.status(500).json({ error: 'Failed to unregister push token' });
    }

    res.json({ message: 'Push token unregistered successfully' });

  } catch (error) {
    console.error('Unregister token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for Supabase triggers
router.post('/webhook/new-thought', async (req, res) => {
  try {
    const { thought_id } = req.body;

    if (!thought_id) {
      console.error('No thought_id provided in webhook');
      return res.status(400).json({ error: 'thought_id is required' });
    }

    // Get the thought details
    const { data: thought, error: thoughtError } = await supabase
      .from('thoughts')
      .select(`
        id,
        text,
        recipient_id,
        sender:users!thoughts_sender_id_fkey(name)
      `)
      .eq('id', thought_id)
      .single();

    if (thoughtError || !thought) {
      console.error('Error fetching thought for notification:', thoughtError);
      return res.status(404).json({ error: 'Thought not found' });
    }

    // Send push notification to recipient
    const success = await notificationService.sendThoughtNotification(
      thought.recipient_id, 
      thought.sender.name
    );

    if (success) {
      console.log(`Push notification sent successfully for thought ${thought_id}`);
      res.status(200).json({ message: 'Notification sent successfully' });
    } else {
      console.log(`Failed to send push notification for thought ${thought_id}`);
      res.status(500).json({ error: 'Failed to send notification' });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint to check notification setup
router.get('/debug', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's push token status
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('push_token, name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user for debug:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Get notification statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_notification_stats');

    if (statsError) {
      console.error('Error fetching notification stats:', statsError);
    }

    // Get recent notification logs for this user
    const { data: logs, error: logsError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      console.error('Error fetching notification logs:', logsError);
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasPushToken: !!user.push_token,
        pushTokenPreview: user.push_token ? user.push_token.substring(0, 20) + '...' : null
      },
      stats: stats || { error: 'Could not fetch stats' },
      recentLogs: logs || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test notification endpoint
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Send a test notification to the current user
    const success = await notificationService.sendNotificationToUser(
      userId,
      'Test Notification',
      'This is a test notification from the backend!',
      { type: 'test' }
    );

    if (success) {
      res.json({ message: 'Test notification sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send test notification' });
    }

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 