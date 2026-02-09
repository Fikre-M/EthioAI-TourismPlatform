const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedBookingsAndReviews() {
  try {
    console.log('🌱 Seeding bookings and reviews...\n');
    
    // Get demo user
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    });
    
    if (!demoUser) {
      console.log('❌ Demo user not found. Please run create-demo-user.js first.');
      return;
    }
    
    // Get some tours
    const tours = await prisma.tour.findMany({
      take: 3,
      where: { status: 'PUBLISHED' }
    });
    
    if (tours.length === 0) {
      console.log('❌ No tours found. Please run seed-tours.js first.');
      return;
    }
    
    console.log(`Found ${tours.length} tours to create bookings for\n`);
    
    // Create sample bookings
    const bookings = [];
    for (let i = 0; i < tours.length; i++) {
      const tour = tours[i];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30 + (i * 10)); // 30, 40, 50 days from now
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + tour.duration);
      
      const bookingData = {
        bookingNumber: `BK${Date.now()}${i}`,
        userId: demoUser.id,
        tourId: tour.id,
        startDate,
        endDate,
        adults: 2,
        children: 0,
        totalPrice: parseFloat(tour.discountPrice || tour.price),
        status: i === 0 ? 'CONFIRMED' : 'PENDING',
        notes: 'Looking forward to this amazing experience!',
        participants: JSON.stringify([
          { name: 'Demo User', age: 30, passport: 'ET123456' },
          { name: 'Travel Companion', age: 28, passport: 'ET789012' }
        ])
      };
      
      const booking = await prisma.booking.create({
        data: bookingData
      });
      
      bookings.push(booking);
      console.log(`✅ Created booking: ${booking.bookingNumber} for ${tour.title}`);
    }
    
    console.log('\n🌟 Creating reviews...\n');
    
    // Create sample reviews for completed tours
    const reviewsData = [
      {
        userId: demoUser.id,
        tourId: tours[0].id,
        rating: 5,
        title: 'Absolutely Amazing Experience!',
        comment: 'This tour exceeded all my expectations. The guide was knowledgeable, the sites were breathtaking, and the organization was perfect. Highly recommend!',
        status: 'APPROVED',
        isVerified: true
      },
      {
        userId: demoUser.id,
        tourId: tours[1].id,
        rating: 4,
        title: 'Great Adventure',
        comment: 'Challenging but rewarding trek. The landscapes were stunning and our guide was excellent. Would do it again!',
        status: 'APPROVED',
        isVerified: true
      }
    ];
    
    for (const reviewData of reviewsData) {
      // Check if review already exists
      const existing = await prisma.review.findFirst({
        where: {
          userId: reviewData.userId,
          tourId: reviewData.tourId
        }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping review for tour (already exists)`);
        continue;
      }
      
      const review = await prisma.review.create({
        data: reviewData
      });
      
      console.log(`✅ Created review: "${review.title}"`);
    }
    
    console.log('\n✅ Seeding completed!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Bookings: ${await prisma.booking.count()}`);
    console.log(`   - Reviews: ${await prisma.review.count()}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedBookingsAndReviews();
