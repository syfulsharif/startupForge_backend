import Opportunity from '../models/Opportunity.js';
import Startup from '../models/Startup.js';
import Application from '../models/Application.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Create an opportunity listing
// @route   POST /api/opportunities
// @access  Private (Founder only)
export const createOpportunity = asyncHandler(async (req, res) => {
  const { startupId, title, skills, workType, commitment, deadline, description, salaryRange } = req.body;

  if (!startupId || !title || !skills || !deadline || !description) {
    return res.status(400).json({ success: false, message: 'Please compile all required position details.' });
  }

  // Find Startup to verify ownership
  const startup = await Startup.findById(startupId);
  if (!startup) {
    return res.status(404).json({ success: false, message: 'Associated Startup profile not found.' });
  }

  if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this startup.' });
  }

  // Premium Check: A founder can create up to 3 opportunities for free.
  // We check how many total opportunities are posted by startups owned by this user.
  const myStartups = await Startup.find({ founderId: req.user.id });
  const myStartupIds = myStartups.map(s => s._id);
  const count = await Opportunity.countDocuments({ startup_id: { $in: myStartupIds } });

  if (count >= 3 && !req.user.isPremium) {
    return res.status(403).json({
      success: false,
      message: 'Opportunity posting limit exceeded. Free accounts are limited to 3 job vacancies. Please upgrade to Founder Premium to post more.',
      limitExceeded: true
    });
  }

  // Create Opportunity
  const opportunity = await Opportunity.create({
    startup_id: startupId,
    startupName: startup.startup_name,
    role_title: title,
    required_skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
    work_type: workType || 'Remote',
    commitment_level: commitment || 'Full-time',
    deadline,
    description,
    salaryRange: salaryRange || 'Equity Only'
  });

  res.status(201).json({
    success: true,
    message: 'Opportunity vacancy published successfully.',
    opportunity
  });
});

// @desc    Get paginated, filtered opportunities list
// @route   GET /api/opportunities
// @access  Public
export const getOpportunities = asyncHandler(async (req, res) => {
  const { search, industry, workType, commitment, sort, page = 1, limit = 6 } = req.query;

  const query = {};

  // Search by role_title, required_skills, or startupName using MongoDB $regex
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { role_title: { $regex: searchRegex } },
      { required_skills: { $regex: searchRegex } },
      { startupName: { $regex: searchRegex } }
    ];
  }

  // Filter by workType (uses MongoDB $in as per requirements)
  if (workType && workType !== 'All') {
    const workTypes = Array.isArray(workType) 
      ? workType 
      : workType.split(',').map(w => w.trim());
    query.work_type = { $in: workTypes };
  }

  // Filter by commitment
  if (commitment && commitment !== 'All') {
    query.commitment_level = commitment;
  }

  // Filter by industry (cross-collection industry matching using $in)
  if (industry && industry !== 'All') {
    const targetStartups = await Startup.find({ industry }).select('_id');
    const startupIds = targetStartups.map(s => s._id);
    query.startup_id = { $in: startupIds };
  }

  // Pagination calculations
  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 6;
  const skip = (parsedPage - 1) * parsedLimit;

  // Sorting setup
  let sortCriteria = { createdAt: -1 };
  if (sort === 'oldest') {
    sortCriteria = { createdAt: 1 };
  }

  // Query Database
  const total = await Opportunity.countDocuments(query);
  const opportunities = await Opportunity.find(query)
    .sort(sortCriteria)
    .skip(skip)
    .limit(parsedLimit);

  res.status(200).json({
    success: true,
    total,
    page: parsedPage,
    pages: Math.ceil(total / parsedLimit),
    limit: parsedLimit,
    opportunities
  });
});

// @desc    Get single opportunity details
// @route   GET /api/opportunities/:id
// @access  Public
export const getOpportunityDetails = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity) {
    return res.status(404).json({ success: false, message: 'Opportunity vacancy not found.' });
  }

  res.status(200).json({
    success: true,
    opportunity
  });
});

// @desc    Update opportunity listing
// @route   PUT /api/opportunities/:id
// @access  Private (Founder only)
export const updateOpportunity = asyncHandler(async (req, res) => {
  let opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity) {
    return res.status(404).json({ success: false, message: 'Opportunity vacancy not found.' });
  }

  // Verify Startup ownership
  const startup = await Startup.findById(opportunity.startup_id);
  if (!startup || (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Unauthorized. You do not own the parent startup.' });
  }

  const { title, skills, workType, commitment, deadline, description, salaryRange } = req.body;

  if (title) opportunity.role_title = title;
  if (skills) opportunity.required_skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
  if (workType) opportunity.work_type = workType;
  if (commitment) opportunity.commitment_level = commitment;
  if (deadline) opportunity.deadline = deadline;
  if (description) opportunity.description = description;
  if (salaryRange) opportunity.salaryRange = salaryRange;

  await opportunity.save();

  res.status(200).json({
    success: true,
    message: 'Opportunity vacancy details updated.',
    opportunity
  });
});

// @desc    Delete opportunity listing
// @route   DELETE /api/opportunities/:id
// @access  Private (Founder owner or Admin)
export const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity) {
    return res.status(404).json({ success: false, message: 'Opportunity vacancy not found.' });
  }

  // Verify Startup ownership
  const startup = await Startup.findById(opportunity.startup_id);
  if (!startup || (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Unauthorized. You cannot delete this listing.' });
  }

  // Delete all candidate applications submitted for this opportunity
  await Application.deleteMany({ opportunity_id: opportunity._id });

  // Delete opportunity
  await Opportunity.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Opportunity vacancy and associated applications deleted.'
  });
});
