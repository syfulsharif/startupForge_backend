import express from 'express';
import User from '../models/User.js';
import Startup from '../models/Startup.js';
import Opportunity from '../models/Opportunity.js';
import Payment from '../models/Payment.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// @desc    Get dashboard telemetry statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats', asyncHandler(async (req, res) => {
  const usersCount = await User.countDocuments({});
  const startupsCount = await Startup.countDocuments({});
  const opportunitiesCount = await Opportunity.countDocuments({});
  
  const payments = await Payment.find({});
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  res.status(200).json({
    success: true,
    stats: {
      users: usersCount,
      startups: startupsCount,
      opportunities: opportunitiesCount,
      revenue: totalRevenue
    }
  });
}));

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    users
  });
}));

// @desc    Block or Unblock a user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin only)
router.put('/users/:id/block', asyncHandler(async (req, res) => {
  const { isBlocked } = req.body;

  if (typeof isBlocked !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Please provide isBlocked status as a boolean.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  // Prevent admin from blocking themselves
  if (user._id.toString() === req.user.id) {
    return res.status(400).json({ success: false, message: 'Admins cannot suspend their own accounts.' });
  }

  user.isBlocked = isBlocked;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Account status updated to: ${isBlocked ? 'blocked' : 'active'}`,
    user
  });
}));

// @desc    Toggle user premium status manually
// @route   PUT /api/admin/users/:id/premium
// @access  Private (Admin only)
router.put('/users/:id/premium', asyncHandler(async (req, res) => {
  const { isPremium } = req.body;

  if (typeof isPremium !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Please provide isPremium status as a boolean.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  user.isPremium = isPremium;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Premium status updated to: ${isPremium ? 'Premium' : 'Standard'}`,
    user
  });
}));

// @desc    Approve startup profile
// @route   PUT /api/admin/startups/:id/approve
// @access  Private (Admin only)
router.put('/startups/:id/approve', asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);
  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup company profile not found.' });
  }

  startup.status = 'approved';
  await startup.save();

  res.status(200).json({
    success: true,
    message: 'Startup registered profile is now APPROVED.',
    startup
  });
}));

export default router;
