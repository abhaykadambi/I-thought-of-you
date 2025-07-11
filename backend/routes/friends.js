const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (potential friends)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get all users except current user
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .neq('id', currentUserId)
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    res.json({ users });

  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friend profile with thoughts from that friend
router.get('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user.userId;

    // Get friend's profile
    const { data: friend, error: friendError } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', friendId)
      .single();

    if (friendError || !friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Get thoughts from this friend to current user
    const { data: thoughts, error: thoughtsError } = await supabase
      .from('thoughts')
      .select(`
        id,
        text,
        image_url,
        created_at
      `)
      .eq('sender_id', friendId)
      .eq('recipient_id', currentUserId)
      .order('created_at', { ascending: false });

    if (thoughtsError) {
      console.error('Error fetching thoughts:', thoughtsError);
      return res.status(500).json({ error: 'Failed to fetch thoughts' });
    }

    // Format thoughts
    const formattedThoughts = thoughts.map(thought => ({
      id: thought.id,
      text: thought.text,
      image: thought.image_url,
      time: formatTime(thought.created_at)
    }));

    res.json({
      friend: {
        id: friend.id,
        name: friend.name,
        email: friend.email
      },
      thoughts: formattedThoughts
    });

  } catch (error) {
    console.error('Friend profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to format time
function formatTime(timestamp) {
  const now = new Date();
  const thoughtTime = new Date(timestamp);
  const diffInHours = (now - thoughtTime) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 168) { // 7 days
    const days = Math.floor(diffInHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const weeks = Math.floor(diffInHours / 168);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}

module.exports = router; 