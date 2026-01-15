import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create sample categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'traditional-crafts' },
      update: {},
      create: {
        name: 'Traditional Crafts',
        slug: 'traditional-crafts',
        description: 'Handmade Ethiopian traditional crafts and artifacts',
        image: '/images/categories/traditional-crafts.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'coffee-products' },
      update: {},
      create: {
        name: 'Coffee Products',
        slug: 'coffee-products',
        description: 'Premium Ethiopian coffee beans and accessories',
        image: '/images/categories/coffee.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'textiles' },
      update: {},
      create: {
        name: 'Textiles',
        slug: 'textiles',
        description: 'Traditional Ethiopian clothing and fabrics',
        image: '/images/categories/textiles.jpg'
      }
    })
  ])

  // Create sample vendor user
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@ethioai.com' },
    update: {},
    create: {
      name: 'Addis Crafts Vendor',
      email: 'vendor@ethioai.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'VENDOR',
      isEmailVerified: true,
      phone: '+251911234567',
      location: 'Addis Ababa, Ethiopia'
    }
  })

  // Create vendor profile
  const vendorProfile = await prisma.vendorProfile.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      businessName: 'Addis Traditional Crafts',
      description: 'We specialize in authentic Ethiopian traditional crafts, coffee products, and textiles. Our products are handmade by local artisans using traditional techniques passed down through generations.',
      address: 'Merkato, Addis Ababa, Ethiopia',
      phone: '+251911234567',
      website: 'https://addiscrafts.com',
      isVerified: true,
      rating: 4.8,
      totalReviews: 156,
      totalSales: 1250
    }
  })

  // Create sample guide user
  const guideUser = await prisma.user.upsert({
    where: { email: 'guide@ethioai.com' },
    update: {},
    create: {
      name: 'Alemayehu Tadesse',
      email: 'guide@ethioai.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: 'GUIDE',
      isEmailVerified: true,
      phone: '+251922345678',
      location: 'Lalibela, Ethiopia',
      bio: 'Experienced tour guide with 10+ years of experience showing visitors the wonders of Ethiopia.'
    }
  })

  // Create guide profile
  const guideProfile = await prisma.guideProfile.upsert({
    where: { userId: guideUser.id },
    update: {},
    create: {
      userId: guideUser.id,
      experience: 12,
      languages: ['English', 'Amharic', 'Tigrinya'],
      specialties: ['Historical Sites', 'Cultural Tours', 'Rock Churches', 'Photography Tours'],
      certification: 'Ethiopian Tourism Commission Certified Guide',
      rating: 4.9,
      totalReviews: 89,
      isVerified: true
    }
  })

  // Create sample tours
  const tours = await Promise.all([
    prisma.tour.upsert({
      where: { slug: 'lalibela-rock-churches-tour' },
      update: {},
      create: {
        title: 'Lalibela Rock Churches Historical Tour',
        slug: 'lalibela-rock-churches-tour',
        description: 'Explore the magnificent rock-hewn churches of Lalibela, a UNESCO World Heritage site. This comprehensive tour takes you through 11 medieval monolithic churches carved directly into the volcanic rock.',
        shortDescription: 'Visit the famous rock-hewn churches of Lalibela with an expert guide.',
        images: [
          '/images/tours/lalibela-1.jpg',
          '/images/tours/lalibela-2.jpg',
          '/images/tours/lalibela-3.jpg'
        ],
        price: 150.00,
        discountPrice: 120.00,
        duration: 2,
        maxGroupSize: 12,
        difficulty: 'Moderate',
        status: 'PUBLISHED',
        featured: true,
        startLocation: {
          name: 'Lalibela Airport',
          coordinates: [12.0333, 39.0333],
          address: 'Lalibela, Amhara Region, Ethiopia'
        },
        locations: [
          {
            name: 'Church of St. George',
            coordinates: [12.0317, 39.0403],
            description: 'The most famous of the Lalibela churches'
          },
          {
            name: 'Church of St. Mary',
            coordinates: [12.0325, 39.0398],
            description: 'One of the oldest churches in the complex'
          }
        ],
        included: [
          'Professional guide',
          'Entrance fees',
          'Transportation',
          'Lunch',
          'Bottled water'
        ],
        excluded: [
          'International flights',
          'Personal expenses',
          'Tips',
          'Travel insurance'
        ],
        itinerary: [
          {
            day: 1,
            title: 'Arrival and Northern Group Churches',
            activities: [
              'Airport pickup',
              'Visit Church of St. Mary',
              'Explore Church of St. George',
              'Traditional lunch'
            ]
          },
          {
            day: 2,
            title: 'Southern Group and Departure',
            activities: [
              'Visit remaining churches',
              'Cultural performance',
              'Shopping at local market',
              'Airport transfer'
            ]
          }
        ],
        tags: ['Historical', 'UNESCO', 'Religious', 'Cultural'],
        category: 'Historical Tours',
        language: 'en',
        metaTitle: 'Lalibela Rock Churches Tour - UNESCO World Heritage Site',
        metaDescription: 'Discover the ancient rock-hewn churches of Lalibela on this 2-day guided tour. UNESCO World Heritage site with expert local guides.',
        guideId: guideProfile.id
      }
    }),
    prisma.tour.upsert({
      where: { slug: 'simien-mountains-trekking' },
      update: {},
      create: {
        title: 'Simien Mountains Trekking Adventure',
        slug: 'simien-mountains-trekking',
        description: 'Experience the breathtaking landscapes of the Simien Mountains National Park. Trek through dramatic escarpments, encounter endemic wildlife including Gelada baboons, and enjoy spectacular mountain views.',
        shortDescription: 'Multi-day trekking adventure in the stunning Simien Mountains.',
        images: [
          '/images/tours/simien-1.jpg',
          '/images/tours/simien-2.jpg',
          '/images/tours/simien-3.jpg'
        ],
        price: 280.00,
        duration: 4,
        maxGroupSize: 8,
        difficulty: 'Challenging',
        status: 'PUBLISHED',
        featured: true,
        startLocation: {
          name: 'Gondar',
          coordinates: [12.6, 37.4667],
          address: 'Gondar, Amhara Region, Ethiopia'
        },
        locations: [
          {
            name: 'Sankaber Camp',
            coordinates: [13.2333, 38.0167],
            description: 'First camping site with stunning views'
          },
          {
            name: 'Geech Camp',
            coordinates: [13.2667, 38.0333],
            description: 'High altitude camp at 3600m'
          }
        ],
        included: [
          'Professional trekking guide',
          'Park entrance fees',
          'Camping equipment',
          'All meals during trek',
          'Transportation to/from Gondar'
        ],
        excluded: [
          'Personal trekking gear',
          'Tips for guides and porters',
          'Travel insurance',
          'Alcoholic beverages'
        ],
        itinerary: [
          {
            day: 1,
            title: 'Gondar to Sankaber',
            activities: [
              'Drive to Debark',
              'Park registration',
              'Trek to Sankaber Camp',
              'Wildlife spotting'
            ]
          },
          {
            day: 2,
            title: 'Sankaber to Geech',
            activities: [
              'Morning trek',
              'Gelada baboon watching',
              'Arrive at Geech Camp',
              'Sunset viewing'
            ]
          },
          {
            day: 3,
            title: 'Geech to Chenek',
            activities: [
              'Early morning trek',
              'Visit Imet Gogo viewpoint',
              'Trek to Chenek Camp',
              'Walia ibex spotting'
            ]
          },
          {
            day: 4,
            title: 'Return to Gondar',
            activities: [
              'Morning wildlife viewing',
              'Trek back to road',
              'Drive to Gondar',
              'Tour completion'
            ]
          }
        ],
        tags: ['Trekking', 'Wildlife', 'Mountains', 'Adventure'],
        category: 'Adventure Tours',
        language: 'en',
        metaTitle: 'Simien Mountains Trekking - 4 Day Adventure Tour',
        metaDescription: 'Trek through the spectacular Simien Mountains National Park. See Gelada baboons, Walia ibex, and enjoy breathtaking mountain scenery.',
        guideId: guideProfile.id
      }
    })
  ])

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'ethiopian-coffee-gift-set' },
      update: {},
      create: {
        name: 'Ethiopian Coffee Experience Gift Set',
        slug: 'ethiopian-coffee-gift-set',
        description: 'A complete Ethiopian coffee experience featuring premium single-origin beans from Yirgacheffe, Sidamo, and Harrar regions. Includes traditional jebena (coffee pot), cups, and roasted beans. Perfect for coffee enthusiasts who want to experience authentic Ethiopian coffee culture.',
        shortDescription: 'Premium Ethiopian coffee gift set with traditional brewing equipment.',
        images: [
          '/images/products/coffee-set-1.jpg',
          '/images/products/coffee-set-2.jpg',
          '/images/products/coffee-set-3.jpg'
        ],
        price: 89.99,
        discountPrice: 69.99,
        stock: 25,
        sku: 'COFFEE-SET-001',
        weight: 2.5,
        dimensions: {
          length: 30,
          width: 25,
          height: 15
        },
        materials: ['Clay', 'Coffee Beans', 'Bamboo'],
        status: 'PUBLISHED',
        featured: true,
        metaTitle: 'Ethiopian Coffee Gift Set - Traditional Jebena & Premium Beans',
        metaDescription: 'Authentic Ethiopian coffee experience with traditional jebena, premium single-origin beans from Yirgacheffe, Sidamo, and Harrar.',
        vendorId: vendorProfile.id,
        categoryId: categories[1].id // Coffee Products
      }
    }),
    prisma.product.upsert({
      where: { slug: 'handwoven-ethiopian-scarf' },
      update: {},
      create: {
        name: 'Handwoven Ethiopian Traditional Scarf',
        slug: 'handwoven-ethiopian-scarf',
        description: 'Beautiful handwoven traditional Ethiopian scarf made by skilled artisans using time-honored techniques. Features intricate patterns and vibrant colors that represent Ethiopian cultural heritage. Made from high-quality cotton with traditional border designs.',
        shortDescription: 'Authentic handwoven Ethiopian scarf with traditional patterns.',
        images: [
          '/images/products/scarf-1.jpg',
          '/images/products/scarf-2.jpg',
          '/images/products/scarf-3.jpg'
        ],
        price: 45.00,
        stock: 15,
        sku: 'SCARF-TRAD-001',
        weight: 0.3,
        dimensions: {
          length: 180,
          width: 60,
          height: 1
        },
        materials: ['Cotton', 'Traditional Dyes'],
        colors: ['Red', 'Green', 'Yellow', 'Blue'],
        sizes: ['One Size'],
        status: 'PUBLISHED',
        featured: false,
        metaTitle: 'Handwoven Ethiopian Traditional Scarf - Authentic Cultural Textile',
        metaDescription: 'Beautiful handwoven Ethiopian scarf with traditional patterns. Made by skilled artisans using authentic techniques and materials.',
        vendorId: vendorProfile.id,
        categoryId: categories[2].id // Textiles
      }
    })
  ])

  // Create sample cultural content
  const culturalContent = await Promise.all([
    prisma.culturalContent.upsert({
      where: { slug: 'ethiopian-coffee-ceremony' },
      update: {},
      create: {
        title: 'The Ethiopian Coffee Ceremony: A Sacred Tradition',
        slug: 'ethiopian-coffee-ceremony',
        content: `
# The Ethiopian Coffee Ceremony: A Sacred Tradition

The Ethiopian coffee ceremony is one of the most important cultural traditions in Ethiopia, representing hospitality, friendship, and community. This ancient ritual has been practiced for centuries and remains an integral part of Ethiopian social life.

## The Three Rounds

The ceremony consists of three distinct rounds, each with its own significance:

### 1. Abol (First Round)
The first round represents blessing and is the strongest coffee. The beans are freshly roasted and ground, creating an aromatic experience that fills the room.

### 2. Tona (Second Round)
The second round symbolizes peace and community. The same grounds are used again, creating a milder flavor while maintaining the social aspect of sharing.

### 3. Baraka (Third Round)
The final round represents blessing and good fortune. It's the mildest of the three and concludes the ceremony with wishes for prosperity.

## The Process

1. **Green Coffee Beans**: Fresh, green coffee beans are washed and sorted
2. **Roasting**: Beans are roasted over an open flame in a pan called 'menkeshkesh'
3. **Grinding**: The roasted beans are ground by hand using a mortar and pestle
4. **Brewing**: Coffee is brewed in a traditional clay pot called 'jebena'
5. **Serving**: Coffee is served in small cups called 'cini' with sugar or salt

## Cultural Significance

The coffee ceremony is more than just preparing coffee - it's a time for:
- Community bonding
- Sharing news and gossip
- Resolving conflicts
- Celebrating special occasions
- Welcoming guests

This beautiful tradition showcases the deep connection between Ethiopian culture and coffee, reminding us that Ethiopia is indeed the birthplace of coffee.
        `,
        excerpt: 'Discover the sacred Ethiopian coffee ceremony, a beautiful tradition that brings communities together through the ritual of preparing and sharing coffee.',
        images: [
          '/images/cultural/coffee-ceremony-1.jpg',
          '/images/cultural/coffee-ceremony-2.jpg'
        ],
        type: 'article',
        category: 'Traditions',
        tags: ['Coffee', 'Ceremony', 'Culture', 'Tradition', 'Community'],
        language: 'en',
        status: 'PUBLISHED',
        featured: true,
        metaTitle: 'Ethiopian Coffee Ceremony - Sacred Cultural Tradition',
        metaDescription: 'Learn about the Ethiopian coffee ceremony, a sacred tradition that brings communities together through the ritual of preparing and sharing coffee.',
        authorName: 'Cultural Heritage Team'
      }
    })
  ])

  // Create sample promo codes
  const promoCodes = await Promise.all([
    prisma.promoCode.upsert({
      where: { code: 'WELCOME10' },
      update: {},
      create: {
        code: 'WELCOME10',
        description: 'Welcome discount for new customers',
        discountType: 'percentage',
        discountValue: 10.00,
        minOrderAmount: 50.00,
        usageLimit: 1000,
        usageCount: 0,
        userLimit: 1,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        isActive: true,
        applicableToTours: true,
        applicableToProducts: true
      }
    }),
    prisma.promoCode.upsert({
      where: { code: 'SUMMER2024' },
      update: {},
      create: {
        code: 'SUMMER2024',
        description: 'Summer season discount',
        discountType: 'fixed_amount',
        discountValue: 25.00,
        minOrderAmount: 100.00,
        maxDiscount: 50.00,
        usageLimit: 500,
        usageCount: 0,
        validFrom: new Date('2024-06-01'),
        validUntil: new Date('2024-08-31'),
        isActive: true,
        applicableToTours: true,
        applicableToProducts: false
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`   - ${categories.length} categories`)
  console.log(`   - 1 vendor profile`)
  console.log(`   - 1 guide profile`)
  console.log(`   - ${tours.length} tours`)
  console.log(`   - ${products.length} products`)
  console.log(`   - ${culturalContent.length} cultural articles`)
  console.log(`   - ${promoCodes.length} promo codes`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })