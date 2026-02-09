const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedChatMessages() {
  try {
    console.log('🌱 Seeding chat messages...\n');
    
    // Get demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (!demoUser) {
      console.log('❌ Demo user not found. Please run create-demo-user.js first.');
      return;
    }
    
    const chatMessages = [
      {
        userId: demoUser.id,
        message: 'What are the best places to visit in Ethiopia?',
        response: 'Ethiopia offers incredible destinations! The top places include:\n\n1. Lalibela - Famous for its rock-hewn churches\n2. Simien Mountains - Stunning trekking destination\n3. Danakil Depression - One of Earth\'s most extreme landscapes\n4. Omo Valley - Rich tribal cultures\n5. Bale Mountains - Wildlife and endemic species\n\nWould you like more details about any of these destinations?',
        language: 'en',
        messageType: 'text'
      },
      {
        userId: demoUser.id,
        message: 'Tell me more about Lalibela',
        response: 'Lalibela is one of Ethiopia\'s holiest cities and a UNESCO World Heritage Site. It\'s famous for its 11 medieval rock-hewn churches carved from solid rock in the 12th century.\n\nHighlights:\n- Bet Giyorgis (Church of St. George) - the most iconic\n- Two main groups of churches connected by tunnels\n- Still active places of worship\n- Best visited during Ethiopian Christmas (January 7)\n\nThe churches are considered the "Eighth Wonder of the World" and are a must-see for anyone visiting Ethiopia!',
        language: 'en',
        messageType: 'text'
      },
      {
        userId: demoUser.id,
        message: 'How difficult is the Simien Mountains trek?',
        response: 'The Simien Mountains trek is rated as Moderate to Challenging, depending on your route:\n\n**Difficulty Factors:**\n- Altitude: Up to 4,000+ meters\n- Terrain: Rocky paths and steep ascents\n- Duration: Typically 3-7 days\n- Weather: Can be cold at night\n\n**Fitness Level Needed:**\n- Good cardiovascular fitness\n- Previous hiking experience helpful\n- Acclimatization recommended\n\n**What Makes It Worth It:**\n- Spectacular mountain scenery\n- Unique wildlife (Gelada baboons, Ethiopian wolves)\n- Dramatic escarpments and valleys\n\nWould you like to see our Simien Mountains trekking tours?',
        language: 'en',
        messageType: 'text'
      },
      {
        userId: demoUser.id,
        message: 'What\'s the best time to visit Ethiopia?',
        response: 'The best time to visit Ethiopia depends on what you want to see:\n\n**Dry Season (October - March):**\n✅ Best for: Most activities, trekking, wildlife\n✅ Weather: Sunny and pleasant\n✅ Peak season: December - February\n\n**Rainy Season (June - September):**\n✅ Best for: Lush landscapes, fewer tourists\n✅ Weather: Afternoon rains, cooler temperatures\n⚠️ Some roads may be difficult\n\n**Special Events:**\n- Timkat (January): Epiphany celebrations\n- Meskel (September): Finding of the True Cross\n- Ethiopian New Year (September 11)\n\nMost travelers prefer October-March for the best weather and accessibility.',
        language: 'en',
        messageType: 'text'
      },
      {
        userId: demoUser.id,
        message: 'Do I need a visa for Ethiopia?',
        response: 'Visa requirements for Ethiopia:\n\n**E-Visa Available:**\n- Most nationalities can get an e-visa online\n- Valid for 30 or 90 days\n- Single or multiple entry options\n- Apply at: www.evisa.gov.et\n- Processing: 3-5 business days\n\n**Visa on Arrival:**\n- Available for some nationalities at Addis Ababa airport\n- 30-day tourist visa\n- Payment in USD required\n\n**Requirements:**\n- Passport valid for 6+ months\n- Return ticket\n- Proof of accommodation\n- Yellow fever certificate (if coming from endemic areas)\n\n**Tip:** Apply for e-visa in advance to avoid queues at the airport!\n\nWould you like help planning your Ethiopia trip?',
        language: 'en',
        messageType: 'text'
      }
    ];
    
    for (const msgData of chatMessages) {
      const chat = await prisma.chatMessage.create({
        data: msgData
      });
      
      console.log(`✅ Created chat: "${chat.message.substring(0, 50)}..."`);
    }
    
    console.log('\n✅ Chat seeding completed!');
    console.log(`\n📊 Total chat messages: ${await prisma.chatMessage.count()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedChatMessages();
