import Application from '../models/Application.js';
import Opportunity from '../models/Opportunity.js';
import Startup from '../models/Startup.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Apply to an opportunity
// @route   POST /api/applications
// @access  Private (Collaborator only)
export const applyToOpportunity = asyncHandler(async (req, res) => {
  const { opportunityId, portfolioLink, applicantPortfolio, motivation, applicantBio } = req.body;

  const actualPortfolio = portfolioLink || applicantPortfolio;
  const actualMotivation = motivation || applicantBio;

  if (!opportunityId || !actualPortfolio || !actualMotivation) {
    return res.status(400).json({ success: false, message: 'Please compile all application details.' });
  }

  // Find Opportunity
  const opportunity = await Opportunity.findById(opportunityId);
  if (!opportunity) {
    return res.status(404).json({ success: false, message: 'Opportunity vacancy not found.' });
  }

  // Find Startup
  const startup = await Startup.findById(opportunity.startup_id);
  if (!startup) {
    return res.status(404).json({ success: false, message: 'Associated Startup profile not found.' });
  }

  // Check if collaborator has already applied
  const alreadyApplied = await Application.findOne({
    opportunity_id: opportunityId,
    applicant_email: req.user.email.toLowerCase()
  });

  if (alreadyApplied) {
    return res.status(400).json({ success: false, message: 'You have already submitted an application for this role.' });
  }

  // Create Application
  const application = await Application.create({
    opportunity_id: opportunityId,
    opportunityTitle: opportunity.role_title,
    startupId: opportunity.startup_id,
    startupName: opportunity.startupName,
    applicant_email: req.user.email.toLowerCase(),
    applicantName: req.user.name,
    applicantBio: req.user.bio || 'Professional technical collaborator.',
    applicantSkills: req.user.skills || [],
    portfolio_link: actualPortfolio,
    motivation: actualMotivation,
    status: 'Pending'
  });

  res.status(201).json({
    success: true,
    message: 'Application details submitted successfully to founder.',
    application
  });
});

// @desc    Get user applications list (Founder gets incoming; Collaborator gets submitted)
// @route   GET /api/applications
// @access  Private
export const getApplications = asyncHandler(async (req, res) => {
  let applications = [];

  if (req.user.role === 'collaborator') {
    // Return applications submitted by this collaborator
    applications = await Application.find({ applicant_email: req.user.email.toLowerCase() }).sort({ createdAt: -1 });
  } else if (req.user.role === 'founder') {
    // Return incoming applications for the startups owned by this founder
    const myStartups = await Startup.find({ founderId: req.user.id });
    const myStartupIds = myStartups.map(s => s._id);
    applications = await Application.find({ startupId: { $in: myStartupIds } }).sort({ createdAt: -1 });
  } else if (req.user.role === 'admin') {
    // Admin gets all applications
    applications = await Application.find({}).sort({ createdAt: -1 });
  }

  res.status(200).json({
    success: true,
    count: applications.length,
    applications
  });
});

// @desc    Update application status (Accept / Reject)
// @route   PUT /api/applications/:id
// @access  Private (Founder only)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !['Pending', 'Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid application decision status.' });
  }

  const application = await Application.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application record not found.' });
  }

  // Verify Startup ownership
  const startup = await Startup.findById(application.startupId);
  if (!startup || (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, message: 'Unauthorized. You do not own the parent startup.' });
  }

  // Update status
  application.status = status;
  await application.save();

  res.status(200).json({
    success: true,
    message: `Application status successfully updated to: ${status}`,
    application
  });
});
