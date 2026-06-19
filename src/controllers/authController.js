import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Helper: Generate JWT and set HttpOnly Cookie
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production',
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        avatar: user.image,
        role: user.role,
        isBlocked: user.isBlocked,
        status: user.isBlocked ? 'blocked' : 'active',
        bio: user.bio,
        skills: user.skills,
        experience: user.experience,
        isPremium: user.isPremium,
        createdAt: user.createdAt
      }
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, image } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please compile all registration fields.' });
  }

  // Password Rules validation
  const hasMinLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  if (!hasMinLength || !hasUpper || !hasLower) {
    return res.status(400).json({
      success: false,
      message: 'Password does not meet validation criteria: must be at least 6 characters and contain both uppercase and lowercase letters.'
    });
  }

  // Check user existence
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Set avatar url (use uploaded file if req.file was uploaded, or standard preset)
  let avatarUrl = image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
  if (req.file) {
    // If multer parsed a file and it was uploaded
    avatarUrl = req.file.path || `/uploads/${req.file.filename}`;
  }

  // Create User
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    image: avatarUrl,
    isPremium: false,
    isBlocked: false,
    bio: role === 'collaborator' ? 'Dedicated developer interested in early startup builds.' : 'Startup founder seeking cofounders.',
    skills: role === 'collaborator' ? ['React', 'JavaScript', 'Tailwind CSS'] : [],
    experience: 'New profile registered.'
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login a user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
  }

  // Find User
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ success: false, message: 'Credentials rejected. Invalid email or password.' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Credentials rejected. Invalid email or password.' });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Google SSO Login Simulation
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req, res) => {
  const { email, name, image } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Google sign-in missing profile details.' });
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }
    // Update name/image if changed
    user.name = name;
    if (image) user.image = image;
    await user.save();
  } else {
    // Create new collaborator profile by default for Google signup
    const randomPassword = Math.random().toString(36).slice(-8) + 'A1';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(randomPassword, salt);

    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'collaborator',
      image: image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      isBlocked: false,
      bio: 'Registered via Google OAuth.',
      skills: ['React', 'JavaScript'],
      experience: 'New Google-linked profile.'
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully.'
  });
});

// @desc    Get current user profile (session check)
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      avatar: user.image,
      role: user.role,
      isBlocked: user.isBlocked,
      status: user.isBlocked ? 'blocked' : 'active',
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      isPremium: user.isPremium,
      createdAt: user.createdAt
    }
  });
});

// @desc    Update CV Profile Details
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, skills, experience, image } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) {
    user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
  }
  if (experience !== undefined) user.experience = experience;
  if (image) user.image = image;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Collaborator CV details updated successfully.',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      avatar: user.image,
      role: user.role,
      isBlocked: user.isBlocked,
      status: user.isBlocked ? 'blocked' : 'active',
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      isPremium: user.isPremium,
      createdAt: user.createdAt
    }
  });
});
