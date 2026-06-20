import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe conditionally
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// @desc    Create Stripe Checkout Session
// @route   POST /api/payments/create-checkout-session
// @access  Private (Founder only)
export const createCheckoutSession = asyncHandler(async (req, res) => {
  const { planName = 'Premium Founder Plan', amount = 49 } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  // If Stripe is not configured or configured with mock keys, simulate checkout
  if (!stripe || process.env.STRIPE_SECRET_KEY === 'sk_test_mock') {
    console.log('[Payment System] Stripe is not configured. Initiating mock payment session.');
    const mockSessionId = `mock_sess_${Date.now()}`;
    return res.status(200).json({
      success: true,
      url: `${clientUrl}/payment?session_id=${mockSessionId}&mock=true`,
      sessionId: mockSessionId,
      isMock: true
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planName,
              description: 'Access unlimited open position postings on StartupForge.'
            },
            unit_amount: amount * 100 // Stripe expects amounts in cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: req.user.email,
      success_url: `${clientUrl}/payment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment?canceled=true`
    });

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('[Stripe Session Creation Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate checkout session with Stripe: ' + error.message
    });
  }
});

// @desc    Verify Stripe Session and finalize payment
// @route   POST /api/payments/verify-session
// @access  Private (Founder only)
export const verifySession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session ID is required.' });
  }

  // Check if this session was already processed
  const existingPayment = await Payment.findOne({ transaction_id: sessionId });
  if (existingPayment) {
    return res.status(200).json({
      success: true,
      message: 'Payment was already processed successfully.',
      payment: existingPayment
    });
  }

  let paymentRecord = null;

  // Handle Mock verification
  if (sessionId.startsWith('mock_sess_')) {
    paymentRecord = await Payment.create({
      user_email: req.user.email.toLowerCase(),
      userName: req.user.name,
      amount: 49,
      planName: 'Premium Founder Plan',
      transaction_id: sessionId,
      payment_status: 'Success',
      paid_at: new Date()
    });

    // Upgrade User Status
    await User.findByIdAndUpdate(req.user.id, { isPremium: true });
    
    return res.status(200).json({
      success: true,
      message: 'Mock transaction completed successfully. Founder account upgraded to Premium!',
      payment: paymentRecord
    });
  }

  // Handle real Stripe verification
  if (!stripe) {
    return res.status(400).json({ success: false, message: 'Stripe integration is not configured on this server.' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      paymentRecord = await Payment.create({
        user_email: req.user.email.toLowerCase(),
        userName: req.user.name,
        amount: (session.amount_total || 4900) / 100,
        planName: 'Premium Founder Plan',
        transaction_id: session.id,
        payment_status: 'Success',
        paid_at: new Date()
      });

      // Mark User as premium
      await User.findByIdAndUpdate(req.user.id, { isPremium: true });

      res.status(200).json({
        success: true,
        message: 'Payment verification completed. Founder account upgraded to Premium!',
        payment: paymentRecord
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Stripe transaction status is not paid.'
      });
    }
  } catch (error) {
    console.error('[Stripe Verification Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error verifying Stripe transaction session: ' + error.message
    });
  }
});

// @desc    Get all payments list (For admin audit)
// @route   GET /api/payments
// @access  Private (Admin only)
export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    payments
  });
});
