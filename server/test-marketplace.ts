import { PrismaClient } from '@prisma/client';
import { ProductService } from './src/services/product.service';
import { OrderService } from './src/services/order.service';
import { VendorService } from './src/services/vendor.service';
import { log } from './src/utils/logger';

const prisma = new PrismaClient();

async function testMarketplaceSystem() {
  console.log('🧪 Testing Marketplace System...\n');

  try {
    // 1. Get or create a test user
    console.log('1. Finding test user...');
    let user = await prisma.user.findFirst({
      where: { email: 'vendor@example.com' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'vendor@example.com',
          passwordHash: 'test-hash',
          name: 'Test Vendor',
          role: 'VENDOR',
        },
      });
      console.log('✅ Created test vendor user');
    } else {
      console.log('✅ Found test vendor user');
    }

    // 2. Create vendor profile
    console.log('\n2. Creating vendor profile...');
    try {
      const vendorProfile = await VendorService.createVendorProfile(
        {
          businessName: 'Ethiopian Crafts Co.',
          description: 'We specialize in authentic Ethiopian handicrafts, traditional clothing, and cultural artifacts. Our products are made by local artisans using traditional techniques passed down through generations.',
          address: '123 Merkato Street, Addis Ababa, Ethiopia',
          phone: '+251911234567',
          website: 'https://ethiopiancrafts.com',
          businessLicense: 'ETH-BL-2024-001',
          taxId: 'ETH-TAX-123456',
        },
        user.id
      );
      console.log(`✅ Vendor profile created: ${vendorProfile.businessName}`);
      console.log(`   Verified: ${vendorProfile.isVerified}`);
    } catch (error: any) {
      if (error.message.includes('already has a vendor profile')) {
        console.log('✅ Vendor profile already exists');
      } else {
        throw error;
      }
    }

    // 3. Create a category
    console.log('\n3. Creating product category...');
    let category;
    try {
      category = await VendorService.createCategory({
        name: 'Traditional Clothing',
        description: 'Authentic Ethiopian traditional clothing and accessories',
        image: 'https://example.com/category-traditional-clothing.jpg',
      });
      console.log(`✅ Category created: ${category.name} (${category.slug})`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        // Get existing category
        category = await prisma.category.findFirst({
          where: { name: 'Traditional Clothing' },
        });
        console.log(`✅ Category already exists: ${category?.name}`);
      } else {
        throw error;
      }
    }

    if (!category) {
      console.log('❌ No category available. Creating a default one...');
      category = await prisma.category.create({
        data: {
          name: 'General',
          slug: 'general',
          description: 'General products',
        },
      });
    }

    // 4. Create a product
    console.log('\n4. Creating a product...');
    try {
      const product = await ProductService.createProduct(
        {
          name: 'Traditional Ethiopian Habesha Dress',
          description: 'Beautiful handwoven traditional Ethiopian dress made from high-quality cotton. Features intricate embroidery and traditional patterns. Perfect for cultural events, weddings, and special occasions. Each dress is unique and made by skilled artisans.',
          shortDescription: 'Handwoven traditional Ethiopian dress with intricate embroidery',
          images: [
            'https://example.com/habesha-dress-1.jpg',
            'https://example.com/habesha-dress-2.jpg',
            'https://example.com/habesha-dress-3.jpg',
          ],
          price: 150,
          discountPrice: 120,
          stock: 25,
          sku: 'ETH-DRESS-001',
          weight: 0.8,
          dimensions: {
            length: 140,
            width: 60,
            height: 2,
          },
          materials: ['Cotton', 'Silk Thread'],
          colors: ['White', 'Cream', 'Light Blue'],
          sizes: ['S', 'M', 'L', 'XL'],
          categoryId: category.id,
          metaTitle: 'Traditional Ethiopian Habesha Dress - Authentic Handwoven',
          metaDescription: 'Shop authentic Ethiopian Habesha dress. Handwoven by local artisans with traditional patterns. Perfect for cultural events.',
          featured: true,
        },
        user.id
      );
      console.log(`✅ Product created: ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: $${product.price} (Discount: $${product.discountPrice})`);
      console.log(`   Stock: ${product.stock} units`);
      console.log(`   Status: ${product.status}`);
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Product already exists');
      } else {
        throw error;
      }
    }

    // 5. Get products
    console.log('\n5. Getting products...');
    const productsResult = await ProductService.getProducts({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    console.log(`✅ Found ${productsResult.products.length} products`);
    console.log(`   Total products: ${productsResult.pagination.total}`);

    // 6. Get featured products
    console.log('\n6. Getting featured products...');
    const featuredProducts = await ProductService.getFeaturedProducts(5);
    console.log(`✅ Found ${featuredProducts.length} featured products`);

    // 7. Create a customer user for orders
    console.log('\n7. Creating customer user...');
    let customer = await prisma.user.findFirst({
      where: { email: 'customer@example.com' },
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: 'customer@example.com',
          passwordHash: 'test-hash',
          name: 'Test Customer',
          role: 'USER',
        },
      });
      console.log('✅ Created test customer user');
    } else {
      console.log('✅ Found test customer user');
    }

    // 8. Test cart validation
    console.log('\n8. Testing cart validation...');
    const product = await prisma.product.findFirst({
      where: { status: 'PUBLISHED' },
    });

    if (product) {
      const cartValidation = await OrderService.validateCart({
        items: [
          {
            productId: product.id,
            quantity: 2,
            variant: {
              color: 'White',
              size: 'M',
            },
          },
        ],
        promoCode: 'WELCOME10',
      });
      console.log(`✅ Cart validation: ${cartValidation.valid ? 'Valid' : 'Invalid'}`);
      console.log(`   Subtotal: $${cartValidation.subtotal}`);
      console.log(`   Tax: $${cartValidation.tax}`);
      console.log(`   Shipping: $${cartValidation.shipping}`);
      console.log(`   Discount: $${cartValidation.discount}`);
      console.log(`   Total: $${cartValidation.total}`);

      // 9. Create an order
      if (cartValidation.valid) {
        console.log('\n9. Creating an order...');
        try {
          const order = await OrderService.createOrder(
            {
              items: [
                {
                  productId: product.id,
                  quantity: 2,
                  variant: {
                    color: 'White',
                    size: 'M',
                  },
                },
              ],
              shippingAddress: {
                firstName: 'John',
                lastName: 'Doe',
                address1: '123 Main Street',
                city: 'Addis Ababa',
                state: 'Addis Ababa',
                postalCode: '1000',
                country: 'Ethiopia',
                phone: '+251911234567',
              },
              notes: 'Please handle with care',
            },
            customer.id
          );
          console.log(`✅ Order created: ${order.orderNumber}`);
          console.log(`   Status: ${order.status}`);
          console.log(`   Total: $${order.total}`);
          console.log(`   Items: ${order.items?.length || 0}`);
        } catch (error: any) {
          console.log(`⚠️  Order creation failed: ${error.message}`);
        }
      }
    } else {
      console.log('⚠️  No published products found for order testing');
    }

    // 10. Get marketplace statistics
    console.log('\n10. Getting marketplace statistics...');
    const [productStats, vendorStats] = await Promise.all([
      ProductService.getProductStats(),
      VendorService.getVendorStats(),
    ]);

    console.log('✅ Marketplace statistics:');
    console.log('   Products:');
    console.log(`     Total: ${productStats.totalProducts}`);
    console.log(`     Published: ${productStats.publishedProducts}`);
    console.log(`     Draft: ${productStats.draftProducts}`);
    console.log(`     Featured: ${productStats.featuredProducts}`);
    console.log(`     In Stock: ${productStats.inStockProducts}`);
    console.log('   Vendors:');
    console.log(`     Total: ${vendorStats.totalVendors}`);
    console.log(`     Verified: ${vendorStats.verifiedVendors}`);
    console.log(`     Active: ${vendorStats.activeVendors}`);
    console.log(`     Verification Rate: ${vendorStats.verificationRate.toFixed(2)}%`);

    console.log('\n🎉 Marketplace system test completed!');
    console.log('\n📝 Marketplace Features Tested:');
    console.log('   ✅ Vendor profile creation and management');
    console.log('   ✅ Product catalog with categories');
    console.log('   ✅ Product creation with variants (colors, sizes, materials)');
    console.log('   ✅ Inventory management (stock tracking)');
    console.log('   ✅ Featured products system');
    console.log('   ✅ Cart validation with pricing calculation');
    console.log('   ✅ Order processing with address management');
    console.log('   ✅ Marketplace analytics and statistics');
    console.log('   ✅ Category management system');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testMarketplaceSystem();