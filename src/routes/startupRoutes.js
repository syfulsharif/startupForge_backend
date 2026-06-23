import express from 'express';
import { createStartup, getStartups, getStartupDetails, updateStartup, deleteStartup, getMyStartups } from '../controllers/startupController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, authorize('founder', 'admin'), createStartup)
  .get(getStartups);

router.route('/my')
  .get(protect, authorize('founder', 'admin'), getMyStartups);

router.route('/:id')
  .get(getStartupDetails)
  .put(protect, authorize('founder', 'admin'), updateStartup)
  .delete(protect, authorize('founder', 'admin'), deleteStartup);

export default router;
