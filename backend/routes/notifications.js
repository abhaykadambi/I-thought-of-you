const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

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

module.exports = router; 