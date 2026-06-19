import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  planName: {
    type: String,
    default: 'Premium Founder Upgrade'
  },
  transaction_id: {
    type: String,
    required: true,
    unique: true
  },
  payment_status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  },
  paid_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual mappings for frontend compatibility
paymentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});
paymentSchema.virtual('transactionId').get(function() {
  return this.transaction_id;
});
paymentSchema.virtual('status').get(function() {
  return this.payment_status;
});
paymentSchema.virtual('date').get(function() {
  return this.paid_at.toISOString().split('T')[0];
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
