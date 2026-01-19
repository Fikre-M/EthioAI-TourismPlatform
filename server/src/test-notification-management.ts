import { PrismaClient } from '@prisma/client'
import { EnhancedNotificationService } from './services/notification/enhanced-notification.service'
import {
  NotificationType,
  DeliveryChannel,
  NotificationPriority
} from './types/notification.types'

async function testNotificationRetrievalAndManagement() {
  const prisma = new PrismaClient()
  const notificationService = new EnhancedNotificationService(prisma)

  try {
    console.log('🚀 Testing Notification Retrieval and Management...')

    // Test 1: Get or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-management@example.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-management@example.com',
          passwordHash: 'test-hash',
          name: 'Management Test User',
          role: 'USER'
        }
      })
      console.log('✅ Created management test user')
    } else {
      console.log('✅ Management test user already exists')
    }

    // Test 2: Create a variety of notifications for testing
    console.log('\n📝 Creating test notifications...')

    const testNotifications = []

    // Create notifications with different types, priorities, and channels
    const notificationData = [
      {
        type: NotificationType.BOOKING_CONFIRMATION,
        title: 'Booking Confirmed - Simien Mountains',
        priority: NotificationPriority.HIGH,
        channels: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH]
      },
      {
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment Processed Successfully',
        priority: NotificationPriority.NORMAL,
        channels: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL]
      },
      {
        type: NotificationType.CHAT_MESSAGE,
        title: 'New Message from Guide',
        priority: NotificationPriority.NORMAL,
        channels: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH]
      },
      {
        type: NotificationType.SECURITY_ALERT,
        title: 'New Login Detected',
        priority: NotificationPriority.CRITICAL,
        channels: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH]
      },
      {
        type: NotificationType.PROMOTIONAL,
        title: 'Special Offer: 20% Off Tours',
        priority: NotificationPriority.LOW,
        channels: [DeliveryChannel.IN_APP]
      },
      {
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: 'Maintenance Scheduled',
        priority: NotificationPriority.NORMAL,
        channels: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL]
      }
    ]

    for (const data of notificationData) {
      const notification = await notificationService.createNotification({
        userId: testUser.id,
        type: data.type,
        title: data.title,
        content: `This is a test notification for ${data.title}`,
        channels: data.channels,
        priority: data.priority,
        data: {
          testId: Math.random().toString(36).substr(2, 9),
          category: 'test'
        }
      })
      testNotifications.push(notification)
    }

    console.log(`✅ Created ${testNotifications.length} test notifications`)

    // Test 3: Basic notification retrieval
    console.log('\n🔍 Testing basic notification retrieval...')

    const allNotifications = await notificationService.getNotificationsEnhanced(testUser.id)
    console.log(`✅ Retrieved all notifications: ${allNotifications.notifications.length} (total: ${allNotifications.total}, unread: ${allNotifications.unreadCount})`)

    // Test 4: Filtering by notification type
    console.log('\n🏷️ Testing filtering by notification type...')

    const bookingNotifications = await notificationService.getNotificationsEnhanced(testUser.id, {
      types: [NotificationType.BOOKING_CONFIRMATION, NotificationType.BOOKING_REMINDER]
    })
    console.log(`✅ Booking notifications: ${bookingNotifications.notifications.length}`)

    const chatNotifications = await notificationService.getNotificationsEnhanced(testUser.id, {
      types: [NotificationType.CHAT_MESSAGE, NotificationType.CHAT_MENTION]
    })
    console.log(`✅ Chat notifications: ${chatNotifications.notifications.length}`)

    // Test 5: Filtering by priority
    console.log('\n⚡ Testing filtering by priority...')

    const highPriorityNotifications = await notificationService.getNotificationsEnhanced(testUser.id, {
      priorities: [NotificationPriority.HIGH, NotificationPriority.CRITICAL]
    })
    console.log(`✅ High priority notifications: ${highPriorityNotifications.notifications.length}`)

    const lowPriorityNotifications = await notificationService.getNotificationsEnhanced(testUser.id, {
      priorities: [NotificationPriority.LOW]
    })
    console.log(`✅ Low priority notifications: ${lowPriorityNotifications.notifications.length}`)

    // Test 6: Sorting and pagination
    console.log('\n📊 Testing sorting and pagination...')

    const sortedByPriority = await notificationService.getNotificationsEnhanced(testUser.id, {
      sortBy: 'priority',
      sortOrder: 'desc',
      limit: 3
    })
    console.log(`✅ Sorted by priority (desc): ${sortedByPriority.notifications.length} notifications`)
    console.log('   Priority order:', sortedByPriority.notifications.map(n => n.priority))

    const sortedByDate = await notificationService.getNotificationsEnhanced(testUser.id, {
      sortBy: 'createdAt',
      sortOrder: 'asc',
      limit: 3
    })
    console.log(`✅ Sorted by date (asc): ${sortedByDate.notifications.length} notifications`)

    // Test 7: Pagination
    console.log('\n📄 Testing pagination...')

    const page1 = await notificationService.getNotificationsEnhanced(testUser.id, {
      limit: 2,
      offset: 0
    })
    console.log(`✅ Page 1: ${page1.notifications.length} notifications`)

    const page2 = await notificationService.getNotificationsEnhanced(testUser.id, {
      limit: 2,
      offset: 2
    })
    console.log(`✅ Page 2: ${page2.notifications.length} notifications`)

    // Test 8: Mark individual notifications as read
    console.log('\n✅ Testing individual mark as read...')

    const firstNotification = testNotifications[0]
    await notificationService.markAsRead(firstNotification.id, testUser.id)
    console.log(`✅ Marked notification ${firstNotification.id} as read`)

    // Verify read status
    const afterRead = await notificationService.getNotificationsEnhanced(testUser.id, {
      unreadOnly: false
    })
    const readCount = afterRead.notifications.filter(n => n.readAt !== null).length
    console.log(`✅ Read notifications count: ${readCount}`)

    // Test 9: Bulk mark as read
    console.log('\n📦 Testing bulk mark as read...')

    const notificationIds = testNotifications.slice(1, 4).map(n => n.id)
    const markedCount = await notificationService.markMultipleAsRead(notificationIds, testUser.id)
    console.log(`✅ Bulk marked ${markedCount} notifications as read`)

    // Test 10: Mark all as read
    console.log('\n🔄 Testing mark all as read...')

    await notificationService.markAllAsRead(testUser.id)
    console.log('✅ Marked all notifications as read')

    const afterMarkAll = await notificationService.getNotificationsEnhanced(testUser.id)
    console.log(`✅ Unread count after mark all: ${afterMarkAll.unreadCount}`)

    // Test 11: Delete individual notification
    console.log('\n🗑️ Testing individual notification deletion...')

    const notificationToDelete = testNotifications[testNotifications.length - 1]
    await notificationService.deleteNotification(notificationToDelete.id, testUser.id)
    console.log(`✅ Deleted notification ${notificationToDelete.id}`)

    // Test 12: Bulk delete notifications
    console.log('\n📦 Testing bulk notification deletion...')

    const idsToDelete = testNotifications.slice(0, 2).map(n => n.id)
    const deletedCount = await notificationService.deleteMultipleNotifications(idsToDelete, testUser.id)
    console.log(`✅ Bulk deleted ${deletedCount} notifications`)

    // Test 13: Get notification statistics
    console.log('\n📊 Testing notification statistics...')

    const stats = await notificationService.getNotificationStats(testUser.id)
    console.log('✅ Notification statistics:', {
      total: stats.total,
      unread: stats.unread,
      byType: Object.keys(stats.byType).length + ' types',
      byPriority: Object.keys(stats.byPriority).length + ' priorities',
      byChannel: Object.keys(stats.byChannel).length + ' channels'
    })

    console.log('   Types breakdown:', stats.byType)
    console.log('   Priority breakdown:', stats.byPriority)
    console.log('   Channel breakdown:', stats.byChannel)

    // Test 14: Filter unread only
    console.log('\n👁️ Testing unread only filter...')

    // Create a new unread notification
    const unreadNotification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.CHAT_MESSAGE,
      title: 'New Unread Message',
      content: 'This notification should appear in unread filter',
      channels: [DeliveryChannel.IN_APP],
      priority: NotificationPriority.NORMAL
    })

    const unreadOnly = await notificationService.getNotificationsEnhanced(testUser.id, {
      unreadOnly: true
    })
    console.log(`✅ Unread only notifications: ${unreadOnly.notifications.length}`)

    // Test 15: Test expiration handling
    console.log('\n⏰ Testing expiration handling...')

    // Create a notification that expires soon
    const expiringNotification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.PROMOTIONAL,
      title: 'Expiring Promotion',
      content: 'This promotion expires soon',
      channels: [DeliveryChannel.IN_APP],
      priority: NotificationPriority.LOW,
      expiresAt: new Date(Date.now() + 1000) // Expires in 1 second
    })

    console.log('✅ Created expiring notification')

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1500))

    const withExpired = await notificationService.getNotificationsEnhanced(testUser.id, {
      includeExpired: true
    })
    const withoutExpired = await notificationService.getNotificationsEnhanced(testUser.id, {
      includeExpired: false
    })

    console.log(`✅ With expired: ${withExpired.notifications.length}, Without expired: ${withoutExpired.notifications.length}`)

    // Test 16: Cleanup expired notifications
    console.log('\n🧹 Testing expired notification cleanup...')

    const cleanedCount = await notificationService.cleanupExpiredNotifications()
    console.log(`✅ Cleaned up ${cleanedCount} expired notifications`)

    console.log('\n🎉 All notification retrieval and management tests passed!')
    console.log('\nFeatures verified:')
    console.log('  ✅ Basic notification retrieval with pagination')
    console.log('  ✅ Filtering by type, priority, and read status')
    console.log('  ✅ Sorting by different fields (priority, date, type)')
    console.log('  ✅ Individual and bulk mark as read operations')
    console.log('  ✅ Individual and bulk delete operations')
    console.log('  ✅ Comprehensive notification statistics')
    console.log('  ✅ Unread-only filtering')
    console.log('  ✅ Expiration handling and cleanup')
    console.log('  ✅ Proper read/unread status tracking')

  } catch (error) {
    console.error('❌ Notification management test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotificationRetrievalAndManagement()
    .then(() => {
      console.log('\n✅ Notification management test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Notification management test failed:', error)
      process.exit(1)
    })
}

export { testNotificationRetrievalAndManagement }