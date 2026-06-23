import express from 'express';
import { createOpportunity, getOpportunities, getOpportunityDetails, updateOpportunity, deleteOpportunity, getMyOpportunities } from '../controllers/opportunityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('founder', 'admin'), createOpportunity)
  .get(getOpportunities);

router.route('/my')
  .get(protect, authorize('founder', 'admin'), getMyOpportunities);

router.route('/:id')
  .get(getOpportunityDetails)
  .put(protect, authorize('founder', 'admin'), updateOpportunity)
  .delete(protect, authorize('founder', 'admin'), deleteOpportunity);

export default router;
