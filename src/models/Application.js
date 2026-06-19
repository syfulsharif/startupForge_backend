import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  opportunity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: true
  },
  opportunityTitle: {
    type: String,
    required: true
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  applicant_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  applicantName: {
    type: String,
    required: true
  },
  applicantBio: {
    type: String,
    default: ''
  },
  applicantSkills: {
    type: [String],
    default: []
  },
  portfolio_link: {
    type: String,
    required: true
  },
  motivation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected'],
    default: 'Pending'
  },
  applied_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual mappings for frontend compatibility
applicationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
applicationSchema.virtual('opportunityId').get(function() {
  return this.opportunity_id.toHexString();
});
applicationSchema.virtual('applicantEmail').get(function() {
  return this.applicant_email;
});
applicationSchema.virtual('applicantPortfolio').get(function() {
  return this.portfolio_link;
});
applicationSchema.virtual('appliedDate').get(function() {
  return this.applied_at.toISOString().split('T')[0];
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
