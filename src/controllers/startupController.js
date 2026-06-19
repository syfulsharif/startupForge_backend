import Startup from '../models/Startup.js';
import Opportunity from '../models/Opportunity.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create a startup profile
// @route   POST /api/startups
// @access  Private (Founder only)
export const createStartup = asyncHandler(async (req, res) => {
  const { name, logo, industry, description, fundingStage, location, website, pitch } = req.body;

  if (!name || !description || !industry) {
    return res.status(400).json({ success: false, message: 'Startup name, industry, and description are required.' });
  }

  // Create startup
  const startup = await Startup.create({
    startup_name: name,
    logo: logo || '🚀',
    industry,
    description,
    funding_stage: fundingStage || 'Pre-seed',
    founder_email: req.user.email,
    founderName: req.user.name,
    founderId: req.user._id,
    location: location || 'Remote',
    website: website || '',
    pitch: pitch || '',
    status: 'pending' // Admins approve startups
  });

  res.status(201).json({
    success: true,
    message: 'Startup registered successfully. Pending administrator review.',
    startup
  });
});

// @desc    Get all startups (Approved status by default for non-admins)
// @route   GET /api/startups
// @access  Public
export const getStartups = asyncHandler(async (req, res) => {
  const filter = {};
  
  // By default, public list only shows approved startups
  if (!req.query.all || req.user?.role !== 'admin') {
    filter.status = 'approved';
  }

  const startups = await Startup.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: startups.length,
    startups
  });
});

// @desc    Get single startup details
// @route   GET /api/startups/:id
// @access  Public
export const getStartupDetails = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);

  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup not found.' });
  }

  res.status(200).json({
    success: true,
    startup
  });
});

// @desc    Update startup profile
// @route   PUT /api/startups/:id
// @access  Private (Founder / Owner only)
export const updateStartup = asyncHandler(async (req, res) => {
  let startup = await Startup.findById(req.params.id);

  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup profile not found.' });
  }

  // Confirm ownership
  if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this startup.' });
  }

  const { name, logo, industry, description, fundingStage, location, website, pitch } = req.body;

  if (name) startup.startup_name = name;
  if (logo) startup.logo = logo;
  if (industry) startup.industry = industry;
  if (description) startup.description = description;
  if (fundingStage) startup.funding_stage = fundingStage;
  if (location) startup.location = location;
  if (website) startup.website = website;
  if (pitch) startup.pitch = pitch;

  // Save changes
  await startup.save();

  res.status(200).json({
    success: true,
    message: 'Startup details updated successfully.',
    startup
  });
});

// @desc    Delete startup profile
// @route   DELETE /api/startups/:id
// @access  Private (Founder owner or Admin)
export const deleteStartup = asyncHandler(async (req, res) => {
  const startup = await Startup.findById(req.params.id);

  if (!startup) {
    return res.status(404).json({ success: false, message: 'Startup profile not found.' });
  }

  // Check permissions
  if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this profile.' });
  }

  // Delete all opportunities under this startup
  await Opportunity.deleteMany({ startup_id: startup._id });

  // Delete startup
  await Startup.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Startup profile and associated vacancies deleted successfully.'
  });
});
