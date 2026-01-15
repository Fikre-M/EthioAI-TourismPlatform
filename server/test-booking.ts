import { PrismaClient } from '@prisma/client';
import { BookingService } from './src/services/booking.service';
import { log } from './src/utils/logger';

const prisma = new PrismaClient();

async function testBookingSystem() {
  console.log('🧪 Testing Booking System...\n');

  try {
    // 1. Get a published tour
    console.log('1. Finding a published tour...');
    const tour = await prisma.tour.findFirst({
      where: { status: 'PUBLISHED' },
    });

    if (!tour) {
      console.log('❌ No published tours found. Please run seed first.');
      return;
    }
    console.log(`✅ Found tour: ${tour.title} (${tour.id})`);

    // 2. Get or create a test user
    console.log('\n2. Finding test user...');
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'test-hash',
          name: 'Test User',
          role: 'USER',
        },
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found test user');
    }

    // 3. Test promo code validation
    console.log('\n3. Testing promo code validation...');
    const promoValidation = await BookingService.validatePromoCode({
      code: 'WELCOME10',
      tourId: tour.id,
      totalAmount: 500,
    });
    console.log(`✅ Promo validation: ${promoValidation.valid ? 'Valid' : 'Invalid'}`);
    if (promoValidation.valid) {
      console.log(`   Discount: $${promoValidation.discountAmount}`);
    }

    // 4. Create a booking
    console.log('\n4. Creating a booking...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // 7 days from now
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tour.duration);

    const bookingData = {
      tourId: tour.id,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      adults: 2,
      children: 1,
      totalPrice: 500,
      discountAmount: promoValidation.discountAmount,
      promoCode: promoValidation.valid ? 'WELCOME10' : undefined,
      participants: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          age: 30,
          nationality: 'USA',
        },
        {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          phone: '+1234567891',
          age: 28,
          nationality: 'USA',
        },
        {
          firstName: 'Jimmy',
          lastName: 'Doe',
          age: 8,
          nationality: 'USA',
        },
      ],
      notes: 'Test booking',
      specialRequests: 'Vegetarian meals please',
    };

    const booking = await BookingService.createBooking(bookingData, user.id);
    console.log(`✅ Booking created: ${booking.bookingNumber}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Total: $${booking.totalPrice}`);
    console.log(`   Discount: $${booking.discountAmount || 0}`);

    // 5. Get booking by ID
    console.log('\n5. Fetching booking by ID...');
    const fetchedBooking = await BookingService.getBookingById(booking.id, user.id);
    console.log(`✅ Booking fetched: ${fetchedBooking.bookingNumber}`);

    // 6. Get user bookings
    console.log('\n6. Fetching user bookings...');
    const userBookings = await BookingService.getUserBookings(user.id, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    console.log(`✅ Found ${userBookings.bookings.length} bookings for user`);

    // 7. Update booking
    console.log('\n7. Updating booking...');
    const updatedBooking = await BookingService.updateBooking(
      booking.id,
      {
        adults: 3,
        specialRequests: 'Updated: Need 3 vegetarian meals',
      },
      user.id
    );
    console.log(`✅ Booking updated: ${updatedBooking.adults} adults`);

    // 8. Get booking statistics
    console.log('\n8. Getting booking statistics...');
    const stats = await BookingService.getBookingStats({
      userId: user.id,
    });
    console.log('✅ Booking statistics:');
    console.log(`   Total bookings: ${stats.totalBookings}`);
    console.log(`   Pending: ${stats.pendingBookings}`);
    console.log(`   Confirmed: ${stats.confirmedBookings}`);
    console.log(`   Total revenue: $${stats.totalRevenue}`);

    // 9. Cancel booking
    console.log('\n9. Cancelling booking...');
    const cancelledBooking = await BookingService.cancelBooking(
      booking.id,
      {
        reason: 'Test cancellation - change of plans',
        requestRefund: true,
      },
      user.id
    );
    console.log(`✅ Booking cancelled: ${cancelledBooking.status}`);

    console.log('\n🎉 All booking system tests passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testBookingSystem();
