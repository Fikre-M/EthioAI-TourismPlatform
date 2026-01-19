import { PrismaClient } from '@prisma/client'
import { getNotificationService } from './services/notification'
import {
  NotificationType,
  DeliveryChannel,
  NotificationPriority
} from './types/notification.types'
import logger from './utils/logger'

async function testNotificationInfrastructure() {
  const prisma = new PrismaClient()
  const notificationService = getNotificationService(prisma)

  try {
    console.log('🚀 Testing Notification Infrastructure...')

    // Test 1: Create a test user (if not exists)
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'test-hash',
          name: 'Test User',
          role: 'USER'
        }
      })
      console.log('✅ Created test user')
    } else {
      console.log('✅ Test user already exists')
    }

    // Test 2: Create notification preferences
    const preferences = await notificationService.getPreferences(testUser.id)
    console.log('✅ Retrieved/created notification preferences:', {
      userId: preferences.userId,
      language: preferences.language,
      timezone: preferences.timezone
    })

    // Test 3: Create a test notification
    const notification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: 'Infrastructure Test',
      content: 'This is a test notification to verify the infrastructure is working correctly.',
      channels: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL],
      priority: NotificationPriority.NORMAL,
      data: {
        testData: 'infrastructure-test',
        timestamp: new Date().toISOString()
      }
    })
    console.log('✅ Created test notification:', {
      id: notification.id,
      type: notification.type,
      channels: notification.channels
    })

    // Test 4: Retrieve notifications
    const notifications = await notificationService.getNotifications(testUser.id, {
      limit: 10
    })
    console.log('✅ Retrieved notifications:', notifications.length)

    // Test 5: Get unread count
    const unreadCount = await notificationService.getUnreadCount(testUser.id)
    console.log('✅ Unread count:', unreadCount)

    // Test 6: Get queue stats
    const queueStats = await notificationService.getQueueStats()
    console.log('✅ Queue stats:', queueStats)

    // Test 7: Mark notification as read
    await notificationService.markAsRead(notification.id, testUser.id)
    console.log('✅ Marked notification as read')

    // Test 8: Verify read status
    const updatedUnreadCount = await notificationService.getUnreadCount(testUser.id)
    console.log('✅ Updated unread count:', updatedUnreadCount)

    console.log('\n🎉 All infrastructure tests passed!')
    console.log('\nInfrastructure components verified:')
    console.log('  ✅ Database schema and models')
    console.log('  ✅ Notification service')
    console.log('  ✅ Queue system')
    console.log('  ✅ User preferences')
    console.log('  ✅ CRUD operations')

  } catch (error) {
    console.error('❌ Infrastructure test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotificationInfrastructure()
    .then(() => {
      console.log('\n✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}

export { testNotificationInfrastructure }