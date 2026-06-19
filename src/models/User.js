import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
  },
  role: {
    type: String,
    enum: ['founder', 'collaborator', 'admin'],
    default: 'collaborator'
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    default: ''
  },
  isPremium: {
    type: Boolean,
    default: false
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

// Virtual field for frontend compatibility
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
userSchema.virtual('avatar').get(function() {
  return this.image;
});
userSchema.virtual('status').get(function() {
  return this.isBlocked ? 'blocked' : 'active';
});

const User = mongoose.model('User', userSchema);

export default User;
