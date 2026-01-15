const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist by counting users
    const userCount = await prisma.user.count();
    console.log(`✅ Users table exists with ${userCount} records`);
    
    // Test if new tables exist
    const tourCount = await prisma.tour.count();
    console.log(`✅ Tours table exists with ${tourCount} records`);
    
    const productCount = await prisma.product.count();
    console.log(`✅ Products table exists with ${productCount} records`);
    
    const bookingCount = await prisma.booking.count();
    console.log(`✅ Bookings table exists with ${bookingCount} records`);
    
    console.log('🎉 All database tables are working correctly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();