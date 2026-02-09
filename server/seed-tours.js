const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleTours = [
  {
    title: 'Historic Route of Ethiopia',
    slug: 'historic-route-ethiopia',
    description: 'Explore the ancient wonders of Ethiopia including Lalibela, Gondar, and Axum. Visit rock-hewn churches, medieval castles, and ancient obelisks.',
    shortDescription: 'A journey through Ethiopia\'s ancient history and UNESCO World Heritage sites',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1609137144813-7d9921338f24',
      'https://images.unsplash.com/photo-1611348524140-53c9a25263d6'
    ]),
    price: 1500.00,
    discountPrice: 1350.00,
    duration: 8,
    maxGroupSize: 12,
    difficulty: 'Moderate',
    status: 'PUBLISHED',
    featured: true,
    startLocation: JSON.stringify({
      description: 'Addis Ababa, Ethiopia',
      coordinates: [9.0320, 38.7469]
    }),
    locations: JSON.stringify([
      { name: 'Lalibela', description: 'Rock-hewn churches' },
      { name: 'Gondar', description: 'Medieval castles' },
      { name: 'Axum', description: 'Ancient obelisks' }
    ]),
    included: JSON.stringify([
      'Professional tour guide',
      'All entrance fees',
      'Accommodation (7 nights)',
      'Breakfast daily',
      'Airport transfers'
    ]),
    excluded: JSON.stringify([
      'International flights',
      'Travel insurance',
      'Lunch and dinner',
      'Personal expenses'
    ]),
    itinerary: JSON.stringify([
      { day: 1, title: 'Arrival in Addis Ababa', description: 'Welcome to Ethiopia! Transfer to hotel.' },
      { day: 2, title: 'Fly to Lalibela', description: 'Visit the famous rock-hewn churches.' },
      { day: 3, title: 'Lalibela Exploration', description: 'Continue exploring Lalibela churches.' }
    ]),
    tags: JSON.stringify(['history', 'culture', 'unesco', 'churches']),
    category: 'Cultural',
    language: 'en',
    metaTitle: 'Historic Route of Ethiopia Tour - 8 Days',
    metaDescription: 'Discover Ethiopia\'s ancient history with visits to Lalibela, Gondar, and Axum'
  },
  {
    title: 'Simien Mountains Trekking',
    slug: 'simien-mountains-trekking',
    description: 'Trek through the stunning Simien Mountains National Park, home to unique wildlife including Gelada baboons, Ethiopian wolves, and Walia ibex. Experience breathtaking landscapes and dramatic escarpments.',
    shortDescription: 'Adventure trekking in Africa\'s most spectacular mountain range',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1621414050345-53db43f7e7ab',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
    ]),
    price: 1200.00,
    duration: 6,
    maxGroupSize: 8,
    difficulty: 'Challenging',
    status: 'PUBLISHED',
    featured: true,
    startLocation: JSON.stringify({
      description: 'Gondar, Ethiopia',
      coordinates: [12.6090, 37.4654]
    }),
    locations: JSON.stringify([
      { name: 'Simien Mountains', description: 'UNESCO World Heritage Site' },
      { name: 'Sankaber Camp', description: 'Mountain camp' },
      { name: 'Geech Camp', description: 'High altitude camp' }
    ]),
    included: JSON.stringify([
      'Experienced trekking guide',
      'Park entrance fees',
      'Camping equipment',
      'All meals during trek',
      'Mule support'
    ]),
    excluded: JSON.stringify([
      'Flights to/from Gondar',
      'Hotel in Gondar',
      'Travel insurance',
      'Tips for guides'
    ]),
    itinerary: JSON.stringify([
      { day: 1, title: 'Drive to Sankaber', description: 'Start trek from Debark to Sankaber camp.' },
      { day: 2, title: 'Sankaber to Geech', description: 'Trek through stunning landscapes.' },
      { day: 3, title: 'Geech to Imet Gogo', description: 'Visit the spectacular viewpoint.' }
    ]),
    tags: JSON.stringify(['trekking', 'adventure', 'mountains', 'wildlife', 'unesco']),
    category: 'Adventure',
    language: 'en',
    metaTitle: 'Simien Mountains Trekking - 6 Days Adventure',
    metaDescription: 'Trek through Ethiopia\'s stunning Simien Mountains with expert guides'
  },
  {
    title: 'Danakil Depression Expedition',
    slug: 'danakil-depression-expedition',
    description: 'Visit one of the hottest and most alien places on Earth. Witness the colorful sulfur springs of Dallol, the lava lake of Erta Ale volcano, and salt caravans crossing the desert.',
    shortDescription: 'Explore Earth\'s most extreme landscape',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1589519160732-57fc498494f8',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
    ]),
    price: 1800.00,
    duration: 5,
    maxGroupSize: 10,
    difficulty: 'Challenging',
    status: 'PUBLISHED',
    featured: true,
    startLocation: JSON.stringify({
      description: 'Mekele, Ethiopia',
      coordinates: [13.4967, 39.4753]
    }),
    locations: JSON.stringify([
      { name: 'Dallol', description: 'Colorful sulfur springs' },
      { name: 'Erta Ale', description: 'Active volcano with lava lake' },
      { name: 'Salt Plains', description: 'Traditional salt mining' }
    ]),
    included: JSON.stringify([
      'Expert guide',
      'All camping equipment',
      'All meals',
      '4WD transportation',
      'Armed scout (required by law)'
    ]),
    excluded: JSON.stringify([
      'Flights to/from Mekele',
      'Hotel in Mekele',
      'Travel insurance',
      'Personal expenses'
    ]),
    itinerary: JSON.stringify([
      { day: 1, title: 'Drive to Dodom', description: 'Journey through the desert.' },
      { day: 2, title: 'Erta Ale Volcano', description: 'Trek to the volcano and camp on the rim.' },
      { day: 3, title: 'Dallol Visit', description: 'Explore the colorful sulfur springs.' }
    ]),
    tags: JSON.stringify(['adventure', 'volcano', 'desert', 'extreme', 'unique']),
    category: 'Adventure',
    language: 'en',
    metaTitle: 'Danakil Depression Expedition - 5 Days',
    metaDescription: 'Experience the otherworldly landscapes of the Danakil Depression'
  },
  {
    title: 'Omo Valley Cultural Tour',
    slug: 'omo-valley-cultural-tour',
    description: 'Discover the diverse tribal cultures of the Omo Valley. Meet the Mursi, Hamer, Karo, and other indigenous tribes, and learn about their unique traditions and way of life.',
    shortDescription: 'Immerse yourself in Ethiopia\'s tribal cultures',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1523805009345-7448845a9e53',
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e'
    ]),
    price: 1400.00,
    duration: 7,
    maxGroupSize: 10,
    difficulty: 'Easy',
    status: 'PUBLISHED',
    featured: false,
    startLocation: JSON.stringify({
      description: 'Arba Minch, Ethiopia',
      coordinates: [6.0338, 37.5616]
    }),
    locations: JSON.stringify([
      { name: 'Mursi Village', description: 'Famous for lip plates' },
      { name: 'Hamer Village', description: 'Traditional bull jumping ceremony' },
      { name: 'Karo Village', description: 'Body painting traditions' }
    ]),
    included: JSON.stringify([
      'Cultural guide',
      'All accommodation',
      'All meals',
      '4WD transportation',
      'Village entrance fees'
    ]),
    excluded: JSON.stringify([
      'Flights to/from Arba Minch',
      'Photography fees',
      'Travel insurance',
      'Tips and gifts for tribes'
    ]),
    itinerary: JSON.stringify([
      { day: 1, title: 'Arba Minch to Jinka', description: 'Drive through scenic landscapes.' },
      { day: 2, title: 'Visit Mursi Tribe', description: 'Meet the Mursi people.' },
      { day: 3, title: 'Hamer Village', description: 'Experience Hamer culture.' }
    ]),
    tags: JSON.stringify(['culture', 'tribes', 'photography', 'anthropology']),
    category: 'Cultural',
    language: 'en',
    metaTitle: 'Omo Valley Cultural Tour - 7 Days',
    metaDescription: 'Discover the unique tribal cultures of Ethiopia\'s Omo Valley'
  },
  {
    title: 'Bale Mountains Wildlife Safari',
    slug: 'bale-mountains-wildlife-safari',
    description: 'Explore the Bale Mountains National Park, home to the rare Ethiopian wolf, mountain nyala, and over 260 bird species. Trek through Afro-alpine moorlands and pristine forests.',
    shortDescription: 'Wildlife watching in Ethiopia\'s biodiversity hotspot',
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1549366021-9f761d450615',
      'https://images.unsplash.com/photo-1535083783855-76ae62b2914e'
    ]),
    price: 1100.00,
    duration: 5,
    maxGroupSize: 12,
    difficulty: 'Moderate',
    status: 'PUBLISHED',
    featured: false,
    startLocation: JSON.stringify({
      description: 'Goba, Ethiopia',
      coordinates: [7.0167, 39.9833]
    }),
    locations: JSON.stringify([
      { name: 'Sanetti Plateau', description: 'Ethiopian wolf habitat' },
      { name: 'Harenna Forest', description: 'Pristine cloud forest' },
      { name: 'Dinsho', description: 'Mountain nyala viewing' }
    ]),
    included: JSON.stringify([
      'Wildlife guide',
      'Park fees',
      'Accommodation',
      'All meals',
      'Transportation'
    ]),
    excluded: JSON.stringify([
      'Flights',
      'Travel insurance',
      'Personal expenses',
      'Tips'
    ]),
    itinerary: JSON.stringify([
      { day: 1, title: 'Arrival in Goba', description: 'Transfer to lodge.' },
      { day: 2, title: 'Sanetti Plateau', description: 'Search for Ethiopian wolves.' },
      { day: 3, title: 'Harenna Forest', description: 'Forest wildlife viewing.' }
    ]),
    tags: JSON.stringify(['wildlife', 'nature', 'birds', 'endemic', 'mountains']),
    category: 'Wildlife',
    language: 'en',
    metaTitle: 'Bale Mountains Wildlife Safari - 5 Days',
    metaDescription: 'Spot rare Ethiopian wolves and endemic wildlife in Bale Mountains'
  }
];

async function seedTours() {
  try {
    console.log('🌱 Seeding tours...\n');
    
    for (const tourData of sampleTours) {
      // Check if tour already exists
      const existing = await prisma.tour.findUnique({
        where: { slug: tourData.slug }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping "${tourData.title}" (already exists)`);
        continue;
      }
      
      const tour = await prisma.tour.create({
        data: tourData
      });
      
      console.log(`✅ Created: ${tour.title}`);
    }
    
    console.log('\n✅ Tour seeding completed!');
    console.log(`\n📊 Total tours in database: ${await prisma.tour.count()}`);
    
  } catch (error) {
    console.error('❌ Error seeding tours:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedTours();
