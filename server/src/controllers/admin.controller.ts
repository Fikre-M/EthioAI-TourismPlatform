import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AdminService } from '../services/admin.service';
import { ResponseUtil } from '../utils/response';
import { log } from '../utils/logger';
import { asyncHandler } from '../middlewares/error.middleware';

export class AdminController {
  /**
   * Get dashboard statistics
   */
  static getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await AdminService.getDashboardStats();
    
    return ResponseUtil.success(res, stats, 'Dashboard statistics retrieved successfully');
  });

  /**
   * Get recent activities
   */
  static getRecentActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 50 } = req.query;
    
    const activities = await AdminService.getRecentActivities(Number(limit));
    
    return ResponseUtil.success(res, { activities }, 'Recent activities retrieved successfully');
  });

  /**
   * Get system health
   */
  static getSystemHealth = asyncHandler(async (req: AuthRequest, res: Response) => {
    const health = await AdminService.getSystemHealth();
    
    return ResponseUtil.success(res, health, 'System health retrieved successfully');
  });

  // User Management

  /**
   * Get all users with pagination and filters
   */
  static getUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      role: role as string,
      status: status as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getUsers(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Users retrieved successfully');
  });

  /**
   * Get user details
   */
  static getUserDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    
    const user = await AdminService.getUserDetails(userId);
    
    return ResponseUtil.success(res, { user }, 'User details retrieved successfully');
  });

  /**
   * Update user
   */
  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const adminId = req.userId!;
    
    const user = await AdminService.updateUser(userId, req.body, adminId);
    
    log.admin('User updated', adminId, { targetUserId: userId, changes: Object.keys(req.body) });
    
    return ResponseUtil.success(res, { user }, 'User updated successfully');
  });

  /**
   * Suspend/unsuspend user
   */
  static toggleUserStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { suspended, reason } = req.body;
    const adminId = req.userId!;
    
    const user = await AdminService.toggleUserStatus(userId, suspended, reason, adminId);
    
    log.admin(`User ${suspended ? 'suspended' : 'unsuspended'}`, adminId, { 
      targetUserId: userId, 
      reason 
    });
    
    return ResponseUtil.success(res, { user }, `User ${suspended ? 'suspended' : 'unsuspended'} successfully`);
  });

  // Tour Management

  /**
   * Get all tours for admin
   */
  static getTours = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      category: category as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getTours(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Tours retrieved successfully');
  });

  /**
   * Approve/reject tour
   */
  static updateTourStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tourId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.userId!;
    
    const tour = await AdminService.updateTourStatus(tourId, status, reason, adminId);
    
    log.admin(`Tour status updated to ${status}`, adminId, { 
      tourId, 
      status, 
      reason 
    });
    
    return ResponseUtil.success(res, { tour }, 'Tour status updated successfully');
  });

  /**
   * Feature/unfeature tour
   */
  static toggleTourFeatured = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tourId } = req.params;
    const { featured } = req.body;
    const adminId = req.userId!;
    
    const tour = await AdminService.toggleTourFeatured(tourId, featured, adminId);
    
    log.admin(`Tour ${featured ? 'featured' : 'unfeatured'}`, adminId, { tourId });
    
    return ResponseUtil.success(res, { tour }, `Tour ${featured ? 'featured' : 'unfeatured'} successfully`);
  });

  // Booking Management

  /**
   * Get all bookings
   */
  static getBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getBookings(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Bookings retrieved successfully');
  });

  /**
   * Update booking status
   */
  static updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bookingId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.userId!;
    
    const booking = await AdminService.updateBookingStatus(bookingId, status, reason, adminId);
    
    log.admin(`Booking status updated to ${status}`, adminId, { 
      bookingId, 
      status, 
      reason 
    });
    
    return ResponseUtil.success(res, { booking }, 'Booking status updated successfully');
  });

  // Payment Management

  /**
   * Get all payments
   */
  static getPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      method,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      method: method as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getPayments(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Payments retrieved successfully');
  });

  /**
   * Process refund
   */
  static processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.userId!;
    
    const refund = await AdminService.processRefund(paymentId, amount, reason, adminId);
    
    log.admin('Refund processed', adminId, { 
      paymentId, 
      amount, 
      reason 
    });
    
    return ResponseUtil.success(res, { refund }, 'Refund processed successfully');
  });

  // Review Management

  /**
   * Get all reviews
   */
  static getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      rating: rating ? Number(rating) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getReviews(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Reviews retrieved successfully');
  });

  /**
   * Moderate review
   */
  static moderateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reviewId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.userId!;
    
    const review = await AdminService.moderateReview(reviewId, status, reason, adminId);
    
    log.admin(`Review ${status}`, adminId, { 
      reviewId, 
      status, 
      reason 
    });
    
    return ResponseUtil.success(res, { review }, `Review ${status} successfully`);
  });

  // Content Management

  /**
   * Get cultural content
   */
  static getCulturalContent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      search: search as string,
      status: status as string,
      type: type as string,
      category: category as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await AdminService.getCulturalContent(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, result, 'Cultural content retrieved successfully');
  });

  /**
   * Update content status
   */
  static updateContentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { contentId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.userId!;
    
    const content = await AdminService.updateContentStatus(contentId, status, reason, adminId);
    
    log.admin(`Content status updated to ${status}`, adminId, { 
      contentId, 
      status, 
      reason 
    });
    
    return ResponseUtil.success(res, { content }, 'Content status updated successfully');
  });

  // Analytics

  /**
   * Get analytics data
   */
  static getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      period = '30d',
      metric,
      startDate,
      endDate
    } = req.query;

    const analytics = await AdminService.getAnalytics({
      period: period as string,
      metric: metric as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    
    return ResponseUtil.success(res, analytics, 'Analytics data retrieved successfully');
  });

  /**
   * Get revenue analytics
   */
  static getRevenueAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      period = '30d',
      groupBy = 'day'
    } = req.query;

    const revenue = await AdminService.getRevenueAnalytics(period as string, groupBy as string);
    
    return ResponseUtil.success(res, revenue, 'Revenue analytics retrieved successfully');
  });

  // System Management

  /**
   * Get system logs
   */
  static getSystemLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = 1,
      limit = 100,
      level,
      category,
      dateFrom,
      dateTo
    } = req.query;

    const filters = {
      level: level as string,
      category: category as string,
      dateFrom: dateFrom as string,
      dateTo: dateTo as string
    };

    const logs = await AdminService.getSystemLogs(Number(page), Number(limit), filters);
    
    return ResponseUtil.success(res, logs, 'System logs retrieved successfully');
  });

  /**
   * Update system settings
   */
  static updateSystemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminId = req.userId!;
    
    const settings = await AdminService.updateSystemSettings(req.body, adminId);
    
    log.admin('System settings updated', adminId, { 
      settings: Object.keys(req.body) 
    });
    
    return ResponseUtil.success(res, { settings }, 'System settings updated successfully');
  });

  /**
   * Get system settings
   */
  static getSystemSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = await AdminService.getSystemSettings();
    
    return ResponseUtil.success(res, { settings }, 'System settings retrieved successfully');
  });

  // Bulk Operations

  /**
   * Bulk update users
   */
  static bulkUpdateUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userIds, action, data } = req.body;
    const adminId = req.userId!;
    
    const result = await AdminService.bulkUpdateUsers(userIds, action, data, adminId);
    
    log.admin(`Bulk ${action} on users`, adminId, { 
      userIds, 
      action, 
      count: userIds.length 
    });
    
    return ResponseUtil.success(res, result, `Bulk ${action} completed successfully`);
  });

  /**
   * Export data
   */
  static exportData = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { type, format = 'csv', filters } = req.body;
    const adminId = req.userId!;
    
    const exportResult = await AdminService.exportData(type, format, filters, adminId);
    
    log.admin(`Data export: ${type}`, adminId, { type, format });
    
    return ResponseUtil.success(res, exportResult, 'Data export completed successfully');
  });
}