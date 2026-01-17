import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import {
  createReview,
  getReviews,
  updateReview,
  deleteReview,
  getReviewStats
} from '../controllers/reviews.controller';
import { auth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a review with optional media uploads
router.post(
  '/',
  auth,
  upload.array('media', 5), // Allow up to 5 files
  [
    body('content').trim().notEmpty().withMessage('Review content is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('entityType').isIn(['tour', 'hotel', 'restaurant']).withMessage('Invalid entity type'),
    body('entityId').notEmpty().withMessage('Entity ID is required')
  ],
  createReview
);

// Get reviews with pagination
router.get('/', [
  body('entityType').isIn(['tour', 'hotel', 'restaurant']).withMessage('Invalid entity type'),
  body('entityId').notEmpty().withMessage('Entity ID is required')
], getReviews);

// Get review statistics
router.get('/stats/:entityType/:entityId', getReviewStats);

// Update a review
router.put(
  '/:id',
  auth,
  upload.array('media', 5),
  [
    body('content').optional().trim().notEmpty().withMessage('Content cannot be empty'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],
  updateReview
);

// Delete a review
router.delete('/:id', auth, deleteReview);

export default router;
