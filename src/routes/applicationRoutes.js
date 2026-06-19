import express from 'express';
import { applyToOpportunity, getApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(authorize('collaborator', 'admin'), applyToOpportunity)
  .get(getApplications);

router.route('/:id/status')
  .put(authorize('founder', 'admin'), updateApplicationStatus);

export default router;
