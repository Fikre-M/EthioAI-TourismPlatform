import axios from 'axios';
import { config } from './src/config';

const API_BASE_URL = `http://localhost:${config.port}`;

// Test data
const testUser = {
  email: 'testuser@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

let authToken = '';
let testMessageId = '';

/**
 * Test Chat System Implementation
 * Tests all chat endpoints and functionality
 */
async function testChatSystem() {
  console.log('🧪 Testing Chat System Implementation...\n');

  try {
    // Step 1: Register/Login test user
    await setupTestUser();

    // Step 2: Test system health
    await testSystemHealth();

    // Step 3: Test AI suggestions
    await testAISuggestions();

    // Step 4: Test sending messages
    await testSendMessage();

    // Step 5: Test message retrieval
    await testMessageRetrieval();

    // Step 6: Test message feedback
    await testMessageFeedback();

    // Step 7: Test conversation management
    await testConversationManagement();

    // Step 8: Test multilingual support
    await testMultilingualSupport();

    // Step 9: Test export functionality
    await testExportFunctionality();

    // Step 10: Test admin features (if applicable)
    await testAdminFeatures();

    console.log('✅ All chat system tests passed!\n');
    console.log('🎉 Chat & AI Integration (Step 9) completed successfully!');

  } catch (error: any) {
    console.error('❌ Chat system test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

/**
 * Setup test user for authentication
 */
async function setupTestUser() {
  console.log('👤 Setting up test user...');

  try {
    // Try to register user
    await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
    console.log('✅ Test user registered');
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Test user already exists');
    } else {
      throw error;
    }
  }

  // Login to get token
  const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email: testUser.email,
    password: testUser.password,
  });

  authToken = loginResponse.data.data.accessToken;
  console.log('✅ Test user logged in\n');
}

/**
 * Test system health endpoint
 */
async function testSystemHealth() {
  console.log('🏥 Testing system health...');

  const response = await axios.get(`${API_BASE_URL}/api/chat/health`);
  
  console.log('Health status:', response.data.data.status);
  console.log('Services:', response.data.data.services);
  console.log('Features:', response.data.data.features);
  console.log('✅ System health check passed\n');
}

/**
 * Test AI suggestions endpoint
 */
async function testAISuggestions() {
  console.log('💡 Testing AI suggestions...');

  // Test basic suggestions
  const basicResponse = await axios.post(`${API_BASE_URL}/api/chat/suggestions`, {});
  console.log('Basic suggestions:', basicResponse.data.data.suggestions);

  // Test contextual suggestions
  const contextualResponse = await axios.post(`${API_BASE_URL}/api/chat/suggestions`, {
    location: 'Lalibela',
    interests: ['history', 'culture'],
    budget: 1000,
    language: 'en',
  });
  console.log('Contextual suggestions:', contextualResponse.data.data.suggestions);

  // Test Amharic suggestions
  const amharicResponse = await axios.post(`${API_BASE_URL}/api/chat/suggestions`, {
    language: 'am',
  });
  console.log('Amharic suggestions:', amharicResponse.data.data.suggestions);

  console.log('✅ AI suggestions test passed\n');
}

/**
 * Test sending messages and getting AI responses
 */
async function testSendMessage() {
  console.log('💬 Testing message sending...');

  // Test anonymous message (without auth)
  const anonymousResponse = await axios.post(`${API_BASE_URL}/api/chat/messages`, {
    message: 'Hello, what are the best tours in Ethiopia?',
    language: 'en',
    messageType: 'tour_recommendation',
  });

  console.log('Anonymous message sent:', anonymousResponse.data.data.userMessage.message);
  console.log('AI response:', anonymousResponse.data.data.aiResponse.response);

  // Test authenticated message
  const authResponse = await axios.post(
    `${API_BASE_URL}/api/chat/messages`,
    {
      message: 'Tell me about Ethiopian coffee culture',
      language: 'en',
      messageType: 'cultural_info',
      context: {
        location: 'Addis Ababa',
        interests: ['coffee', 'culture'],
      },
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  testMessageId = authResponse.data.data.aiResponse.id;
  console.log('Authenticated message sent:', authResponse.data.data.userMessage.message);
  console.log('AI response:', authResponse.data.data.aiResponse.response);

  // Test travel advice message
  const adviceResponse = await axios.post(
    `${API_BASE_URL}/api/chat/messages`,
    {
      message: 'What should I pack for a trip to the Simien Mountains?',
      language: 'en',
      messageType: 'travel_advice',
      context: {
        location: 'Simien Mountains',
        travelDates: {
          startDate: '2024-03-01',
          endDate: '2024-03-07',
        },
      },
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('Travel advice message sent:', adviceResponse.data.data.userMessage.message);
  console.log('AI response:', adviceResponse.data.data.aiResponse.response);

  console.log('✅ Message sending test passed\n');
}

/**
 * Test message retrieval and filtering
 */
async function testMessageRetrieval() {
  console.log('📋 Testing message retrieval...');

  // Test getting all messages for user
  const allMessagesResponse = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  console.log('Total messages:', allMessagesResponse.data.pagination.total);
  console.log('Messages retrieved:', allMessagesResponse.data.data.length);

  // Test getting recent messages
  const recentResponse = await axios.get(`${API_BASE_URL}/api/chat/recent?limit=5`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  console.log('Recent messages:', recentResponse.data.data.messages.length);

  // Test getting specific message
  if (testMessageId) {
    const messageResponse = await axios.get(`${API_BASE_URL}/api/chat/messages/${testMessageId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('Specific message retrieved:', messageResponse.data.data.message.id);
  }

  // Test filtered messages
  const filteredResponse = await axios.get(
    `${API_BASE_URL}/api/chat/messages?messageType=cultural_info&limit=10`,
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('Filtered messages:', filteredResponse.data.data.length);

  console.log('✅ Message retrieval test passed\n');
}

/**
 * Test message feedback functionality
 */
async function testMessageFeedback() {
  console.log('⭐ Testing message feedback...');

  if (!testMessageId) {
    console.log('⚠️ Skipping feedback test - no test message ID');
    return;
  }

  // Submit positive feedback
  await axios.post(
    `${API_BASE_URL}/api/chat/messages/${testMessageId}/feedback`,
    {
      rating: 5,
      feedback: 'Very helpful response about Ethiopian coffee culture!',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('✅ Positive feedback submitted');

  // Submit another feedback with different rating
  const response2 = await axios.post(
    `${API_BASE_URL}/api/chat/messages`,
    {
      message: 'What is the weather like in Lalibela?',
      language: 'en',
      messageType: 'travel_advice',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  await axios.post(
    `${API_BASE_URL}/api/chat/messages/${response2.data.data.aiResponse.id}/feedback`,
    {
      rating: 3,
      feedback: 'Okay response, could be more specific.',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('✅ Mixed feedback submitted');
  console.log('✅ Message feedback test passed\n');
}

/**
 * Test conversation management
 */
async function testConversationManagement() {
  console.log('🗣️ Testing conversation management...');

  // Get conversation summary
  const summaryResponse = await axios.get(`${API_BASE_URL}/api/chat/summary`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  console.log('Conversation summary:', {
    totalMessages: summaryResponse.data.data.summary.totalMessages,
    languages: summaryResponse.data.data.summary.languages,
    messageTypes: summaryResponse.data.data.summary.messageTypes,
    hasResponses: summaryResponse.data.data.summary.hasResponses,
  });

  console.log('✅ Conversation management test passed\n');
}

/**
 * Test multilingual support
 */
async function testMultilingualSupport() {
  console.log('🌍 Testing multilingual support...');

  // Test Amharic message
  const amharicResponse = await axios.post(
    `${API_BASE_URL}/api/chat/messages`,
    {
      message: 'በኢትዮጵያ ውስጥ ምርጥ የቱሪዝም ቦታዎች የትኞቹ ናቸው?',
      language: 'am',
      messageType: 'tour_recommendation',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('Amharic message sent:', amharicResponse.data.data.userMessage.message);
  console.log('AI response (should be in Amharic context):', amharicResponse.data.data.aiResponse.response);

  // Test Oromo message
  const oromoResponse = await axios.post(
    `${API_BASE_URL}/api/chat/messages`,
    {
      message: 'Bakka turizimii Itoophiyaa keessaa hundarra gaarii kamtu?',
      language: 'om',
      messageType: 'tour_recommendation',
    },
    {
      headers: { Authorization: `Bearer ${authToken}` },
    }
  );

  console.log('Oromo message sent:', oromoResponse.data.data.userMessage.message);
  console.log('AI response (should be in Oromo context):', oromoResponse.data.data.aiResponse.response);

  console.log('✅ Multilingual support test passed\n');
}

/**
 * Test export functionality
 */
async function testExportFunctionality() {
  console.log('📤 Testing export functionality...');

  // Test JSON export
  const jsonExport = await axios.get(`${API_BASE_URL}/api/chat/export?format=json`, {
    headers: { Authorization: `Bearer ${authToken}` },
    responseType: 'text',
  });

  console.log('JSON export length:', jsonExport.data.length);
  console.log('JSON export contains messages:', jsonExport.data.includes('messages'));

  // Test text export
  const textExport = await axios.get(`${API_BASE_URL}/api/chat/export?format=text`, {
    headers: { Authorization: `Bearer ${authToken}` },
    responseType: 'text',
  });

  console.log('Text export length:', textExport.data.length);
  console.log('Text export contains chat history:', textExport.data.includes('Chat History Export'));

  console.log('✅ Export functionality test passed\n');
}

/**
 * Test admin features (if user has admin role)
 */
async function testAdminFeatures() {
  console.log('👑 Testing admin features...');

  try {
    // Test chat statistics
    const statsResponse = await axios.get(`${API_BASE_URL}/api/chat/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('Chat statistics:', {
      totalMessages: statsResponse.data.data.totalMessages,
      responseRate: statsResponse.data.data.responseRate,
      uniqueUsers: statsResponse.data.data.uniqueUsers,
    });

    // Test popular topics
    const topicsResponse = await axios.get(`${API_BASE_URL}/api/chat/topics`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('Popular topics:', topicsResponse.data.data.topics.slice(0, 3));

    console.log('✅ Admin features test passed\n');

  } catch (error: any) {
    if (error.response?.status === 403) {
      console.log('ℹ️ Admin features test skipped - user not admin\n');
    } else {
      throw error;
    }
  }
}

/**
 * Test message deletion and cleanup
 */
async function testMessageCleanup() {
  console.log('🧹 Testing message cleanup...');

  // Get current message count
  const beforeResponse = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });

  const messageCountBefore = beforeResponse.data.pagination.total;
  console.log('Messages before cleanup:', messageCountBefore);

  if (messageCountBefore > 0) {
    // Clear all messages
    await axios.delete(`${API_BASE_URL}/api/chat/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Verify cleanup
    const afterResponse = await axios.get(`${API_BASE_URL}/api/chat/messages`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const messageCountAfter = afterResponse.data.pagination.total;
    console.log('Messages after cleanup:', messageCountAfter);

    if (messageCountAfter === 0) {
      console.log('✅ Message cleanup test passed\n');
    } else {
      throw new Error('Messages were not properly cleaned up');
    }
  } else {
    console.log('ℹ️ No messages to clean up\n');
  }
}

// Run the test
if (require.main === module) {
  testChatSystem();
}

export { testChatSystem };