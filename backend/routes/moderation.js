const express = require('express');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin/moderator
const requireAdmin = async (req, res, next) => {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('role, permissions')
      .eq('user_id', req.user.userId)
      .single();

    if (error || !adminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = adminUser;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /moderation/report - Report objectionable content
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { thoughtId, reason, description } = req.body;
    const reporterId = req.user.userId;

    if (!thoughtId || !reason) {
      return res.status(400).json({ error: 'Thought ID and reason are required' });
    }

    // Validate reason
    const validReasons = ['harassment', 'hate_speech', 'violence', 'spam', 'inappropriate', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' });
    }

    // Get the thought and its sender
    const { data: thought, error: thoughtError } = await supabase
      .from('thoughts')
      .select('id, sender_id, text')
      .eq('id', thoughtId)
      .single();

    if (thoughtError || !thought) {
      return res.status(404).json({ error: 'Thought not found' });
    }

    // Prevent users from reporting their own content
    if (thought.sender_id === reporterId) {
      return res.status(400).json({ error: 'Cannot report your own content' });
    }

    // Check if user has already reported this thought
    const { data: existingReport } = await supabase
      .from('content_reports')
      .select('id')
      .eq('reporter_id', reporterId)
      .eq('reported_thought_id', thoughtId)
      .single();

    if (existingReport) {
      return res.status(400).json({ error: 'You have already reported this content' });
    }

    // Create the report
    const { data: report, error } = await supabase
      .from('content_reports')
      .insert([{
        reporter_id: reporterId,
        reported_thought_id: thoughtId,
        reported_user_id: thought.sender_id,
        reason,
        description: description || null
      }])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Create report error:', error);
      return res.status(500).json({ error: 'Failed to create report' });
    }

    res.status(201).json({
      message: 'Content reported successfully',
      reportId: report.id
    });

  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /moderation/block - Block a user
router.post('/block', authenticateToken, async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const blockerId = req.user.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Prevent users from blocking themselves
    if (userId === blockerId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if user exists
    const { data: userToBlock, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userToBlock) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_user_id', userId)
      .single();

    if (existingBlock) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Create the block
    const { data: block, error } = await supabase
      .from('user_blocks')
      .insert([{
        blocker_id: blockerId,
        blocked_user_id: userId,
        reason: reason || null
      }])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Create block error:', error);
      return res.status(500).json({ error: 'Failed to block user' });
    }

    res.status(201).json({
      message: 'User blocked successfully',
      blockId: block.id
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /moderation/block/:userId - Unblock a user
router.delete('/block/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.userId;

    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', blockerId)
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

// GET /moderation/blocked - Get list of blocked users
router.get('/blocked', authenticateToken, async (req, res) => {
  try {
    const blockerId = req.user.userId;

    const { data: blockedUsers, error } = await supabase
      .from('user_blocks')
      .select(`
        blocked_user_id,
        reason,
        created_at,
        users!user_blocks_blocked_user_id_fkey (
          id,
          name,
          username,
          avatar
        )
      `)
      .eq('blocker_id', blockerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get blocked users error:', error);
      return res.status(500).json({ error: 'Failed to get blocked users' });
    }

    res.json({ blockedUsers });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ADMIN ROUTES (require admin access)

// GET /moderation/reports - Get all content reports (admin only)
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('content_reports')
      .select(`
        *,
        reporter:users!content_reports_reporter_id_fkey (
          id,
          name,
          username,
          email
        ),
        reported_user:users!content_reports_reported_user_id_fkey (
          id,
          name,
          username,
          email
        ),
        thought:thoughts!content_reports_reported_thought_id_fkey (
          id,
          text,
          image_url,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Get reports error:', error);
      return res.status(500).json({ error: 'Failed to get reports' });
    }

    res.json({ reports, page: parseInt(page), limit: parseInt(limit) });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /moderation/reports/:reportId - Update report status (admin only)
router.put('/reports/:reportId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes, action } = req.body;
    const adminId = req.user.userId;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('content_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update the report
    const updateData = {
      status,
      admin_notes: adminNotes || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString()
    };

    const { data: updatedReport, error: updateError } = await supabase
      .from('content_reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Update report error:', updateError);
      return res.status(500).json({ error: 'Failed to update report' });
    }

    // Handle actions based on status
    if (status === 'resolved' && action) {
      if (action === 'remove_content') {
        // Remove the reported thought
        const { error: deleteError } = await supabase
          .from('thoughts')
          .delete()
          .eq('id', report.reported_thought_id);

        if (deleteError) {
          console.error('Delete thought error:', deleteError);
        }
      } else if (action === 'ban_user') {
        // Ban the user (you might want to add a 'banned' field to users table)
        // For now, we'll just note it in the admin notes
        console.log(`User ${report.reported_user_id} should be banned`);
      }
    }

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /moderation/dashboard - Get moderation dashboard stats (admin only)
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get pending reports count
    const { count: pendingCount } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get reports by status
    const { data: statusCounts } = await supabase
      .from('content_reports')
      .select('status');

    const statusStats = {};
    if (statusCounts) {
      statusCounts.forEach(report => {
        statusStats[report.status] = (statusStats[report.status] || 0) + 1;
      });
    }

    // Get recent reports
    const { data: recentReports } = await supabase
      .from('content_reports')
      .select(`
        id,
        reason,
        status,
        created_at,
        reported_user:users!content_reports_reported_user_id_fkey (
          name,
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      pendingCount: pendingCount || 0,
      statusStats,
      recentReports: recentReports || []
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 