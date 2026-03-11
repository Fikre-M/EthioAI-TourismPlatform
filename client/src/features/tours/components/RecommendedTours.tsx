import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Tour } from '@/services/tour.service'
import { TourCard } from './TourCard'

export interface RecommendedToursProps {
  currentTour?: Tour
  variant?: 'ai-picks' | 'similar' | 'regional'
  region?: string
  category?: string
  maxItems?: number
  className?: string
}

export const RecommendedTours = ({
  currentTour,
  variant = 'ai-picks',
  region,
  category,
  maxItems = 4,
  className = '',
}: RecommendedToursProps) => {
  const [recommendations, setRecommendations] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  // Mock browsing history for AI recommendations
  const mockBrowsingHistory = {
    categories: ['historical', 'cultural', 'adventure'],
    regions: ['Amhara', 'Tigray', 'Oromia'],
    priceRange: { min: 3000, max: 8000 },
    duration: [5, 7, 10],
  }

  // Mock recommended tours data
  const mockTours: Tour[] = [
    {
      id: '2',
      title: 'Simien Mountains Trekking Adventure',
      description: 'Trek through the stunning Simien Mountains National Park, home to unique wildlife and breathtaking landscapes.',
      shortDescription: 'Trek through stunning mountain landscapes',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
      price: 4500,
      duration: 5,
      category: 'adventure',
      difficulty: 'Challenging',
      maxGroupSize: 8,
      included: ['Guide', 'Camping equipment', 'Meals'],
      excluded: ['Personal gear', 'Tips'],
      itinerary: [],
      guide: {
        id: '2',
        user: {
          name: 'Tadesse Alemu',
          avatar: 'https://i.pravatar.cc/150?img=13',
        },
        experience: 120,
        languages: ['English', 'Amharic'],
        specialties: ['Trekking', 'Wildlife'],
        rating: 4.9,
        totalReviews: 89,
        isVerified: true,
      },
      availability: [],
      tags: ['UNESCO', 'Trekking', 'Wildlife'],
      featured: true,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '3',
      title: 'Danakil Depression Expedition',
      description: 'Explore one of the hottest and most alien landscapes on Earth, featuring colorful sulfur springs and salt flats.',
      shortDescription: 'Visit the hottest place on Earth',
      imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
      images: ['https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800'],
      price: 6500,
      duration: 4,
      category: 'adventure',
      difficulty: 'Challenging',
      maxGroupSize: 10,
      included: ['4WD transport', 'Guide', 'Camping'],
      excluded: ['Personal items', 'Insurance'],
      guide: {
        id: '3',
        user: {
          name: 'Ahmed Hassan',
          avatar: 'https://i.pravatar.cc/150?img=14',
        },
        experience: 95,
        languages: ['English', 'Amharic', 'Afar'],
        specialties: ['Volcano', 'Extreme'],
        rating: 4.8,
        totalReviews: 67,
        isVerified: true,
      },
      availability: [],
      tags: ['Volcano', 'Extreme', 'Photography'],
      featured: false,
      createdAt: '2024-02-01T00:00:00Z',
      updatedAt: '2024-02-01T00:00:00Z',
    },
    {
      id: '4',
      title: 'Omo Valley Cultural Journey',
      description: 'Discover the diverse tribal cultures of the Omo Valley, meeting indigenous communities and experiencing their traditions.',
      shortDescription: 'Meet indigenous tribes and cultures',
      images: ['https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800'],
      price: 5500,
      duration: 6,
      category: 'cultural',
      difficulty: 'Moderate',
      maxGroupSize: 12,
      included: ['Transport', 'Guide', 'Accommodation'],
      excluded: ['Flights', 'Photo fees'],
      guide: {
        id: '4',
        user: {
          name: 'Bekele Worku',
          avatar: 'https://i.pravatar.cc/150?img=15',
        },
        experience: 110,
        languages: ['English', 'Amharic', 'Oromo'],
        specialties: ['Culture', 'Tribes'],
        rating: 4.7,
        totalReviews: 78,
        isVerified: true,
      },
      availability: [],
      tags: ['Culture', 'Tribes', 'Photography'],
      featured: true,
      createdAt: '2024-02-15T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z',
    },
    {
      id: '5',
      title: 'Bale Mountains Wildlife Safari',
      description: 'Explore the unique Afro-alpine ecosystem of Bale Mountains, home to the rare Ethiopian wolf and mountain nyala.',
      shortDescription: 'Spot rare Ethiopian wildlife',
      images: ['https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800'],
      price: 4800,
      duration: 5,
      category: 'wildlife',
      difficulty: 'Moderate',
      maxGroupSize: 10,
      included: ['Park fees', 'Guide', 'Accommodation'],
      excluded: ['Transport to park', 'Personal expenses'],
      guide: {
        id: '5',
        user: {
          name: 'Girma Tesfaye',
          avatar: 'https://i.pravatar.cc/150?img=16',
        },
        experience: 130,
        languages: ['English', 'Amharic', 'Oromo'],
        specialties: ['Wildlife', 'Nature'],
        rating: 4.9,
        totalReviews: 92,
        isVerified: true,
      },
      availability: [],
      tags: ['Wildlife', 'Nature', 'Endemic Species'],
      featured: false,
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-01T00:00:00Z',
    },
    {
      id: '6',
      title: 'Tigray Rock Churches Exploration',
      description: 'Climb to ancient rock-hewn churches perched on cliff faces, offering stunning views and spiritual experiences.',
      shortDescription: 'Climb to cliff-top churches',
      images: ['https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800'],
      price: 4200,
      duration: 4,
      category: 'historical',
      difficulty: 'Challenging',
      maxGroupSize: 8,
      included: ['Guide', 'Transport', 'Entrance fees'],
      excluded: ['Accommodation', 'Meals'],
      guide: {
        id: '6',
        user: {
          name: 'Gebre Selassie',
          avatar: 'https://i.pravatar.cc/150?img=17',
        },
        experience: 105,
        languages: ['English', 'Tigrinya', 'Amharic'],
        specialties: ['Churches', 'History'],
        rating: 4.8,
        totalReviews: 71,
        isVerified: true,
      },
      availability: [],
      tags: ['Churches', 'History', 'Adventure'],
      featured: true,
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
    },
  ]

  useEffect(() => {
    // Simulate API call with loading delay
    setLoading(true)
    const timer = setTimeout(() => {
      let filtered: Tour[] = []

      switch (variant) {
        case 'ai-picks':
          // AI-based recommendations using browsing history
          filtered = mockTours.filter((tour) => {
            const matchesCategory = mockBrowsingHistory.categories.includes(tour.category)
            // Note: Service Tour doesn't have region property, so using tags instead
            const matchesTags = mockBrowsingHistory.regions.some(region => 
              (tour.tags || []).some(tag => tag.toLowerCase().includes(region.toLowerCase()))
            )
            const matchesPrice =
              tour.price >= mockBrowsingHistory.priceRange.min &&
              tour.price <= mockBrowsingHistory.priceRange.max
            return matchesCategory || matchesTags || matchesPrice
          })
          break

        case 'similar':
          // Similar tours based on current tour
          if (currentTour) {
            filtered = mockTours.filter((tour) => {
              if (tour.id === currentTour.id) return false
              const sameCategory = tour.category === currentTour.category
              // Note: Service Tour doesn't have region property
              const similarPrice = Math.abs(tour.price - currentTour.price) < 2000
              const similarDuration = Math.abs(tour.duration - currentTour.duration) <= 2
              return sameCategory || similarPrice || similarDuration
            })
          }
          break

        case 'regional':
          // Popular tours in specific region
          filtered = mockTours.filter((tour) => {
            if (region) return (tour.tags || []).some(tag => tag.toLowerCase().includes(region.toLowerCase()))
            if (category) return tour.category === category
            return tour.featured
          })
          break

        default:
          filtered = mockTours
      }

      // Sort by guide rating and limit results
      const sorted = filtered.sort((a, b) => (b.guide?.rating || 0) - (a.guide?.rating || 0)).slice(0, maxItems)
      setRecommendations(sorted)
      setLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [variant, currentTour, region, category, maxItems])

  const getTitle = () => {
    switch (variant) {
      case 'ai-picks':
        return '🤖 AI Picks for You'
      case 'similar':
        return '🎯 Similar Tours You Might Like'
      case 'regional':
        return region ? `🌟 Popular in ${region}` : `🌟 Popular Tours`
      default:
        return 'Recommended Tours'
    }
  }

  const getDescription = () => {
    switch (variant) {
      case 'ai-picks':
        return 'Based on your browsing history and preferences'
      case 'similar':
        return 'Tours similar to the one you\'re viewing'
      case 'regional':
        return region
          ? `Top-rated tours in the ${region} region`
          : 'Most popular tours across Ethiopia'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div>
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{getTitle()}</h2>
          <p className="text-gray-600 dark:text-gray-400">{getDescription()}</p>
        </div>
        {recommendations.length > maxItems && (
          <Link
            to="/tours"
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            View All
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        )}
      </div>

      {/* AI Insights Badge (for AI picks variant) */}
      {variant === 'ai-picks' && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Personalized Recommendations
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Our AI analyzed your interests in{' '}
                <span className="font-medium text-orange-600">
                  {mockBrowsingHistory.categories.join(', ')}
                </span>{' '}
                tours and selected these perfect matches for you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>

      {/* CTA Section */}
      {variant === 'ai-picks' && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Want more personalized recommendations?
          </p>
          <Link
            to="/tours"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Explore All Tours
          </Link>
        </div>
      )}
    </div>
  )
}
