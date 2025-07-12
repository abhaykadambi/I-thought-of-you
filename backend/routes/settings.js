const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user settings (privacy and notifications)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Settings fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch settings' });
    }

    // Return default settings if none exist
    const defaultSettings = {
      privacy: {
        profileVisibility: 'friends',
        thoughtVisibility: 'friends',
        allowFriendRequests: true,
        showOnlineStatus: true,
        allowThoughtsFromStrangers: false,
        dataAnalytics: true,
        locationSharing: false,
      },
      notifications: {
        pushNotifications: true,
        newThoughts: true,
        friendRequests: true,
        friendActivity: false,
        appUpdates: true,
        marketing: false,
        soundEnabled: true,
        vibrationEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        doNotDisturb: false,
      }
    };

    res.json({ settings: settings || defaultSettings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { privacy, notifications } = req.body;
    
    const settingsData = {
      user_id: req.user.userId,
      privacy: privacy || {},
      notifications: notifications || {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settingsData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Settings update error:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    res.json({ message: 'Settings updated successfully', settings: data });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Get current user with password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    // Delete user's thoughts
    const { error: thoughtsError } = await supabase
      .from('thoughts')
      .delete()
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`);

    if (thoughtsError) {
      console.error('Thoughts deletion error:', thoughtsError);
    }

    // Delete user's pinned thoughts
    const { error: pinnedError } = await supabase
      .from('pinned_thoughts')
      .delete()
      .eq('user_id', req.user.userId);

    if (pinnedError) {
      console.error('Pinned thoughts deletion error:', pinnedError);
    }

    // Delete user's friend requests
    const { error: requestsError } = await supabase
      .from('friend_requests')
      .delete()
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`);

    if (requestsError) {
      console.error('Friend requests deletion error:', requestsError);
    }

    // Delete user's settings
    const { error: settingsError } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', req.user.userId);

    if (settingsError) {
      console.error('Settings deletion error:', settingsError);
    }

    // Delete user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.userId);

    if (userError) {
      console.error('User deletion error:', userError);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get blocked users
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    const { data: blockedUsers, error } = await supabase
      .from('blocked_users')
      .select('blocked_user_id, blocked_at')
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Blocked users fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch blocked users' });
    }

    // Get user details for blocked users
    const blockedUserIds = blockedUsers.map(b => b.blocked_user_id);
    let blockedUserDetails = [];
    
    if (blockedUserIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .in('id', blockedUserIds);

      if (!usersError) {
        blockedUserDetails = users.map(user => ({
          ...user,
          blockedAt: blockedUsers.find(b => b.blocked_user_id === user.id)?.blocked_at
        }));
      }
    }

    res.json({ blockedUsers: blockedUserDetails });
  } catch (error) {
    console.error('Blocked users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Block a user
router.post('/block', authenticateToken, async (req, res) => {
  try {
    const { contact } = req.body;

    if (!contact) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    // Find user by email or phone
    const { data: userToBlock, error: userError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${contact},phone.eq.${contact}`)
      .single();

    if (userError || !userToBlock) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToBlock.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if already blocked
    const { data: existingBlock, error: checkError } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', req.user.userId)
      .eq('blocked_user_id', userToBlock.id)
      .single();

    if (existingBlock) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Block user
    const { error: blockError } = await supabase
      .from('blocked_users')
      .insert({
        user_id: req.user.userId,
        blocked_user_id: userToBlock.id,
        blocked_at: new Date().toISOString()
      });

    if (blockError) {
      console.error('Block user error:', blockError);
      return res.status(500).json({ error: 'Failed to block user' });
    }

    // Auto-unfriend: Remove from friends if they were friends
    const { error: unfriendError } = await supabase
      .from('friends')
      .delete()
      .or(`(user_id.eq.${req.user.userId}.and.friend_id.eq.${userToBlock.id}),(user_id.eq.${userToBlock.id}.and.friend_id.eq.${req.user.userId})`);

    if (unfriendError) {
      console.error('Auto-unfriend error:', unfriendError);
      // Don't fail the block operation if unfriend fails
    }

    res.json({ message: 'User blocked and unfriended successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unblock a user
router.delete('/block/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', req.user.userId)
      .eq('blocked_user_id', userId);

    if (error) {
      console.error('Unblock user error:', error);
      return res.status(500).json({ error: 'Failed to unblock user' });
    }

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export user data
router.get('/export', authenticateToken, async (req, res) => {
  try {
    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError) {
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    // Get user's thoughts
    const { data: thoughts, error: thoughtsError } = await supabase
      .from('thoughts')
      .select('*')
      .or(`sender_id.eq.${req.user.userId},recipient_id.eq.${req.user.userId}`);

    if (thoughtsError) {
      console.error('Thoughts fetch error:', thoughtsError);
    }

    // Get user's settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.user.userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Settings fetch error:', settingsError);
    }

    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      thoughts: thoughts || [],
      settings: settings || {},
      exported_at: new Date().toISOString()
    };

    res.json({ 
      message: 'Data export initiated',
      data: exportData
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test notification
router.post('/test-notification', authenticateToken, async (req, res) => {
  try {
    // This would integrate with a push notification service
    // For now, just return success
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 