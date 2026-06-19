import mongoose from 'mongoose';

const opportunitySchema = new mongoose.Schema({
  startup_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  startupName: {
    type: String,
    required: true
  },
  role_title: {
    type: String,
    required: true,
    trim: true
  },
  required_skills: {
    type: [String],
    required: true,
    default: []
  },
  work_type: {
    type: String,
    enum: ['Remote', 'Hybrid', 'Onsite'],
    default: 'Remote'
  },
  commitment_level: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Equity Only'],
    default: 'Full-time'
  },
  deadline: {
    type: String, // String format (YYYY-MM-DD) as used in frontend
    required: true
  },
  description: {
    type: String,
    required: true
  },
  salaryRange: {
    type: String,
    default: 'Equity Only'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual bindings for frontend compatibility
opportunitySchema.virtual('id').get(function() {
  return this._id.toHexString();
});
opportunitySchema.virtual('startupId').get(function() {
  return this.startup_id.toHexString();
});
opportunitySchema.virtual('title').get(function() {
  return this.role_title;
});
opportunitySchema.virtual('skills').get(function() {
  return this.required_skills;
});
opportunitySchema.virtual('workType').get(function() {
  return this.work_type;
});
opportunitySchema.virtual('commitment').get(function() {
  return this.commitment_level;
});
opportunitySchema.virtual('createdDate').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

const Opportunity = mongoose.model('Opportunity', opportunitySchema);

export default Opportunity;
