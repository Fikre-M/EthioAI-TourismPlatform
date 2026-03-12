import { Request, Response } from 'express';
import { AuthRequest } from '../modules/auth/auth.types';
import { ReviewService } from '../services/review.service';
import { ResponseUtil } from '../utils/response';

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { content, rating, entityType, entityId } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }
    
    const review = await ReviewService.createReview({
      userId,
      content,
      rating,
      entityType,
      entityId,
    });
    
    return ResponseUtil.created(res, { review }, 'Review created successfully');
  } catch (error) {
    console.error('Error creating review:', error);
    return ResponseUtil.internalError(res, 'Failed to create review');
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, page = 1, limit = 10 } = req.query;
    
    const reviews = await ReviewService.getReviews({
      entityType: entityType as string,
      entityId: entityId as string,
      page: Number(page),
      limit: Number(limit),
    });
    
    return ResponseUtil.success(res, reviews, 'Reviews retrieved successfully');
  } catch (error) {
    console.error('Error getting reviews:', error);
    return ResponseUtil.internalError(res, 'Failed to get reviews');
  }
};

export const updateReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }
    
    const review = await ReviewService.updateReview(id, {
      content,
      rating,
    });
    
    return ResponseUtil.success(res, { review }, 'Review updated successfully');
  } catch (error) {
    console.error('Error updating review:', error);
    return ResponseUtil.internalError(res, 'Failed to update review');
  }
};

export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return ResponseUtil.unauthorized(res, 'Authentication required');
    }
    
    await ReviewService.deleteReview(id);
    
    return ResponseUtil.success(res, null, 'Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    return ResponseUtil.internalError(res, 'Failed to delete review');
  }
};

export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Mock stats for now
    const stats = {
      total: 0,
      average: 0,
      distribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      }
    };

    return ResponseUtil.success(res, stats, 'Review stats retrieved successfully');
  } catch (error) {
    console.error('Error getting review stats:', error);
    return ResponseUtil.internalError(res, 'Failed to get review stats');
  }
};
