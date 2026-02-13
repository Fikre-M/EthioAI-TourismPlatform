import { useState, useEffect } from 'react'
import { TourGrid } from '../components/TourGrid'
import { EnhancedTourFilters } from '../components/EnhancedTourFilters'
import { TourSearchBar, SearchSuggestion } from '../components/TourSearchBar'
import { TourSortDropdown, SortOption } from '../components/TourSortDropdown'
import { Tour, TourFilters as TourFiltersType } from '@/types/tour'
import { api } from '@api/axios.config'

export const ToursPage = () => {
  const [tours, setTours] = useState<Tour[]>([])
  const [filteredTours, setFilteredTours] = useState<Tour[]>([])
  const [filters, setFilters] = useState<TourFiltersType>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('popularity')
  const [isLoading, setIsLoading] = useState(true)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])

  // Fetch tours from API
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setIsLoading(true)
        const response = await api.get('/api/tours')
        
        if (response.data?.success && response.data?.data?.tours) {
          const apiTours = response.data.data.tours.map((tour: any) => ({
            id: tour.id,
            title: tour.title,
            description: tour.description,
            shortDescription: tour.shortDescription || tour.description.substring(0, 100) + '...',
            imageUrl: tour.images ? JSON.parse(tour.images)[0] || 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800' : 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800',
            images: tour.images ? JSON.parse(tour.images) : [],
            price: Number(tour.price),
            currency: 'USD',
            duration: `${tour.duration} days`,
            durationDays: tour.duration,
            location: tour.startLocation ? JSON.parse(tour.startLocation).description : tour.category,
            region: 'Ethiopia',
            category: tour.category.toLowerCase(),
            difficulty: tour.difficulty.toLowerCase(),
            rating: 4.5, // Default rating since we don't have this in the API yet
            reviewCount: 0, // Default review count
            maxGroupSize: tour.maxGroupSize,
            minAge: 12,
            highlights: tour.tags ? JSON.parse(tour.tags) : [],
            included: tour.included ? JSON.parse(tour.included) : [],
            excluded: tour.excluded ? JSON.parse(tour.excluded) : [],
            itinerary: tour.itinerary ? JSON.parse(tour.itinerary) : [],
            guide: {
              id: '1',
              name: 'Professional Guide',
              avatar: '',
              languages: ['English', 'Amharic'],
              rating: 4.8,
              toursGuided: 50,
            },
            availability: [],
            tags: tour.tags ? JSON.parse(tour.tags) : [],
            featured: tour.featured,
            createdAt: new Date(tour.createdAt),
            updatedAt: new Date(tour.updatedAt),
          }))
          
          setTours(apiTours)
          setFilteredTours(apiTours)
        }
      } catch (error) {
        console.error('Error fetching tours:', error)
        // Keep empty array on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchTours()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = [...tours]

    // Search
    if (searchQuery) {
      result = result.filter(tour =>
        tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      result = result.filter(tour => filters.category!.includes(tour.category))
    }

    // Price range
    if (filters.priceRange) {
      result = result.filter(tour =>
        tour.price >= filters.priceRange![0] && tour.price <= filters.priceRange![1]
      )
    }

    // Duration
    if (filters.duration) {
      result = result.filter(tour =>
        tour.durationDays >= filters.duration![0] && tour.durationDays <= filters.duration![1]
      )
    }

    // Difficulty
    if (filters.difficulty && filters.difficulty.length > 0) {
      result = result.filter(tour => filters.difficulty!.includes(tour.difficulty))
    }

    // Rating
    if (filters.rating) {
      result = result.filter(tour => tour.rating >= filters.rating!)
    }

    // Region
    if (filters.region && filters.region.length > 0) {
      result = result.filter(tour => filters.region!.includes(tour.region))
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating':
          return b.rating - a.rating
        case 'duration':
          return a.durationDays - b.durationDays
        case 'popularity':
          return b.reviewCount - a.reviewCount
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

    setFilteredTours(result)
  }, [tours, filters, searchQuery, sortBy])

  const handleFiltersChange = (newFilters: TourFiltersType) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleSearch = (query: string) => {
    // Generate suggestions based on query
    const mockSuggestions: SearchSuggestion[] = [
      { id: '1', title: 'Lalibela Rock Churches', type: 'tour', icon: '🏛️' },
      { id: '2', title: 'Simien Mountains', type: 'location', icon: '📍' },
      { id: '3', title: 'Historical Tours', type: 'category', icon: '🏷️' },
    ]
    setSuggestions(mockSuggestions.filter(s => 
      s.title.toLowerCase().includes(query.toLowerCase())
    ))
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gradient-ethiopian mb-2 line-clamp-2">
          Discover Ethiopia Tours
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
          Explore our curated collection of tours across Ethiopia
        </p>
      </div>

      {/* Search & Sort Bar */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 min-w-0 overflow-hidden">
        {/* Search */}
        <div className="w-full min-w-0">
          <TourSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            suggestions={suggestions}
            isLoading={isLoading}
          />
        </div>

        {/* Sort */}
        <div className="w-full sm:w-auto sm:self-end flex-shrink-0">
          <TourSortDropdown
            value={sortBy}
            onChange={setSortBy}
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
        Showing {filteredTours.length} of {tours.length} tours
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 min-w-0 overflow-hidden">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1 min-w-0">
          <EnhancedTourFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Tours Grid */}
        <div className="lg:col-span-3 order-1 lg:order-2 min-w-0 overflow-hidden">
          <TourGrid tours={filteredTours} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}

export default ToursPage
