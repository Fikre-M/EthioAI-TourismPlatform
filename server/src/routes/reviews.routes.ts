import { Router, Request, Response } from 'express';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { AuthRequest } from '../modules/auth/auth.types';
import { ResponseUtil } from '../utils/response';
import { prisma } from '../utils/database';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();

// Get all reviews with optional filtering
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const tourId = req.query.tourId as string;
  const status = req.query.status as string || 'APPROVED';

  const where: any = {
    status
  };

  if (tourId) {
    where.tourId = tourId;
  }

  const [reviews, total] = await Promise.all([
    prisma.reviews.findMany({
      where,
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        },
        tours: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.reviews.count({ where })
  ]);

  const pages = Math.ceil(total / limit);

  ResponseUtil.success(res, {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages
    }
  }, 'Reviews retrieved');
}));

// Get reviews for a specific tour
router.get('/tour/:tourId', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { tourId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = {
    tourId,
    status: 'APPROVED'
  };

  const [reviews, total, averageRating] = await Promise.all([
    prisma.reviews.findMany({
      where,
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.reviews.count({ where }),
    prisma.reviews.aggregate({
      where,
      _avg: {
        rating: true
      }
    })
  ]);

  const pages = Math.ceil(total / limit);

  ResponseUtil.success(res, {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages
    },
    averageRating: averageRating._avg.rating || 0,
    totalReviews: total
  }, 'Tour reviews retrieved');
}));

// Create a new review
router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  
  if (!userId) {
    return ResponseUtil.unauthorized(res, 'User authentication required');
  }

  const { tourId, rating, title, comment, images } = req.body;

  // Check if tour exists
  const tour = await prisma.tours.findUnique({
    where: { id: tourId }
  });

  if (!tour) {
    return ResponseUtil.notFound(res, 'Tour not found');
  }

  // Check if user has already reviewed this tour
  const existingReview = await prisma.reviews.findFirst({
    where: {
      userId,
      tourId
    }
  });

  if (existingReview) {
    return ResponseUtil.conflict(res, 'You have already reviewed this tour');
  }

  // Check if user has booked this tour (optional verification)
  const booking = await prisma.bookings.findFirst({
    where: {
      userId,
      tourId,
      status: 'COMPLETED'
    }
  });

  const review = await (prisma.reviews.create as any)({
    data: {
      id: require('crypto').randomUUID(),
      userId,
      tourId,
      rating,
      title,
      comment,
      images: JSON.stringify(images || []),
      isVerified: !!booking,
      status: 'PENDING',
      updatedAt: new Date(),
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      tours: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });

  ResponseUtil.created(res, { review }, 'Review created successfully');
}));

// Update a review (user can only update their own)
router.put('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  
  if (!userId) {
    return ResponseUtil.unauthorized(res, 'User authentication required');
  }

  const { rating, title, comment, images } = req.body;

  const existingReview = await prisma.reviews.findUnique({
    where: { id }
  });

  if (!existingReview) {
    return ResponseUtil.notFound(res, 'Review not found');
  }

  if (existingReview.userId !== userId) {
    return ResponseUtil.forbidden(res, 'You can only update your own reviews');
  }

  const review = await prisma.reviews.update({
    where: { id },
    data: {
      rating,
      title,
      comment,
      images: JSON.stringify(images || []),
      status: 'PENDING' // Reset to pending after update
    },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      },
      tours: {
        select: {
          id: true,
          title: true,
          slug: true
        }
      }
    }
  });

  ResponseUtil.success(res, { review }, 'Review updated successfully');
}));

// Delete a review (user can only delete their own)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;
  
  if (!userId) {
    return ResponseUtil.unauthorized(res, 'User authentication required');
  }

  const existingReview = await prisma.reviews.findUnique({
    where: { id }
  });

  if (!existingReview) {
    return ResponseUtil.notFound(res, 'Review not found');
  }

  if (existingReview.userId !== userId) {
    return ResponseUtil.forbidden(res, 'You can only delete your own reviews');
  }

  await prisma.reviews.delete({
    where: { id }
  });

  ResponseUtil.success(res, null, 'Review deleted successfully');
}));

export default router;


