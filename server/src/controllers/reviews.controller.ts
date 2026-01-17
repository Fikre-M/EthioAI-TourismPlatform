import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { uploadToS3 } from '../utils/fileUpload';

export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, content, rating, entityType, entityId } = req.body;
    const files = req.files as Express.Multer.File[];
    
    // Upload media files if any
    const mediaUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadToS3(file);
        mediaUrls.push(url);
      }
    }

    const review = await Review.create({
      user: userId,
      content,
      rating,
      entityType, // 'tour', 'hotel', 'restaurant', etc.
      entityId,
      media: mediaUrls,
    });

    // Update the average rating for the entity
    await updateEntityRating(entityType, entityId);

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review' });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ entityType, entityId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const count = await Review.countDocuments({ entityType, entityId });

    res.json({
      reviews,
      totalPages: Math.ceil(count / Number(limit)),
      currentPage: Number(page),
      totalReviews: count
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, rating } = req.body;
    const files = req.files as Express.Multer.File[];

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the user is the owner of the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    // Upload new media files if any
    const mediaUrls = [...review.media];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadToS3(file);
        mediaUrls.push(url);
      }
    }

    const updatedReview = await Review.findByIdAndUpdate(
      id,
      { content, rating, media: mediaUrls },
      { new: true }
    );

    // Update the average rating for the entity
    await updateEntityRating(review.entityType, review.entityId);

    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review' });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the user is the owner or an admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(id);

    // Update the average rating for the entity
    await updateEntityRating(review.entityType, review.entityId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review' });
  }
};

// Helper function to update entity's average rating
const updateEntityRating = async (entityType: string, entityId: string) => {
  try {
    const result = await Review.aggregate([
      { $match: { entityType, entityId } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      const { averageRating, reviewCount } = result[0];
      
      // Update the entity's rating based on its type
      let Model;
      switch (entityType) {
        case 'tour':
          Model = (await import('../models/Tour')).default;
          break;
        case 'hotel':
          Model = (await import('../models/Hotel')).default;
          break;
        // Add other entity types as needed
        default:
          return;
      }

      await Model.findByIdAndUpdate(entityId, {
        rating: averageRating,
        reviewCount
      });
    }
  } catch (error) {
    console.error('Error updating entity rating:', error);
  }
};

export const getReviewStats = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    
    const stats = await Review.aggregate([
      { $match: { entityType, entityId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const total = stats.reduce((sum, stat) => sum + stat.count, 0);
    const average = stats.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / total || 0;

    res.json({
      total,
      average: parseFloat(average.toFixed(1)),
      distribution: stats.reduce((acc, stat) => ({
        ...acc,
        [stat._id]: stat.count
      }), {})
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    res.status(500).json({ message: 'Error getting review stats' });
  }
};
