const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload image endpoint
router.post('/upload-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const userId = req.user.userId;
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `thoughts/${userId}/${Date.now()}${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('thought-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('thought-images')
      .getPublicUrl(fileName);

    res.json({ 
      imageUrl: publicUrl,
      message: 'Image uploaded successfully' 
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Get all thoughts for current user (received and sent) - only from friends
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's friends
    const { data: friends, error: friendsError } = await supabase
      .rpc('get_friends', { user_id: userId });

    if (friendsError) {
      console.error('Error fetching friends:', friendsError);
      return res.status(500).json({ error: 'Failed to fetch friends' });
    }

    const friendIds = friends.map(friend => friend.id);

    // If no friends, return empty arrays
    if (friendIds.length === 0) {
      return res.json({
        received: [],
        sent: []
      });
    }

    // Get all thoughts in a single query with proper joins
    const { data: allThoughts, error: thoughtsError } = await supabase
      .from('thoughts')
      .select(`
        id,
        text,
        image_url,
        created_at,
        sender_id,
        recipient_id,
        sender:users!thoughts_sender_id_fkey(id, name, avatar),
        recipient:users!thoughts_recipient_id_fkey(id, name)
      `)
      .or(`and(recipient_id.eq.${userId},sender_id.in.(${friendIds.join(',')})),and(sender_id.eq.${userId},recipient_id.in.(${friendIds.join(',')}))`)
      .order('created_at', { ascending: false });

    if (thoughtsError) {
      console.error('Error fetching thoughts:', thoughtsError);
      return res.status(500).json({ error: 'Failed to fetch thoughts' });
    }

    // Separate received and sent thoughts
    const receivedThoughts = allThoughts.filter(thought => thought.recipient_id === userId);
    const sentThoughts = allThoughts.filter(thought => thought.sender_id === userId);

    // Format the data
    const formattedReceived = receivedThoughts.map(thought => ({
      id: thought.id,
      author: thought.sender.name,
      authorAvatar: thought.sender.avatar,
      text: thought.text,
      image: thought.image_url,
      time: formatTime(thought.created_at)
    }));

    const formattedSent = sentThoughts.map(thought => ({
      id: thought.id,
      author: 'You',
      recipient: thought.recipient.name,
      text: thought.text,
      image: thought.image_url,
      time: formatTime(thought.created_at)
    }));

    res.json({
      received: formattedReceived,
      sent: formattedSent
    });

  } catch (error) {
    console.error('Thoughts fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new thought
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { recipientEmail, text, imageUrl } = req.body;
    const senderId = req.user.userId;

    if (!recipientEmail || !text) {
      return res.status(400).json({ error: 'Recipient email and text are required' });
    }

    // Find recipient user
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('email', recipientEmail)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Get sender's name for notification
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', senderId)
      .single();

    if (senderError) {
      console.error('Error fetching sender name:', senderError);
      return res.status(500).json({ error: 'Failed to create thought' });
    }

    // Create thought
    const { data: thought, error } = await supabase
      .from('thoughts')
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipient.id,
          text,
          image_url: imageUrl || null,
          created_at: new Date().toISOString()
        }
      ])
      .select(`
        id,
        text,
        image_url,
        created_at,
        recipient:users!thoughts_recipient_id_fkey(name)
      `)
      .single();

    if (error) {
      console.error('Error creating thought:', error);
      return res.status(500).json({ error: 'Failed to create thought' });
    }

    // Note: Push notification will be sent automatically via Supabase trigger
    // when the thought is inserted into the database

    res.status(201).json({
      message: 'Thought sent successfully',
      thought: {
        id: thought.id,
        author: 'You',
        recipient: thought.recipient.name,
        text: thought.text,
        image: thought.image_url,
        time: formatTime(thought.created_at)
      }
    });

  } catch (error) {
    console.error('Create thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pinned thoughts for current user
router.get('/pinned', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data: pinnedThoughts, error } = await supabase
      .from('pinned_thoughts')
      .select(`
        id,
        thought:thoughts(
          id,
          text,
          image_url,
          created_at,
          sender:users!thoughts_sender_id_fkey(id, name, avatar)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pinned thoughts:', error);
      return res.status(500).json({ error: 'Failed to fetch pinned thoughts' });
    }

    const formattedThoughts = pinnedThoughts.map(pin => ({
      id: pin.thought.id,
      author: pin.thought.sender.name,
      authorAvatar: pin.thought.sender.avatar,
      text: pin.thought.text,
      image: pin.thought.image_url,
      time: formatTime(pin.thought.created_at)
    }));

    res.json({ pinnedThoughts: formattedThoughts });

  } catch (error) {
    console.error('Pinned thoughts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pin a thought
router.post('/pin/:thoughtId', authenticateToken, async (req, res) => {
  try {
    const { thoughtId } = req.params;
    const userId = req.user.userId;

    // Check if thought exists and user is the recipient
    const { data: thought, error: thoughtError } = await supabase
      .from('thoughts')
      .select('id, recipient_id')
      .eq('id', thoughtId)
      .single();

    if (thoughtError || !thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    if (thought.recipient_id !== userId) {
      return res.status(403).json({ error: 'You can only pin thoughts sent to you' });
    }

    // Check if already pinned
    const { data: existingPin, error: pinCheckError } = await supabase
      .from('pinned_thoughts')
      .select('id')
      .eq('user_id', userId)
      .eq('thought_id', thoughtId)
      .single();

    if (existingPin) {
      return res.status(400).json({ error: 'Thought is already pinned' });
    }

    // Pin the thought
    const { error: pinError } = await supabase
      .from('pinned_thoughts')
      .insert([
        {
          user_id: userId,
          thought_id: thoughtId,
          created_at: new Date().toISOString()
        }
      ]);

    if (pinError) {
      console.error('Error pinning thought:', pinError);
      return res.status(500).json({ error: 'Failed to pin thought' });
    }

    res.json({ message: 'Thought pinned successfully' });

  } catch (error) {
    console.error('Pin thought error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unpin a thought
router.delete('/pin/:thoughtId', authenticateToken, async (req, res) => {
  try {
    const { thoughtId } = req.params;
    const userId = req.user.userId;

    const { error } = await supabase
      .from('pinned_thoughts')
      .delete()
      .eq('user_id', userId)
      .eq('thought_id', thoughtId);

    if (error) {
      console.error('Error unpinning thought:', error);
      return res.status(500).json({ error: 'Failed to unpin thought' });
    }

    res.json({ message: 'Thought unpinned successfully' });

  } catch (error) {
    console.error('Unpin thought error:', error);
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