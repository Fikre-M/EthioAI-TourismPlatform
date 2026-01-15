import { PrismaClient } from '@prisma/client';
import { PaymentService } from './src/services/payment.service';
import { log } from './src/utils/logger';

const prisma = new PrismaClient();

async function testPaymentSystem() {
  console.log('🧪 Testing Payment System...\n');

  try {
    // 1. Get a test user
    console.log('1. Finding test user...');
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

    // 2. Get a published tour
    console.log('\n2. Finding a published tour...');
    const tour = await prisma.tour.findFirst({
      where: { status: 'PUBLISHED' },
    });

    if (!tour) {
      console.log('❌ No published tours found. Please run seed first.');
      return;
    }
    console.log(`✅ Found tour: ${tour.title}`);

    // 3. Create a booking
    console.log('\n3. Creating a test booking...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + tour.duration);

    const booking = await prisma.booking.create({
      data: {
        bookingNumber: `BK${Date.now()}`,
        userId: user.id,
        tourId: tour.id,
        startDate,
        endDate,
        adults: 2,
        children: 0,
        totalPrice: 500,
        participants: [
          {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        ],
        status: 'PENDING',
      },
    });
    console.log(`✅ Booking created: ${booking.bookingNumber}`);

    // 4. Test Stripe payment intent creation (will fail without valid API key)
    console.log('\n4. Testing Stripe payment intent creation...');
    try {
      const stripeResult = await PaymentService.createStripePaymentIntent(
        {
          bookingId: booking.id,
          amount: 500,
          currency: 'USD',
          paymentMethod: 'STRIPE',
        },
        user.id
      );
      console.log('✅ Stripe payment intent created');
      console.log(`   Payment ID: ${stripeResult.payment.id}`);
      console.log(`   Intent ID: ${stripeResult.paymentIntentId}`);
    } catch (error: any) {
      console.log('⚠️  Stripe payment intent creation failed (expected without valid API key)');
      console.log(`   Error: ${error.message}`);
    }

    // 5. Test Chapa payment initialization (will fail without valid API key)
    console.log('\n5. Testing Chapa payment initialization...');
    try {
      const chapaResult = await PaymentService.initializeChapaPayment(
        {
          bookingId: booking.id,
          amount: 500,
          currency: 'ETB',
          email: user.email,
          firstName: 'Test',
          lastName: 'User',
          returnUrl: 'http://localhost:3001/payment/success',
        },
        user.id
      );
      console.log('✅ Chapa payment initialized');
      console.log(`   Payment ID: ${chapaResult.payment.id}`);
      console.log(`   TX Ref: ${chapaResult.txRef}`);
      console.log(`   Checkout URL: ${chapaResult.checkoutUrl}`);
    } catch (error: any) {
      console.log('⚠️  Chapa payment initialization failed (expected without valid API key)');
      console.log(`   Error: ${error.message}`);
    }

    // 6. Get payment statistics
    console.log('\n6. Getting payment statistics...');
    const stats = await PaymentService.getPaymentStats({
      userId: user.id,
    });
    console.log('✅ Payment statistics:');
    console.log(`   Total payments: ${stats.totalPayments}`);
    console.log(`   Completed: ${stats.completedPayments}`);
    console.log(`   Failed: ${stats.failedPayments}`);
    console.log(`   Total revenue: $${stats.totalRevenue}`);
    console.log(`   Success rate: ${stats.successRate.toFixed(2)}%`);

    // 7. Get user payments
    console.log('\n7. Getting user payments...');
    const userPayments = await PaymentService.getUserPayments(user.id, {
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    console.log(`✅ Found ${userPayments.payments.length} payments for user`);

    console.log('\n🎉 Payment system test completed!');
    console.log('\n📝 Note: To fully test payment processing:');
    console.log('   1. Add valid Stripe API keys to .env file');
    console.log('   2. Add valid Chapa API keys to .env file');
    console.log('   3. Run the test again to see actual payment creation');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentSystem();
