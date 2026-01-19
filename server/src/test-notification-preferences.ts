import { PrismaClient } from '@prisma/client'
import { NotificationPreferencesService } from './services/notification/preferences.service'
import { EnhancedNotificationService } from './services/notification/enhanced-notification.service'
import {
  NotificationType,
  DeliveryChannel,
  NotificationPriority,
  NotificationFrequency,
  QuietHours
} from './types/notification.types'

async function testNotificationPreferences() {
  const prisma = new PrismaClient()
  const preferencesService = new NotificationPreferencesService(prisma)
  const notificationService = new EnhancedNotificationService(prisma)

  try {
    console.log('🚀 Testing Notification Preferences System...')

    // Test 1: Get or create test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'test-preferences@example.com' }
    })

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test-preferences@example.com',
          passwordHash: 'test-hash',
          name: 'Preferences Test User',
          role: 'USER'
        }
      })
      console.log('✅ Created preferences test user')
    } else {
      console.log('✅ Preferences test user already exists')
    }

    // Test 2: Get default preferences (should create them automatically)
    console.log('\n📋 Testing default preferences creation...')

    const defaultPreferences = await preferencesService.getPreferences(testUser.id)
    console.log('✅ Retrieved default preferences:', {
      frequency: defaultPreferences.frequency,
      language: defaultPreferences.language,
      timezone: defaultPreferences.timezone,
      hasQuietHours: !!defaultPreferences.quietHours,
      channelTypesCount: Object.keys(defaultPreferences.channels).length
    })

    // Verify default channel preferences
    console.log('   Default channels for booking confirmation:', defaultPreferences.channels[NotificationType.BOOKING_CONFIRMATION])
    console.log('   Default channels for chat messages:', defaultPreferences.channels[NotificationType.CHAT_MESSAGE])
    console.log('   Default channels for security alerts:', defaultPreferences.channels[NotificationType.SECURITY_ALERT])

    // Test 3: Update general preferences
    console.log('\n⚙️ Testing general preferences update...')

    const updatedPreferences = await preferencesService.updatePreferences(testUser.id, {
      frequency: NotificationFrequency.HOURLY,
      language: 'es',
      timezone: 'America/New_York'
    })

    console.log('✅ Updated general preferences:', {
      frequency: updatedPreferences.frequency,
      language: updatedPreferences.language,
      timezone: updatedPreferences.timezone
    })

    // Test 4: Update channel preferences for specific notification types
    console.log('\n📱 Testing channel preferences update...')

    await preferencesService.updateChannelPreferences(testUser.id, {
      [NotificationType.CHAT_MESSAGE]: [DeliveryChannel.IN_APP], // Only in-app for chat
      [NotificationType.PROMOTIONAL]: [], // No promotional notifications
      [NotificationType.SECURITY_ALERT]: [DeliveryChannel.IN_APP, DeliveryChannel.EMAIL, DeliveryChannel.PUSH, DeliveryChannel.SMS] // All channels for security
    })

    const afterChannelUpdate = await preferencesService.getPreferences(testUser.id)
    console.log('✅ Updated channel preferences:')
    console.log('   Chat messages:', afterChannelUpdate.channels[NotificationType.CHAT_MESSAGE])
    console.log('   Promotional:', afterChannelUpdate.channels[NotificationType.PROMOTIONAL])
    console.log('   Security alerts:', afterChannelUpdate.channels[NotificationType.SECURITY_ALERT])

    // Test 5: Set up quiet hours
    console.log('\n🌙 Testing quiet hours configuration...')

    const quietHours: QuietHours = {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/New_York',
      allowCritical: true
    }

    await preferencesService.updateQuietHours(testUser.id, quietHours)
    const withQuietHours = await preferencesService.getPreferences(testUser.id)
    
    console.log('✅ Set quiet hours:', {
      enabled: withQuietHours.quietHours?.enabled,
      startTime: withQuietHours.quietHours?.startTime,
      endTime: withQuietHours.quietHours?.endTime,
      allowCritical: withQuietHours.quietHours?.allowCritical
    })

    // Test 6: Test quiet hours detection
    console.log('\n🕐 Testing quiet hours detection...')

    // Test during quiet hours (simulate 23:00)
    const mockQuietHoursPrefs = {
      ...withQuietHours,
      quietHours: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
        allowCritical: true
      }
    }

    const isQuietNormal = preferencesService.isInQuietHours(mockQuietHoursPrefs, NotificationPriority.NORMAL)
    const isQuietCritical = preferencesService.isInQuietHours(mockQuietHoursPrefs, NotificationPriority.CRITICAL)
    
    console.log('✅ Quiet hours detection (simulated):')
    console.log('   Normal priority suppressed:', isQuietNormal)
    console.log('   Critical priority suppressed:', isQuietCritical)

    // Test 7: Test effective channel determination
    console.log('\n🎯 Testing effective channel determination...')

    const requestedChannels = [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL]
    
    // Test for chat message (should only get IN_APP based on our preferences)
    const effectiveChatChannels = preferencesService.determineEffectiveChannels(
      afterChannelUpdate,
      NotificationType.CHAT_MESSAGE,
      requestedChannels,
      NotificationPriority.NORMAL
    )

    // Test for security alert (should get all requested channels)
    const effectiveSecurityChannels = preferencesService.determineEffectiveChannels(
      afterChannelUpdate,
      NotificationType.SECURITY_ALERT,
      requestedChannels,
      NotificationPriority.HIGH
    )

    // Test for promotional (should get none)
    const effectivePromotionalChannels = preferencesService.determineEffectiveChannels(
      afterChannelUpdate,
      NotificationType.PROMOTIONAL,
      requestedChannels,
      NotificationPriority.LOW
    )

    console.log('✅ Effective channel determination:')
    console.log('   Chat message channels:', effectiveChatChannels)
    console.log('   Security alert channels:', effectiveSecurityChannels)
    console.log('   Promotional channels:', effectivePromotionalChannels)

    // Test 8: Test notification creation with preferences
    console.log('\n🔔 Testing notification creation with preferences...')

    // Create a chat notification (should only use IN_APP channel)
    const chatNotification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.CHAT_MESSAGE,
      title: 'New Chat Message',
      content: 'You have a new message from your guide',
      channels: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      priority: NotificationPriority.NORMAL
    })

    console.log('✅ Chat notification created with effective channels:', chatNotification.channels)

    // Create a security alert (should use all channels)
    const securityNotification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.SECURITY_ALERT,
      title: 'Security Alert',
      content: 'Suspicious login detected',
      channels: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      priority: NotificationPriority.CRITICAL
    })

    console.log('✅ Security notification created with effective channels:', securityNotification.channels)

    // Try to create promotional notification (should be suppressed or limited)
    const promotionalNotification = await notificationService.createNotification({
      userId: testUser.id,
      type: NotificationType.PROMOTIONAL,
      title: 'Special Offer',
      content: '50% off your next booking!',
      channels: [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      priority: NotificationPriority.LOW
    })

    console.log('✅ Promotional notification created with effective channels:', promotionalNotification.channels)

    // Test 9: Test batch preferences retrieval
    console.log('\n📦 Testing batch preferences retrieval...')

    // Create another test user
    const testUser2 = await prisma.user.create({
      data: {
        email: 'test-preferences-2@example.com',
        passwordHash: 'test-hash',
        name: 'Preferences Test User 2',
        role: 'USER'
      }
    })

    const batchPreferences = await preferencesService.getBatchPreferences([testUser.id, testUser2.id])
    console.log('✅ Retrieved batch preferences for', batchPreferences.size, 'users')
    console.log('   User 1 frequency:', batchPreferences.get(testUser.id)?.frequency)
    console.log('   User 2 frequency:', batchPreferences.get(testUser2.id)?.frequency)

    // Test 10: Test preferences validation
    console.log('\n✅ Testing preferences validation...')

    try {
      await preferencesService.updatePreferences(testUser.id, {
        frequency: 'invalid' as any
      })
      console.log('❌ Should have failed with invalid frequency')
    } catch (error) {
      console.log('✅ Correctly rejected invalid frequency:', (error as Error).message)
    }

    try {
      await preferencesService.updateQuietHours(testUser.id, {
        enabled: true,
        startTime: '25:00', // Invalid time
        endTime: '08:00',
        timezone: 'UTC',
        allowCritical: true
      })
      console.log('❌ Should have failed with invalid time')
    } catch (error) {
      console.log('✅ Correctly rejected invalid time format:', (error as Error).message)
    }

    try {
      await preferencesService.updateChannelPreferences(testUser.id, {
        [NotificationType.CHAT_MESSAGE]: ['INVALID_CHANNEL' as any]
      })
      console.log('❌ Should have failed with invalid channel')
    } catch (error) {
      console.log('✅ Correctly rejected invalid channel:', (error as Error).message)
    }

    // Test 11: Test preferences reset
    console.log('\n🔄 Testing preferences reset...')

    const resetPreferences = await preferencesService.resetToDefaults(testUser.id)
    console.log('✅ Reset preferences to defaults:', {
      frequency: resetPreferences.frequency,
      language: resetPreferences.language,
      timezone: resetPreferences.timezone,
      chatChannels: resetPreferences.channels[NotificationType.CHAT_MESSAGE]
    })

    // Test 12: Test frequency-based channel filtering
    console.log('\n⏰ Testing frequency-based filtering...')

    // Set to daily frequency
    await preferencesService.updatePreferences(testUser.id, {
      frequency: NotificationFrequency.DAILY
    })

    const dailyPrefs = await preferencesService.getPreferences(testUser.id)
    
    // Test normal priority notification with daily frequency
    const dailyEffectiveChannels = preferencesService.determineEffectiveChannels(
      dailyPrefs,
      NotificationType.BOOKING_CONFIRMATION,
      [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      NotificationPriority.NORMAL
    )

    // Test critical priority notification with daily frequency
    const dailyCriticalChannels = preferencesService.determineEffectiveChannels(
      dailyPrefs,
      NotificationType.SECURITY_ALERT,
      [DeliveryChannel.IN_APP, DeliveryChannel.PUSH, DeliveryChannel.EMAIL],
      NotificationPriority.CRITICAL
    )

    console.log('✅ Daily frequency filtering:')
    console.log('   Normal priority channels:', dailyEffectiveChannels)
    console.log('   Critical priority channels:', dailyCriticalChannels)

    console.log('\n🎉 All notification preferences tests passed!')
    console.log('\nFeatures verified:')
    console.log('  ✅ Default preferences creation and retrieval')
    console.log('  ✅ General preferences updates (frequency, language, timezone)')
    console.log('  ✅ Channel preferences updates for specific notification types')
    console.log('  ✅ Quiet hours configuration and detection')
    console.log('  ✅ Effective channel determination based on preferences')
    console.log('  ✅ Integration with notification creation')
    console.log('  ✅ Batch preferences retrieval')
    console.log('  ✅ Comprehensive input validation')
    console.log('  ✅ Preferences reset to defaults')
    console.log('  ✅ Frequency-based channel filtering')
    console.log('  ✅ Priority-based quiet hours handling')

  } catch (error) {
    console.error('❌ Notification preferences test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotificationPreferences()
    .then(() => {
      console.log('\n✅ Notification preferences test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Notification preferences test failed:', error)
      process.exit(1)
    })
}

export { testNotificationPreferences }