import express from 'express';
import { createCheckoutSession, verifySession, getPayments } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/create-checkout-session', authorize('founder', 'admin'), createCheckoutSession);
router.post('/verify-session', authorize('founder', 'admin'), verifySession);
router.get('/', authorize('admin'), getPayments);

export default router;
