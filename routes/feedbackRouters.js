import express from 'express';
import {
  createFeedback,
  getAllFeedback,
  // ADD:
  updateFeedback,
  deleteFeedback,
} from '../controllers/feedbackController.js';

// Optional (uncomment if you have it):
// import { adminAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/', getAllFeedback);

// --- ADD: admin-only edit & delete
// Use adminAuth if available: router.put('/:id', adminAuth, updateFeedback);
//                            router.delete('/:id', adminAuth, deleteFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

export default router;
