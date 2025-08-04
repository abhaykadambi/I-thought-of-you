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
    res.json({ incoming, outgoing });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /friends/search - Search users by username (MUST come before /:friendId route)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    console.log('Search endpoint hit with query:', req.query);
    const currentUserId = req.user.userId;
    const { query } = req.query;
    
    if (!query || query.trim().length < 1) {
      console.log('Query too short, returning empty results');
      return res.json({ users: [] });
    }
    
    const searchQuery = query.toLowerCase().trim();
    console.log('Searching for:', searchQuery);
    
    // Search for users by username (case-insensitive)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, username, avatar, created_at')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', currentUserId)
      .limit(5); // Limit to 5 results to avoid overcrowding
    
    if (error) {
      console.error('User search error:', error);
      return res.status(500).json({ error: 'Failed to search users' });
    }
    
    console.log('Search results:', users?.length || 0, 'users found');
    res.json({ users: users || [] });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friend profile with thoughts from that friend
router.get('/:friendId', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.params;
    const currentUserId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    // Get friend's profile
    const { data: friend, error: friendError } = await supabase
      .from('users')
      .select('id, name, email, username, avatar, created_at')
      .eq('id', friendId)
      .single();

    if (friendError || !friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Get thoughts from this friend to current user
    const { data: allThoughts, error: thoughtsError } = await supabase
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

    // Get thoughts sent by current user to this friend
    const { data: allSentThoughts, error: sentError } = await supabase
      .from('thoughts')
      .select(`
        id,
        text,
        image_url,
        created_at
      `)
      .eq('sender_id', currentUserId)
      .eq('recipient_id', friendId)
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('Error fetching sent thoughts:', sentError);
      return res.status(500).json({ error: 'Failed to fetch sent thoughts' });
    }

    // Pagination
    const paginatedThoughts = allThoughts.slice(offset, offset + limit);
    const paginatedSentThoughts = allSentThoughts.slice(offset, offset + limit);

    // Format thoughts
    const formattedThoughts = paginatedThoughts.map(thought => ({
      id: thought.id,
      text: thought.text,
      image: thought.image_url,
      time: formatTime(thought.created_at)
    }));

    const formattedSentThoughts = paginatedSentThoughts.map(thought => ({
      id: thought.id,
      text: thought.text,
      image: thought.image_url,
      time: formatTime(thought.created_at)
    }));

    // Get friend request to calculate days connected
    const { data: friendRequest, error: requestError } = await supabase
      .from('friend_requests')
      .select('updated_at')
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${currentUserId})`)
      .eq('status', 'accepted')
      .single();

    // Calculate days connected
    let daysConnected = 0;
    if (friendRequest && friendRequest.updated_at) {
      const acceptedDate = new Date(friendRequest.updated_at);
      const now = new Date();
      const diffTime = Math.abs(now - acceptedDate);
      daysConnected = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    res.json({
      friend: {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        username: friend.username,
        avatar: friend.avatar
      },
      thoughts: formattedThoughts,
      thoughtsTotal: allThoughts.length,
      sentThoughts: formattedSentThoughts,
      sentThoughtsTotal: allSentThoughts.length,
      stats: {
        thoughtsSent: allSentThoughts.length,
        thoughtsReceived: allThoughts.length,
        daysConnected: daysConnected
      }
    });
  } catch (error) {
    console.error('Friend profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /suggested - Hybrid approach: contacts + username patterns + friends-of-friends
router.post('/suggested', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const { emails = [], phoneNumbers = [], usernames = [], contactNames = [] } = req.body;
    const MAX_SUGGESTIONS = 5;

    console.log('Enhanced hybrid suggested friends request:', { 
      emailsCount: emails.length, 
      phoneNumbersCount: phoneNumbers.length, 
      usernamesCount: usernames.length,
      contactNamesCount: contactNames.length
    });

    let allUsers = new Map(); // Use Map to avoid duplicates
    let priorityUsers = new Map(); // High priority users (direct matches)

    // Get current user's friends to exclude them from suggestions
    const { data: userFriends } = await supabase
      .from('friend_requests')
      .select('recipient_id, sender_id')
      .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .eq('status', 'accepted');
    
    const friendIds = new Set();
    if (userFriends) {
      userFriends.forEach(friend => {
        if (friend.sender_id === currentUserId) {
          friendIds.add(friend.recipient_id);
        } else {
          friendIds.add(friend.sender_id);
        }
      });
    }
    
    console.log(`Excluding ${friendIds.size} existing friends from suggestions`);

    // Step 1: Find users from direct contact matches (emails, phone numbers, exact usernames)
    if (emails.length > 0 || phoneNumbers.length > 0 || usernames.length > 0) {
      // Query by emails
      if (emails.length > 0) {
        const { data: emailUsers, error: emailError } = await supabase
          .from('users')
          .select('id, name, email, username, avatar, created_at')
          .in('email', emails)
          .neq('id', currentUserId);
        
        if (emailError) {
          console.error('Email query error:', emailError);
        } else {
          emailUsers?.forEach(user => {
            // Only add if not already a friend
            if (!friendIds.has(user.id)) {
              allUsers.set(user.id, user);
              priorityUsers.set(user.id, user); // Mark as high priority
            }
          });
        }
      }

      // Query by phone numbers
      if (phoneNumbers.length > 0) {
        const { data: phoneUsers, error: phoneError } = await supabase
          .from('users')
          .select('id, name, email, username, avatar, created_at')
          .in('phone', phoneNumbers)
          .neq('id', currentUserId);
        
        if (phoneError) {
          console.error('Phone query error:', phoneError);
        } else {
          phoneUsers?.forEach(user => {
            // Only add if not already a friend
            if (!friendIds.has(user.id)) {
              allUsers.set(user.id, user);
              priorityUsers.set(user.id, user); // Mark as high priority
            }
          });
        }
      }

      // Query by exact usernames
      if (usernames.length > 0) {
        const normalizedUsernames = usernames.map(u => u.toLowerCase());
        const { data: usernameUsers, error: usernameError } = await supabase
          .from('users')
          .select('id, name, email, username, avatar, created_at')
          .in('username', normalizedUsernames)
          .neq('id', currentUserId);
        
        if (usernameError) {
          console.error('Username query error:', usernameError);
        } else {
          usernameUsers?.forEach(user => {
            // Only add if not already a friend
            if (!friendIds.has(user.id)) {
              allUsers.set(user.id, user);
              priorityUsers.set(user.id, user); // Mark as high priority
            }
          });
        }
      }
    }

    // Step 2: Find users with similar usernames to contact names (lower priority)
    if (contactNames.length > 0 && allUsers.size < MAX_SUGGESTIONS) {
      console.log(`Found ${allUsers.size} direct matches, searching for username patterns from ${contactNames.length} contact names`);
      
      // Generate username patterns from contact names
      const usernamePatterns = [];
      contactNames.forEach(name => {
        if (name && name.trim()) {
          const cleanName = name.toLowerCase().trim();
          const nameParts = cleanName.split(/\s+/);
          
          // Generate various username patterns
          usernamePatterns.push(
            cleanName.replace(/\s+/g, ''), // "john doe" -> "johndoe"
            cleanName.replace(/\s+/g, '_'), // "john doe" -> "john_doe"
            cleanName.replace(/\s+/g, '.'), // "john doe" -> "john.doe"
            nameParts[0], // "john doe" -> "john"
            nameParts[nameParts.length - 1], // "john doe" -> "doe"
            `${nameParts[0]}${Math.floor(Math.random() * 999)}`, // "john123"
            `${nameParts[0]}${nameParts[nameParts.length - 1]}`, // "johndoe"
            `${nameParts[0]}_${nameParts[nameParts.length - 1]}` // "john_doe"
          );
        }
      });

      // Remove duplicates and filter valid patterns
      const uniquePatterns = [...new Set(usernamePatterns)].filter(pattern => 
        pattern && pattern.length >= 3 && /^[a-z0-9_.]+$/.test(pattern)
      );

      console.log(`Generated ${uniquePatterns.length} unique username patterns`);

      // Search for users with similar usernames
      for (const pattern of uniquePatterns) {
        if (allUsers.size >= MAX_SUGGESTIONS) break;
        
        const { data: similarUsers, error: similarError } = await supabase
          .from('users')
          .select('id, name, email, username, avatar, created_at')
          .ilike('username', `%${pattern}%`)
          .neq('id', currentUserId)
          .limit(MAX_SUGGESTIONS - allUsers.size);
        
        if (similarError) {
          console.error('Username pattern query error:', similarError);
        } else if (similarUsers) {
          similarUsers.forEach(user => {
            if (!allUsers.has(user.id) && !friendIds.has(user.id)) {
              allUsers.set(user.id, user);
              // Don't mark as priority - these are pattern matches
            }
          });
        }
      }
    }

    // Step 3: If we still have fewer than MAX_SUGGESTIONS, add friends-of-friends
    if (allUsers.size < MAX_SUGGESTIONS) {
      console.log(`Found ${allUsers.size} total matches, adding friends-of-friends to reach ${MAX_SUGGESTIONS}`);
      
      // Convert friendIds Set to array for the query
      const friendIdsArray = Array.from(friendIds);
      console.log(`Current user has ${friendIdsArray.length} friends:`, friendIdsArray);
      
      if (friendIdsArray.length > 0) {
        // Find friends of friends (excluding current user and existing friends)
        // This finds people who are friends with any of your current friends
        const { data: friendsOfFriends, error: fofError } = await supabase
          .from('friend_requests')
          .select(`
            recipient:users!friend_requests_recipient_id_fkey(
              id, name, email, username, avatar, created_at
            ),
            sender:users!friend_requests_sender_id_fkey(
              id, name, email, username, avatar, created_at
            )
          `)
          .or(`sender_id.in.(${friendIdsArray.join(',')}),recipient_id.in.(${friendIdsArray.join(',')})`)
          .eq('status', 'accepted')
          .neq('sender_id', currentUserId)
          .neq('recipient_id', currentUserId);
        
        if (fofError) {
          console.error('Friends-of-friends query error:', fofError);
        } else {
          console.log(`Found ${friendsOfFriends?.length || 0} friend relationships involving your friends`);
          
          // Extract unique users who are friends with your friends
          const friendsOfFriendsSet = new Set();
          
          if (friendsOfFriends) {
            friendsOfFriends.forEach(fof => {
              // Get the other person in the friendship (not your friend)
              let otherPerson = null;
              if (friendIds.has(fof.sender_id)) {
                // Your friend is the sender, so the recipient is the friend-of-friend
                otherPerson = fof.recipient;
              } else if (friendIds.has(fof.recipient_id)) {
                // Your friend is the recipient, so the sender is the friend-of-friend
                otherPerson = fof.sender;
              }
              
              if (otherPerson && 
                  !friendIds.has(otherPerson.id) && 
                  !allUsers.has(otherPerson.id) &&
                  otherPerson.id !== currentUserId) {
                friendsOfFriendsSet.add(otherPerson.id);
                allUsers.set(otherPerson.id, otherPerson);
                console.log(`Added friend-of-friend: ${otherPerson.name} (${otherPerson.username}) via friendship with your friend`);
              }
            });
          }
          
          console.log(`Total unique friends-of-friends found: ${friendsOfFriendsSet.size}`);
        }
      } else {
        console.log('No friends found, skipping friends-of-friends search');
      }
    }



    // Prioritize direct matches first, then pattern matches, then friends-of-friends
    const priorityList = Array.from(priorityUsers.values());
    const remainingUsers = Array.from(allUsers.values()).filter(user => !priorityUsers.has(user.id));
    const finalUsers = [...priorityList, ...remainingUsers].slice(0, MAX_SUGGESTIONS);

    console.log(`Final suggested friends: ${finalUsers.length}/${MAX_SUGGESTIONS} (${priorityUsers.size} direct matches, ${finalUsers.length - priorityUsers.size} pattern/friends-of-friends)`);
    console.log('Final breakdown:', {
      directMatches: priorityUsers.size,
      otherMatches: finalUsers.length - priorityUsers.size,
      totalFound: allUsers.size,
      finalReturned: finalUsers.length
    });

    res.json({ users: finalUsers });
  } catch (error) {
    console.error('Enhanced hybrid suggested friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /friends/debug-suggested - Debug endpoint to check what's happening
router.get('/debug-suggested', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    // Get total user count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get users with phone numbers
    const { data: usersWithPhone, count: usersWithPhoneCount } = await supabase
      .from('users')
      .select('id, phone', { count: 'exact' })
      .not('phone', 'is', null);
    
    // Get sample phone numbers
    const samplePhones = usersWithPhone?.slice(0, 5).map(u => u.phone) || [];
    
    res.json({
      totalUsers,
      usersWithPhoneCount,
      samplePhones,
      currentUserId
    });
  } catch (error) {
    console.error('Debug suggested friends error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// POST /friends/request - Send a friend request by phone number, email, or username
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { phone, email, username } = req.body;
    if (!phone && !email && !username) {
      return res.status(400).json({ error: 'Phone number, email, or username is required' });
    }
    let recipient;
    if (username) {
      // Find recipient by username (case-insensitive)
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', username.toLowerCase())
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'User with that username not found' });
      }
      recipient = data;
    } else if (email) {
      // Find recipient by email
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'User with that email not found' });
      }
      recipient = data;
    } else {
      // Find recipient by phone
      const { data, error } = await supabase
        .from('users')
        .select('id, phone')
        .eq('phone', phone)
        .single();
      if (error || !data) {
        return res.status(404).json({ error: 'User with that phone number not found' });
      }
      recipient = data;
    }
    if (recipient.id === senderId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    // Check if already friends (for now, just check if a request is accepted)
    const { data: existingAccepted } = await supabase
      .from('friend_requests')
      .select('id')
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${senderId})`)
      .eq('status', 'accepted')
      .maybeSingle();
    if (existingAccepted) {
      return res.status(400).json({ error: 'You are already friends' });
    }
    // Check if a pending request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${senderId})`)
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

// DELETE /friends/:friendId - Unfriend a user
router.delete('/:friendId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    if (userId === friendId) {
      return res.status(400).json({ error: 'Cannot unfriend yourself' });
    }

    // Delete the friend relationship (both directions)
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`);

    if (error) {
      console.error('Error unfriending user:', error);
      return res.status(500).json({ error: 'Failed to unfriend user' });
    }

    res.json({ message: 'User unfriended successfully' });
  } catch (error) {
    console.error('Unfriend error:', error);
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