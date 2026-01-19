// Notification System Types and Interfaces

export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  CHAT_MENTION = 'CHAT_MENTION',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  SECURITY_ALERT = 'SECURITY_ALERT',
  PROMOTIONAL = 'PROMOTIONAL'
}

export enum DeliveryChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export enum NotificationPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB'
}

// Core Interfaces
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  data?: Record<string, any>
  channels: DeliveryChannel[]
  priority: NotificationPriority
  status: NotificationStatus
  readAt?: Date
  createdAt: Date
  updatedAt: Date
  scheduledAt?: Date
  expiresAt?: Date
}

export interface CreateNotificationRequest {
  userId: string
  type: NotificationType
  title: string
  content: string
  data?: Record<string, any>
  channels: DeliveryChannel[]
  priority: NotificationPriority
  scheduledAt?: Date
  expiresAt?: Date
}

export interface NotificationFilters {
  type?: NotificationType
  status?: NotificationStatus
  priority?: NotificationPriority
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// User Preferences
export interface NotificationPreferences {
  userId: string
  channels: ChannelPreferences
  quietHours?: QuietHours
  frequency: NotificationFrequency
  language: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface ChannelPreferences {
  [NotificationType.BOOKING_CONFIRMATION]: DeliveryChannel[]
  [NotificationType.BOOKING_REMINDER]: DeliveryChannel[]
  [NotificationType.BOOKING_CANCELLED]: DeliveryChannel[]
  [NotificationType.PAYMENT_SUCCESS]: DeliveryChannel[]
  [NotificationType.PAYMENT_FAILED]: DeliveryChannel[]
  [NotificationType.CHAT_MESSAGE]: DeliveryChannel[]
  [NotificationType.CHAT_MENTION]: DeliveryChannel[]
  [NotificationType.SYSTEM_ANNOUNCEMENT]: DeliveryChannel[]
  [NotificationType.SECURITY_ALERT]: DeliveryChannel[]
  [NotificationType.PROMOTIONAL]: DeliveryChannel[]
}

export interface QuietHours {
  enabled: boolean
  startTime: string // HH:mm format
  endTime: string   // HH:mm format
  timezone: string
  allowCritical: boolean
}

export enum NotificationFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

// Device Registration
export interface DeviceRegistration {
  id: string
  userId: string
  deviceToken: string
  platform: Platform
  appVersion?: string
  isActive: boolean
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
}

// Push Notifications
export interface PushNotification {
  deviceTokens: string[]
  title: string
  body: string
  data?: Record<string, string>
  imageUrl?: string
  actionButtons?: NotificationAction[]
}

export interface NotificationAction {
  id: string
  title: string
  action: string
  url?: string
}

export interface PushResult {
  success: boolean
  messageId?: string
  error?: string
  invalidTokens?: string[]
}

// Templates
export interface NotificationTemplate {
  id: string
  type: NotificationType
  locale: string
  title: string
  content: string
  emailSubject?: string
  pushTitle?: string
  pushBody?: string
  variables: TemplateVariable[]
  version: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  type: 'string' | 'number' | 'date' | 'boolean'
  required: boolean
  description?: string
}

export interface TemplateData {
  [key: string]: any
}

export interface RenderedTemplate {
  title: string
  content: string
  emailSubject?: string
  pushTitle?: string
  pushBody?: string
}

export interface CreateTemplateRequest {
  type: NotificationType
  locale: string
  title: string
  content: string
  emailSubject?: string
  pushTitle?: string
  pushBody?: string
  variables: TemplateVariable[]
}

export interface UpdateTemplateRequest {
  title?: string
  content?: string
  emailSubject?: string
  pushTitle?: string
  pushBody?: string
  variables?: TemplateVariable[]
  isActive?: boolean
}

// Queue System
export interface NotificationJob {
  id: string
  type: NotificationType
  userId: string
  channels: DeliveryChannel[]
  payload: NotificationPayload
  priority: number
  delay?: number
  attempts?: number
}

export interface NotificationPayload {
  title: string
  content: string
  data?: Record<string, any>
  templateId?: string
  templateData?: TemplateData
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

// Service Interfaces
export interface NotificationService {
  createNotification(notification: CreateNotificationRequest): Promise<Notification>
  getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>
  markAsRead(notificationId: string, userId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(notificationId: string, userId: string): Promise<void>
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>
  getPreferences(userId: string): Promise<NotificationPreferences>
  sendBroadcast(message: BroadcastMessage, audience: UserSegment): Promise<void>
}

export interface BroadcastMessage {
  type: NotificationType
  title: string
  content: string
  data?: Record<string, any>
  channels: DeliveryChannel[]
  priority: NotificationPriority
}

export interface UserSegment {
  userIds?: string[]
  roles?: string[]
  locations?: string[]
  all?: boolean
}

// WebSocket Events
export interface SocketEvents {
  'notification:new': (notification: Notification) => void
  'notification:read': (notificationId: string) => void
  'notification:bulk_read': (notificationIds: string[]) => void
  'user:online': (userId: string) => void
  'user:offline': (userId: string) => void
}

// Error Types
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'NotificationError'
  }
}

export class ValidationError extends NotificationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class NotFoundError extends NotificationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404)
  }
}

export class UnauthorizedError extends NotificationError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401)
  }
}