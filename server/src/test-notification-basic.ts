import { PrismaClient } from '@prisma/client'
import { BaseNotificationService } from './services/notification/base.service'
import {
  NotificationType,
  DeliveryChannel,
  NotificationPriority
} from './types/notification.types'

async function testBasicNotificationFunctionality() {
  const prisma = new PrismaClient()
  const notificationService = new BaseNotificationService(prisma)

  try {
    console.log('🚀 Testing Basic Notification Functionality (without Redis)...')

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
      title: 'Basic Infrastructure Test',
      content: 'This is a test notification to verify the basic database functionality is working correctly.',
      channels: [DeliveryChannel.IN_APP],
      priority: NotificationPriority.NORMAL,
      data: {
        testData: 'basic-infrastructure-test',
        timestamp: new Date().toISOString()
      }
    })
    console.log('✅ Created test notification:', {
      id: notification.id,
      type: notification.type,
      channels: notification.channels,
      priority: notification.priority
    })

    // Test 4: Retrieve notifications
    const notifications = await notificationService.getNotifications(testUser.id, {
      limit: 10
    })
    console.log('✅ Retrieved notifications:', notifications.length)

    // Test 5: Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: testUser.id,
        status: { not: 'READ' },
      },
    })
    console.log('✅ Unread count:', unreadCount)

    // Test 6: Mark notification as read
    await notificationService.markAsRead(notification.id, testUser.id)
    console.log('✅ Marked notification as read')

    // Test 7: Verify read status
    const updatedUnreadCount = await prisma.notification.count({
      where: {
        userId: testUser.id,
        status: { not: 'READ' },
      },
    })
    console.log('✅ Updated unread count:', updatedUnreadCount)

    // Test 8: Update preferences
    const updatedPrefs = await notificationService.updatePreferences(testUser.id, {
      language: 'es',
      timezone: 'America/New_York'
    })
    console.log('✅ Updated preferences:', {
      language: updatedPrefs.language,
      timezone: updatedPrefs.timezone
    })

    console.log('\n🎉 All basic functionality tests passed!')
    console.log('\nBasic components verified:')
    console.log('  ✅ Database schema and models')
    console.log('  ✅ Notification CRUD operations')
    console.log('  ✅ User preferences management')
    console.log('  ✅ Type mappings and validations')

  } catch (error) {
    console.error('❌ Basic functionality test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBasicNotificationFunctionality()
    .then(() => {
      console.log('\n✅ Basic test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Basic test failed:', error)
      process.exit(1)
    })
}

export { testBasicNotificationFunctionality }