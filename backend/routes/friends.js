const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users (actual friends only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;

    // Get all users who are friends with the current user
    // A friend is someone with an accepted friend_request (either direction)
    const { data: friends, error } = await supabase
      .rpc('get_friends', { user_id: currentUserId });

    if (error) {
      console.error('Error fetching friends:', error);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }

    res.json({ users: friends });
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

// POST /suggested - Find users by email or phone number (for suggested friends)
router.post('/suggested', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { emails = [], phoneNumbers = [] } = req.body;

    if ((!emails || emails.length === 0) && (!phoneNumbers || phoneNumbers.length === 0)) {
      return res.status(400).json({ error: 'No emails or phone numbers provided' });
    }

    let query = supabase.from('users').select('id, name, email, created_at');
    if (emails.length > 0 && phoneNumbers.length > 0) {
      query = query.or(`email.in.(${emails.map(e => `'${e}'`).join(',')}),phone.in.(${phoneNumbers.map(p => `'${p}'`).join(',')})`);
    } else if (emails.length > 0) {
      query = query.in('email', emails);
    } else if (phoneNumbers.length > 0) {
      query = query.in('phone', phoneNumbers);
    }

    // Exclude current user
    query = query.neq('id', currentUserId);

    const { data: users, error } = await query;
    if (error) {
      console.error('Error fetching suggested friends:', error);
      return res.status(500).json({ error: 'Failed to fetch suggested friends' });
    }

    res.json({ users });
  } catch (error) {
    console.error('Suggested friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /friends/request - Send a friend request by phone number
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    // Find recipient by phone
    const { data: recipient, error: userError } = await supabase
      .from('users')
      .select('id, phone')
      .eq('phone', phone)
      .single();
    if (userError || !recipient) {
      return res.status(404).json({ error: 'User with that phone number not found' });
    }
    if (recipient.id === senderId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    // Check if already friends (for now, just check if a request is accepted)
    const { data: existingAccepted, error: acceptedError } = await supabase
      .from('friend_requests')
      .select('id')
      .or(`(sender_id.eq.${senderId},recipient_id.eq.${recipient.id})`, `(sender_id.eq.${recipient.id},recipient_id.eq.${senderId})`)
      .eq('status', 'accepted')
      .maybeSingle();
    if (existingAccepted) {
      return res.status(400).json({ error: 'You are already friends' });
    }
    // Check if a pending request already exists
    const { data: existingRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`(sender_id.eq.${senderId},recipient_id.eq.${recipient.id})`, `(sender_id.eq.${recipient.id},recipient_id.eq.${senderId})`)
      .neq('status', 'declined')
      .maybeSingle();
    if (existingRequest) {
      return res.status(400).json({ error: 'A friend request already exists' });
    }
    // Create friend request
    const { data: request, error } = await supabase
      .from('friend_requests')
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipient.id,
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ])
      .select('id, sender_id, recipient_id, status, created_at')
      .single();
    if (error) {
      console.error('Error creating friend request:', error);
      return res.status(500).json({ error: 'Failed to create friend request' });
    }
    res.status(201).json({ request });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /friends/requests - Get incoming and outgoing friend requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Incoming requests (to me) with sender details
    const { data: incoming, error: incomingError } = await supabase
      .from('friend_requests')
      .select('id, sender_id, recipient_id, status, created_at, sender:sender_id(id, name, email, phone, avatar)')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    // Outgoing requests (from me)
    const { data: outgoing, error: outgoingError } = await supabase
      .from('friend_requests')
      .select('id, sender_id, recipient_id, status, created_at')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });
    if (incomingError || outgoingError) {
      return res.status(500).json({ error: 'Failed to fetch friend requests' });
    }
    console.log('INCOMING REQUESTS:', JSON.stringify(incoming, null, 2));
    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /friends/request/:requestId/respond - Accept or decline a friend request
router.post('/request/:requestId/respond', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    // Only recipient can respond
    const { data: request, error: reqError } = await supabase
      .from('friend_requests')
      .select('id, recipient_id, status')
      .eq('id', requestId)
      .single();
    if (reqError || !request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    if (request.recipient_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to respond to this request' });
    }
    // Update status
    const { data: updated, error } = await supabase
      .from('friend_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .select('id, sender_id, recipient_id, status, updated_at')
      .single();
    if (error) {
      console.error('Error updating friend request:', error);
      return res.status(500).json({ error: 'Failed to update friend request' });
    }
    res.json({ request: updated });
  } catch (error) {
    console.error('Respond to friend request error:', error);
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