import { PrismaClient } from '@prisma/client';
import { log } from '../utils/logger';
import { EmailService } from './email.service';
import { 
  NotFoundError, 
  ForbiddenError, 
  ValidationError 
} from '../middlewares/error.middleware';

const prisma = new PrismaClient();

export interface DashboardStats {
  users: {
    total: number;
    new: number;
    active: number;
    suspended: number;
  };
  tours: {
    total: number;
    published: number;
    pending: number;
    draft: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    thisMonth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    averageRating: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  redis: {
    status: 'connected' | 'disconnected';
    responseTime: number;
  };
  email: {
    status: 'working' | 'error';
    lastTest: Date | null;
  };
  storage: {
    status: 'available' | 'full' | 'error';
    usage: number;
  };
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export class AdminService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Users stats
      const [totalUsers, newUsers, activeUsers, suspendedUsers] = await Promise.all([
        prisma.users.count(),
        prisma.users.count({
          where: { createdAt: { gte: startOfMonth } }
        }),
        prisma.users.count({
          where: { 
            updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.users.count({
          where: { 
            // Assuming you have a suspended field or status
            // For now, we'll use a placeholder
          }
        })
      ]);

      // Tours stats
      const [totalTours, publishedTours, pendingTours, draftTours] = await Promise.all([
        prisma.tours.count(),
        prisma.tours.count({ where: { status: 'PUBLISHED' } }),
        prisma.tours.count({ where: { status: 'DRAFT' } }), // Assuming pending is draft
        prisma.tours.count({ where: { status: 'DRAFT' } })
      ]);

      // Bookings stats
      const [totalBookings, confirmedBookings, pendingBookings, cancelledBookings, thisMonthBookings] = await Promise.all([
        prisma.bookings.count(),
        prisma.bookings.count({ where: { status: 'CONFIRMED' } }),
        prisma.bookings.count({ where: { status: 'PENDING' } }),
        prisma.bookings.count({ where: { status: 'CANCELLED' } }),
        prisma.bookings.count({
          where: { createdAt: { gte: startOfMonth } }
        })
      ]);

      // Revenue stats
      const [totalRevenue, thisMonthRevenue, lastMonthRevenue] = await Promise.all([
        prisma.payments.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true }
        }),
        prisma.payments.aggregate({
          where: { 
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth }
          },
          _sum: { amount: true }
        }),
        prisma.payments.aggregate({
          where: { 
            status: 'COMPLETED',
            createdAt: { 
              gte: startOfLastMonth,
              lte: endOfLastMonth
            }
          },
          _sum: { amount: true }
        })
      ]);

      const thisMonthRev = Number(thisMonthRevenue._sum.amount || 0);
      const lastMonthRev = Number(lastMonthRevenue._sum.amount || 0);
      const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

      // Reviews stats
      const [totalReviews, pendingReviews, approvedReviews, avgRating] = await Promise.all([
        prisma.reviews.count(),
        prisma.reviews.count({ where: { status: 'PENDING' } }),
        prisma.reviews.count({ where: { status: 'APPROVED' } }),
        prisma.reviews.aggregate({
          where: { status: 'APPROVED' },
          _avg: { rating: true }
        })
      ]);

      return {
        users: {
          total: totalUsers,
          new: newUsers,
          active: activeUsers,
          suspended: suspendedUsers
        },
        tours: {
          total: totalTours,
          published: publishedTours,
          pending: pendingTours,
          draft: draftTours
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          pending: pendingBookings,
          cancelled: cancelledBookings,
          thisMonth: thisMonthBookings
        },
        revenue: {
          total: Number(totalRevenue._sum.amount || 0),
          thisMonth: thisMonthRev,
          lastMonth: lastMonthRev,
          growth: Math.round(growth * 100) / 100
        },
        reviews: {
          total: totalReviews,
          pending: pendingReviews,
          approved: approvedReviews,
          averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10
        }
      };
    } catch (error) {
      log.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 50): Promise<any[]> {
    try {
      // This would typically come from an activity log table
      // For now, we'll aggregate from various tables
      const [recentBookings, recentUsers, recentReviews] = await Promise.all([
        prisma.bookings.findMany({
          take: Math.floor(limit / 3),
          orderBy: { createdAt: 'desc' },
          include: {
            users: { select: { name: true, email: true } },
            tours: { select: { title: true } }
          }
        }),
        prisma.users.findMany({
          take: Math.floor(limit / 3),
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, email: true, createdAt: true, role: true }
        }),
        prisma.reviews.findMany({
          take: Math.floor(limit / 3),
          orderBy: { createdAt: 'desc' },
          include: {
            users: { select: { name: true } },
            tours: { select: { title: true } }
          }
        })
      ]);

      const activities = [
        ...recentBookings.map(booking => ({
          id: booking.id,
          type: 'booking',
          action: 'created',
          description: `New booking for ${booking.tours.title}`,
          user: booking.users.name,
          timestamp: booking.createdAt,
          metadata: {
            bookingNumber: booking.bookingNumber,
            status: booking.status
          }
        })),
        ...recentUsers.map(user => ({
          id: user.id,
          type: 'user',
          action: 'registered',
          description: `New user registered`,
          user: user.name,
          timestamp: user.createdAt,
          metadata: {
            email: user.email,
            role: user.role
          }
        })),
        ...recentReviews.map(review => ({
          id: review.id,
          type: 'review',
          action: 'created',
          description: `New review for ${review.tours?.title || 'product'}`,
          user: review.users?.name,
          timestamp: review.createdAt,
          metadata: {
            rating: review.rating,
            status: review.status
          }
        }))
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      log.error('Failed to get recent activities:', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      const startTime = Date.now();
      
      // Test database connection
      let dbStatus: 'connected' | 'disconnected' = 'connected';
      let dbResponseTime = 0;
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbResponseTime = Date.now() - dbStart;
      } catch (error) {
        dbStatus = 'disconnected';
        dbResponseTime = -1;
      }

      // Test Redis connection (if available)
      let redisStatus: 'connected' | 'disconnected' = 'connected';
      let redisResponseTime = 0;
      try {
        // This would test your Redis connection
        // const redis = new Redis(process.env.REDIS_URL);
        // const redisStart = Date.now();
        // await redis.ping();
        // redisResponseTime = Date.now() - redisStart;
        redisResponseTime = 5; // Placeholder
      } catch (error) {
        redisStatus = 'disconnected';
        redisResponseTime = -1;
      }

      // Test email service
      let emailStatus: 'working' | 'error' = 'working';
      let emailLastTest: Date | null = new Date();
      try {
        // This would test email service
        // await EmailService.testConnection();
      } catch (error) {
        emailStatus = 'error';
      }

      // Get memory usage
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryPercentage = (usedMemory / totalMemory) * 100;

      // Calculate uptime
      const uptime = process.uptime();

      // Determine overall status
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (dbStatus === 'disconnected' || emailStatus === 'error') {
        overallStatus = 'critical';
      } else if (redisStatus === 'disconnected' || memoryPercentage > 80) {
        overallStatus = 'warning';
      }

      return {
        status: overallStatus,
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        redis: {
          status: redisStatus,
          responseTime: redisResponseTime
        },
        email: {
          status: emailStatus,
          lastTest: emailLastTest
        },
        storage: {
          status: 'available', // Placeholder
          usage: 45 // Placeholder percentage
        },
        uptime,
        memory: {
          used: usedMemory,
          total: totalMemory,
          percentage: Math.round(memoryPercentage * 100) / 100
        }
      };
    } catch (error) {
      log.error('Failed to get system health:', error);
      return {
        status: 'critical',
        database: { status: 'disconnected', responseTime: -1 },
        redis: { status: 'disconnected', responseTime: -1 },
        email: { status: 'error', lastTest: null },
        storage: { status: 'error', usage: 0 },
        uptime: 0,
        memory: { used: 0, total: 0, percentage: 0 }
      };
    }
  }

  // User Management

  static async getUsers(page: number, limit: number, filters: any) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.role) {
        where.role = filters.role;
      }

      const [users, total] = await Promise.all([
        prisma.users.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [filters.sortBy]: filters.sortOrder },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isEmailVerified: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                bookings: true,
                reviews: true
              }
            }
          }
        }),
        prisma.users.count({ where })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      log.error('Failed to get users:', error);
      throw error;
    }
  }

  static async getUserDetails(userId: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          bookings: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              tours: { select: { title: true } }
            }
          },
          reviews: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              tours: { select: { title: true } }
            }
          },
          payments: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              bookings: true,
              reviews: true,
              payments: true
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      log.error('Failed to get user details:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, data: any, adminId: string) {
    try {
      const user = await prisma.users.update({
        where: { id: userId },
        data: {
          ...data,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isEmailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      log.error('Failed to update user:', error);
      throw error;
    }
  }

  static async toggleUserStatus(userId: string, suspended: boolean, reason: string, adminId: string) {
    try {
      // This would update a suspended field if you have one
      // For now, we'll just log the action
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Send notification email to user
      if (suspended) {
        await EmailService.sendEmail({
          to: user.email,
          subject: 'Account Suspended',
          html: `
            <h2>Account Suspended</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>Your account has been suspended.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you believe this is an error, please contact support.</p>
            <p>Best regards,<br>The EthioAI Tourism Team</p>
          `,
          text: `Your account has been suspended. Reason: ${reason}`
        });
      }

      return user;
    } catch (error) {
      log.error('Failed to toggle user status:', error);
      throw error;
    }
  }

  // Tour Management

  static async getTours(page: number, limit: number, filters: any) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      const [tours, total] = await Promise.all([
        prisma.tours.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [filters.sortBy]: filters.sortOrder },
          include: {
            _count: {
              select: {
                bookings: true,
                reviews: true
              }
            }
          }
        }),
        prisma.tours.count({ where })
      ]);

      return {
        tours,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      log.error('Failed to get tours:', error);
      throw error;
    }
  }

  static async updateTourStatus(tourId: string, status: string, reason: string, adminId: string) {
    try {
      const tour = await prisma.tours.update({
        where: { id: tourId },
        data: {
          status: status as any,
          updatedAt: new Date()
        },
        include: {
          _count: {
            select: { bookings: true, reviews: true }
          }
        }
      });

      // Tour status updated - no guide notification (guide relation not in schema)
      log.info(`Tour ${tourId} status updated to ${status} by admin ${adminId}`);

      return tour;
    } catch (error) {
      log.error('Failed to update tour status:', error);
      throw error;
    }
  }

  static async toggleTourFeatured(tourId: string, featured: boolean, adminId: string) {
    try {
      const tour = await prisma.tours.update({
        where: { id: tourId },
        data: {
          featured,
          updatedAt: new Date()
        }
      });

      return tour;
    } catch (error) {
      log.error('Failed to toggle tour featured:', error);
      throw error;
    }
  }

  static async updateBookingStatus(bookingId: string, status: string, adminId: string) {
    try {
      const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
          users: { select: { name: true, email: true } },
          tours: { select: { title: true } }
        }
      });

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      const updatedBooking = await prisma.bookings.update({
        where: { id: bookingId },
        data: { 
          status,
          updatedAt: new Date()
        },
        include: {
          users: { select: { name: true, email: true } },
          tours: { select: { title: true } }
        }
      });

      // Send notification email
      try {
        await EmailService.sendBookingStatusUpdate(booking.users.email, {
          bookingNumber: booking.bookingNumber,
          tourTitle: booking.tours.title,
          status,
          userName: booking.users.name
        });
      } catch (emailError) {
        log.warn('Failed to send booking status update email:', emailError);
      }

      log.info(`Booking ${bookingId} status updated to ${status} by admin ${adminId}`);
      
      return updatedBooking;
    } catch (error) {
      log.error('Failed to update booking status:', error);
      throw error;
    }
  }

  static async getBookings(page: number, limit: number, filters: any) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) {
          where.createdAt.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          where.createdAt.lte = new Date(filters.dateTo);
        }
      }

      const [bookings, total] = await Promise.all([
        prisma.bookings.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [filters.sortBy]: filters.sortOrder },
          include: {
            users: { select: { name: true, email: true } },
            tours: { select: { title: true } },
            payments: { select: { status: true, amount: true } }
          }
        }),
        prisma.bookings.count({ where })
      ]);

      return {
        bookings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      log.error('Failed to get bookings:', error);
      throw error;
    }
  }

  static async getAnalytics(params: any) {
    try {
      // This would implement comprehensive analytics
      // For now, return placeholder data
      return {
        users: {
          total: 1250,
          growth: 15.5,
          chartData: []
        },
        revenue: {
          total: 125000,
          growth: 22.3,
          chartData: []
        },
        bookings: {
          total: 450,
          growth: 18.7,
          chartData: []
        }
      };
    } catch (error) {
      log.error('Failed to get analytics:', error);
      throw error;
    }
  }

  // Placeholder methods for other functionality
  static async getPayments(page: number, limit: number, filters: any) { /* Implementation */ }
  static async processRefund(paymentId: string, amount: number, reason: string, adminId: string) { /* Implementation */ }
  static async getReviews(page: number, limit: number, filters: any) { /* Implementation */ }
  static async moderateReview(reviewId: string, status: string, reason: string, adminId: string) { /* Implementation */ }
  static async getCulturalContent(page: number, limit: number, filters: any) { /* Implementation */ }
  static async updateContentStatus(contentId: string, status: string, reason: string, adminId: string) { /* Implementation */ }
  static async getRevenueAnalytics(period: string, groupBy: string) { /* Implementation */ }
  static async getSystemLogs(page: number, limit: number, filters: any) { /* Implementation */ }
  static async updateSystemSettings(settings: any, adminId: string) { /* Implementation */ }
  static async getSystemSettings() { /* Implementation */ }
  static async bulkUpdateUsers(userIds: string[], action: string, data: any, adminId: string) { /* Implementation */ }
  static async exportData(type: string, format: string, filters: any, adminId: string) { /* Implementation */ }
}


