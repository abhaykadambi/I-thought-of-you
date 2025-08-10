const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');
const redisService = require('../services/redisService');
const multer = require('multer');
const path = require('path');
const jwksClient = require('jwks-client');

const router = express.Router();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Initialize Twilio Verify
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Configure multer for avatar uploads
const avatarStorage = multer.memoryStorage();
const avatarUpload = multer({
  storage: avatarStorage,
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

// Connect to Redis on startup (only needed for email reset tokens)
(async () => {
  try {
    await redisService.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Fall back to in-memory storage if Redis is not available
    console.log('Falling back to in-memory storage for reset tokens');
  }
})();

// In-memory storage for reset tokens (fallback if Redis is not available)
const resetTokens = new Map();
// In-memory fallback for phone reset allowed flags
const phoneResetAllowed = new Map();

// Helper function to generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to generate a 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Add this function for proper Apple token verification
const verifyAppleToken = async (identityToken) => {
  try {
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    // Get Apple's public keys
    const client = jwksClient({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 600000, // 10 minutes
    });

    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    // Verify the token
    const verified = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      audience: process.env.APPLE_BUNDLE_ID, // Your app's bundle ID
      issuer: 'https://appleid.apple.com',
    });

    return verified;
  } catch (error) {
    console.error('Apple token verification error:', error);
    throw new Error('Invalid Apple identity token');
  }
};

// Helper function to extract Apple user info from token (production-ready)
const extractAppleUserInfo = async (identityToken, email) => {
  try {
    const verifiedPayload = await verifyAppleToken(identityToken);
    
    return {
      appleUserId: verifiedPayload.sub,
      email: verifiedPayload.email || email,
      emailVerified: verifiedPayload.email_verified === 'true',
    };
  } catch (error) {
    console.error('Apple token extraction error:', error);
    throw new Error('Invalid Apple identity token');
  }
};

// Helper function to send email using SendGrid
const sendEmail = async (to, subject, body) => {
  try {
    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>') // Convert newlines to HTML breaks
    };
    
    await sgMail.send(msg);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error('SendGrid error:', error);
    if (error.response) {
      console.error('SendGrid response body:', error.response.body);
    }
    throw error;
  }
};

// Helper function to send SMS using Twilio Verify
const sendSMS = async (to, message) => {
  try {
    // For Twilio Verify, we don't send custom messages
    // Instead, we start a verification
    const verification = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: to,
        channel: 'sms'
      });
    
    console.log(`Verification started for ${to}, SID: ${verification.sid}`);
    return true;
  } catch (error) {
    console.error('Twilio Verify error:', error);
    throw error;
  }
};

// Helper function to verify OTP using Twilio Verify
const verifyOTP = async (to, code) => {
  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: to,
        code: code
      });
    
    console.log(`Verification check for ${to}: ${verificationCheck.status}`);
    return verificationCheck.status === 'approved';
  } catch (error) {
    console.error('Twilio Verify check error:', error);
    throw error;
  }
};

// Helper to format phone number to E.164 (US only for now)
function formatPhone(phone) {
  let digits = phone.replace(/[^\d]/g, '');
  if (digits.length === 10) {
    // Assume US number
    return '+1' + digits;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return '+1' + digits.slice(1);
  } else if (phone.startsWith('+')) {
    return phone;
  } else {
    // Fallback: just add +
    return '+' + digits;
  }
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, username } = req.body;

    if (!email || !password || !name || !username) {
      return res.status(400).json({ error: 'Email, password, name, and username are required' });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-32 characters long and contain only letters, numbers, and underscores' });
    }

    // Normalize username to lowercase for case-insensitive handling
    const normalizedUsername = username.toLowerCase();

    // Check if user already exists (by email, phone, or username)
    let existingUser, checkError;
    if (phone && phone.trim() !== '') {
      // If phone is provided and not empty, check for conflicts with email, phone, or username
      const result = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},phone.eq.${phone},username.ilike.${normalizedUsername}`)
        .single();
      existingUser = result.data;
      checkError = result.error;
    } else {
      // If phone is not provided or empty, only check for email and username conflicts
      const result = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.ilike.${normalizedUsername}`)
        .single();
      existingUser = result.data;
      checkError = result.error;
    }

    if (existingUser) {
      const conflictMessage = (phone && phone.trim() !== '') 
        ? 'User with this email, phone, or username already exists'
        : 'User with this email or username already exists';
      return res.status(400).json({ error: conflictMessage });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data, only include phone if it's not empty
    const userData = {
      email,
      password: hashedPassword,
      name,
      username: normalizedUsername, // Store normalized (lowercase) username
      created_at: new Date().toISOString()
    };
    
    // Only add phone field if it's not empty
    if (phone && phone.trim() !== '') {
      userData.phone = phone;
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, email, name, phone, username, created_at')
      .single();

    if (error) {
      console.error('Supabase error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        username: user.username,
        avatar: user.avatar
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password, name, username, avatar')
      .eq('email', email)
      .single();

    if (error || !user) {
      console.error('Login error:', error);
      console.error('User data:', user);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, username, avatar, phone, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current user profile (name, avatar, phone, username)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, avatar, phone, username } = req.body;
    // Only log avatar length, not the full data
    console.log('Profile update request:', { name, phone, username, avatarLength: avatar ? avatar.length : 0 });
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const updates = { name };
    if (avatar) {
      // Only log avatar length
      console.log('Adding avatar to updates, length:', avatar.length);
      updates.avatar = avatar;
    }
    if (phone !== undefined) {
      // Validate phone number format if provided
      if (phone && phone.trim() !== '') {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }
      }
      updates.phone = phone || null;
    }
    if (username !== undefined) {
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({ error: 'Username must be 3-32 characters long and contain only letters, numbers, and underscores' });
      }
      
      // Check if username is already taken (case-insensitive)
      const normalizedUsername = username.toLowerCase();
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', normalizedUsername)
        .neq('id', req.user.userId)
        .single();
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      
      updates.username = normalizedUsername;
    }
    updates.updated_at = new Date().toISOString();

    // Only log avatar length in updates
    console.log('Updating user with data:', { userId: req.user.userId, updates: { name: updates.name, avatarLength: updates.avatar ? updates.avatar.length : 0 } });

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select('id, email, name, username, avatar, phone, created_at')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }
    
    if (!user) {
      console.error('No user returned from update');
      return res.status(500).json({ error: 'User not found after update' });
    }
    
    console.log('Profile update successful for user:', user.id);
    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// POST /auth/forgot-password - Initiate password reset (unified for email and phone)
router.post('/forgot-password', async (req, res) => {
  try {
    const { method, contact } = req.body;

    if (!method || !contact) {
      return res.status(400).json({ error: 'Method and contact are required' });
    }

    if (!['email', 'phone'].includes(method)) {
      return res.status(400).json({ error: 'Method must be email or phone' });
    }

    let lookupContact = contact;
    let altContact = null;
    if (method === 'phone') {
      lookupContact = formatPhone(contact);
      altContact = contact.replace(/[^\d]/g, '');
    }

    // Find user by email or phone (try both formats for phone)
    let user, error;
    if (method === 'phone') {
      ({ data: user, error } = await supabase
        .from('users')
        .select('id, email, phone, name')
        .or(`phone.eq.${lookupContact},phone.eq.${altContact}`)
        .single());
    } else {
      ({ data: user, error } = await supabase
        .from('users')
        .select('id, email, phone, name')
        .eq('email', lookupContact)
        .single());
    }

    if (error || !user) {
      return res.status(404).json({ error: `User with this ${method} not found` });
    }

    // Generate a 6-digit code
    const resetCode = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const resetData = {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      code: resetCode,
      expiresAt
    };

    // Store code in Redis/fallback
    try {
      await redisService.storeResetToken(resetCode, resetData);
    } catch (redisError) {
      console.error('Redis error, using in-memory fallback:', redisError);
      resetTokens.set(resetCode, resetData);
    }

    if (method === 'email') {
      // Send code via email
      const emailBody = `
        Hello ${user.name},
        \nYou requested a password reset for your I Thought of You account.\n\nYour password reset code is: ${resetCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this reset, please ignore this email.\n\nBest regards,\nI Thought of You Team
      `;
      await sendEmail(user.email, 'Password Reset Code', emailBody);
      res.json({ message: 'Password reset code sent to your email!', method: 'email' });
    } else if (method === 'phone') {
      // Send code via Twilio Verify (existing logic)
      try {
        await sendSMS(formatPhone(user.phone), '');
      } catch (smsError) {
        console.error('Twilio Verify error:', smsError);
        return res.status(500).json({ error: 'Failed to send verification code' });
      }
      res.json({ message: 'Verification code sent to your phone!', method: 'phone', userId: user.id, phone: user.phone });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/verify-reset-code - Verify code for email or phone
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { method, contact, code } = req.body;
    if (!method || !contact || !code) {
      return res.status(400).json({ error: 'Method, contact, and code are required' });
    }
    if (method === 'phone') {
      // Use Twilio Verify to check the code
      try {
        const formattedPhone = formatPhone(contact);
        const isValid = await verifyOTP(formattedPhone, code);
        if (!isValid) {
          return res.status(400).json({ error: 'Invalid or expired code' });
        }
        // Find user by phone
        let lookupContact = formattedPhone;
        let altContact = contact.replace(/[^\d]/g, '');
        let { data: user, error } = await supabase
          .from('users')
          .select('id')
          .or(`phone.eq.${lookupContact},phone.eq.${altContact}`)
          .single();
        if (error || !user) {
          return res.status(404).json({ error: 'User with this phone not found' });
        }
        // Set reset allowed flag (in-memory and Redis if available)
        phoneResetAllowed.set(formattedPhone, Date.now() + 10 * 60 * 1000); // 10 min expiry
        try {
          await redisService.storeResetToken(`reset-allowed:${formattedPhone}`, { expiresAt: Date.now() + 10 * 60 * 1000 });
        } catch {}
        return res.json({ message: 'Code verified', userId: user.id });
      } catch (err) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }
    }
    // Get stored code data
    let resetData = null;
    try {
      resetData = await redisService.getResetToken(code);
    } catch (redisError) {
      resetData = resetTokens.get(code);
    }
    if (!resetData) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    if (resetData[method] !== contact) {
      return res.status(400).json({ error: 'Code does not match this user' });
    }
    if (new Date() > new Date(resetData.expiresAt)) {
      try { await redisService.deleteResetToken(code); } catch { resetTokens.delete(code); }
      return res.status(400).json({ error: 'Code has expired' });
    }
    res.json({ message: 'Code verified', userId: resetData.userId });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/reset-password - Reset password using code (for both email and phone)
router.post('/reset-password', async (req, res) => {
  try {
    const { method, contact, code, newPassword } = req.body;
    if (!method || !contact || !code || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (method === 'phone') {
      // Check reset allowed flag (in-memory and Redis)
      const formattedPhone = formatPhone(contact);
      let allowed = false;
      // Check in-memory
      const expiry = phoneResetAllowed.get(formattedPhone);
      if (expiry && Date.now() < expiry) {
        allowed = true;
      } else {
        // Check Redis
        try {
          const redisFlag = await redisService.getResetToken(`reset-allowed:${formattedPhone}`);
          if (redisFlag && Date.now() < redisFlag.expiresAt) {
            allowed = true;
          }
        } catch {}
      }
      if (!allowed) {
        return res.status(400).json({ error: 'Invalid or expired code' });
      }
      // Find user by phone
      let lookupContact = formattedPhone;
      let altContact = contact.replace(/[^\d]/g, '');
      let { data: user, error } = await supabase
        .from('users')
        .select('id')
        .or(`phone.eq.${lookupContact},phone.eq.${altContact}`)
        .single();
      if (error || !user) {
        return res.status(404).json({ error: 'User with this phone not found' });
      }
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update user password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updateError) {
        console.error('Password update error:', updateError);
        return res.status(500).json({ error: 'Failed to update password' });
      }
      // Delete reset allowed flag
      phoneResetAllowed.delete(formattedPhone);
      try {
        await redisService.deleteResetToken(`reset-allowed:${formattedPhone}`);
      } catch {}
      return res.json({ message: 'Password updated successfully!' });
    }
    // Get stored code data
    let resetData = null;
    try {
      resetData = await redisService.getResetToken(code);
    } catch (redisError) {
      resetData = resetTokens.get(code);
    }
    if (!resetData) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    if (resetData[method] !== contact) {
      return res.status(400).json({ error: 'Code does not match this user' });
    }
    if (new Date() > new Date(resetData.expiresAt)) {
      try { await redisService.deleteResetToken(code); } catch { resetTokens.delete(code); }
      return res.status(400).json({ error: 'Code has expired' });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('id', resetData.userId);
    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }
    // Clear code
    try { await redisService.deleteResetToken(code); } catch { resetTokens.delete(code); }
    res.json({ message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /auth/verify-reset-token - Verify reset token is valid
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Get stored reset token data from Redis
    let resetData = null;
    try {
      resetData = await redisService.getResetToken(token);
    } catch (redisError) {
      console.error('Redis error, using in-memory fallback:', redisError);
      // Fall back to in-memory storage
      resetData = resetTokens.get(token);
    }

    if (!resetData) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (new Date() > resetData.expiresAt) {
      try {
        await redisService.deleteResetToken(token);
      } catch (redisError) {
        console.error('Redis error:', redisError);
        resetTokens.delete(token);
      }
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    res.json({ 
      valid: true,
      email: resetData.email
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/upload-avatar
router.post('/upload-avatar', authenticateToken, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar file provided' });
    }
    const userId = req.user.userId;
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `avatars/${userId}_${Date.now()}${fileExtension}`;
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: true
      });
    if (error) {
      console.error('Supabase avatar upload error:', error);
      return res.status(500).json({ error: 'Failed to upload avatar' });
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    res.json({ 
      avatarUrl: publicUrlData.publicUrl,
      message: 'Avatar uploaded successfully' 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// GET /auth/check-username/:username - Check if username is available
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        available: false, 
        error: 'Username must be 3-32 characters long and contain only letters, numbers, and underscores' 
      });
    }

    // Normalize username to lowercase for case-insensitive check
    const normalizedUsername = username.toLowerCase();

    // Check if username exists (case-insensitive)
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('id')
      .ilike('username', normalizedUsername)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Username check error:', error);
      return res.status(500).json({ error: 'Failed to check username availability' });
    }

    const available = !existingUser;
    res.json({ available });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/apple - Apple Sign-In
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, fullName, email } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'Identity token is required' });
    }

    // Extract Apple user info from the identity token
    let appleUserInfo;
    let appleUserId;
    let appleEmail;
    
    try {
      appleUserInfo = await extractAppleUserInfo(identityToken, email);
      appleUserId = appleUserInfo.appleUserId;
      appleEmail = appleUserInfo.email || email;
    } catch (tokenError) {
      console.error('Token extraction error:', tokenError);
      return res.status(400).json({ error: 'Invalid identity token' });
    }

    // Check if user already exists with this Apple ID
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, name, username, avatar')
      .eq('apple_id', appleUserId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check existing user error:', checkError);
      return res.status(500).json({ error: 'Failed to check existing user' });
    }

    if (existingUser) {
      // User exists, generate JWT and return user data
      const token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          username: existingUser.username,
          avatar: existingUser.avatar
        },
        isNewUser: false
      });
    } else {
      // New user - return success but indicate they need to complete profile
      res.json({
        appleUserId,
        appleEmail,
        fullName,
        isNewUser: true,
        message: 'Please complete your profile with name and username'
      });
    }

  } catch (error) {
    console.error('Apple Sign-In error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /auth/apple/complete - Complete Apple Sign-In profile
router.post('/apple/complete', async (req, res) => {
  try {
    const { appleUserId, appleEmail, fullName, name, username } = req.body;

    if (!appleUserId || !name || !username) {
      return res.status(400).json({ error: 'Apple user ID, name, and username are required' });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-32 characters long and contain only letters, numbers, and underscores' 
      });
    }

    // Check if username is available
    const normalizedUsername = username.toLowerCase();
    const { data: existingUsername, error: usernameError } = await supabase
      .from('users')
      .select('id')
      .ilike('username', normalizedUsername)
      .single();

    if (usernameError && usernameError.code !== 'PGRST116') {
      console.error('Username check error:', usernameError);
      return res.status(500).json({ error: 'Failed to check username availability' });
    }

    if (existingUsername) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: appleEmail,
        name: name,
        username: normalizedUsername,
        apple_id: appleUserId,
        auth_provider: 'apple',
        created_at: new Date().toISOString()
      })
      .select('id, email, name, username, avatar')
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        avatar: newUser.avatar
      },
      isNewUser: true
    });

  } catch (error) {
    console.error('Complete Apple Sign-In error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 