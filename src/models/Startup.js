import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
  startup_name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    default: '🚀'
  },
  industry: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  funding_stage: {
    type: String,
    enum: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Bootstrapped'],
    default: 'Pre-seed'
  },
  founder_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  founderName: {
    type: String,
    default: 'Anonymous Founder'
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    default: 'Remote'
  },
  website: {
    type: String,
    default: ''
  },
  pitch: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending'
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

// Virtual bindings for frontend compatibility (camelCase mapping)
startupSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
startupSchema.virtual('name').get(function() {
  return this.startup_name;
});
startupSchema.virtual('fundingStage').get(function() {
  return this.funding_stage;
});
startupSchema.virtual('createdDate').get(function() {
  return this.createdAt.toISOString().split('T')[0];
});

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;
