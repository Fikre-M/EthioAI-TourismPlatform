import React from 'react'
import {
  FaFilter, FaStar, FaCamera, FaVideo, FaCheckCircle,
  FaGlobe, FaUsers, FaCalendar, FaTimes, FaHashtag
} from 'react-icons/fa'

interface ReviewFiltersProps {
  filters: {
    type: 'all' | 'tour' | 'product' | 'guide' | 'destination'
    rating: 'all' | '5' | '4' | '3' | '2' | '1'
    sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' | 'trending'
    hasMedia: boolean
    verified: boolean
    language: 'all' | 'en' | 'am' | 'or'
    tripType: 'all' | 'solo' | 'couple' | 'family' | 'friends' | 'business'
    dateRange: 'all' | 'week' | 'month' | 'year'
    tags: string[]
  }
  onFilterChange: (key: string, value: any) => void
  onClearFilters: () => void
  className?: string
}

const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  className = ''
}) => {
  const hasActiveFilters = () => {
    return (
      filters.type !== 'all' ||
      filters.rating !== 'all' ||
      filters.hasMedia ||
      filters.verified ||
      filters.language !== 'all' ||
      filters.tripType !== 'all' ||
      filters.dateRange !== 'all' ||
      filters.tags.length > 0
    )
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.type !== 'all') count++
    if (filters.rating !== 'all') count++
    if (filters.hasMedia) count++
    if (filters.verified) count++
    if (filters.language !== 'all') count++
    if (filters.tripType !== 'all') count++
    if (filters.dateRange !== 'all') count++
    count += filters.tags.length
    return count
  }

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = filters.tags.filter(tag => tag !== tagToRemove)
    onFilterChange('tags', newTags)
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FaFilter className="text-gray-500" />
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
          </div>
          {hasActiveFilters() && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Review Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Types</option>
            <option value="tour">🗺️ Tours</option>
            <option value="product">🛍️ Products</option>
            <option value="guide">👨‍🏫 Guides</option>
            <option value="destination">📍 Destinations</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <select
            value={filters.rating}
            onChange={(e) => onFilterChange('rating', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
            <option value="4">⭐⭐⭐⭐ 4+ Stars</option>
            <option value="3">⭐⭐⭐ 3+ Stars</option>
            <option value="2">⭐⭐ 2+ Stars</option>
            <option value="1">⭐ 1+ Stars</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="newest">📅 Newest First</option>
            <option value="oldest">📅 Oldest First</option>
            <option value="highest">⭐ Highest Rated</option>
            <option value="lowest">⭐ Lowest Rated</option>
            <option value="helpful">👍 Most Helpful</option>
            <option value="trending">🔥 Trending</option>
          </select>
        </div>

        {/* Trip Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip Type
          </label>
          <select
            value={filters.tripType}
            onChange={(e) => onFilterChange('tripType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Trip Types</option>
            <option value="solo">🚶 Solo Travel</option>
            <option value="couple">💑 Couple</option>
            <option value="family">👨‍👩‍👧‍👦 Family</option>
            <option value="friends">👥 Friends</option>
            <option value="business">💼 Business</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={filters.language}
            onChange={(e) => onFilterChange('language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Languages</option>
            <option value="en">🇺🇸 English</option>
            <option value="am">🇪🇹 Amharic</option>
            <option value="or">🇪🇹 Oromo</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange('dateRange', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">📅 Past Week</option>
            <option value="month">📅 Past Month</option>
            <option value="year">📅 Past Year</option>
          </select>
        </div>

        {/* Content Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Content Features
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasMedia}
                onChange={(e) => onFilterChange('hasMedia', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
              />
              <div className="flex items-center">
                <FaCamera className="text-gray-500 mr-2" />
                <span className="text-sm text-gray-700">Has Photos/Videos</span>
              </div>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.verified}
                onChange={(e) => onFilterChange('verified', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
              />
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Verified Reviews Only</span>
              </div>
            </label>
          </div>
        </div>

        {/* Active Tags */}
        {filters.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  <FaHashtag className="mr-1 text-xs" />
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Filters
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onFilterChange('rating', '5')
                onFilterChange('hasMedia', true)
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              ⭐ Top Rated with Media
            </button>
            
            <button
              onClick={() => {
                onFilterChange('verified', true)
                onFilterChange('dateRange', 'month')
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              ✅ Recent Verified
            </button>
            
            <button
              onClick={() => {
                onFilterChange('sortBy', 'helpful')
                onFilterChange('rating', '4')
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              👍 Most Helpful
            </button>
            
            <button
              onClick={() => {
                onFilterChange('sortBy', 'trending')
                onFilterChange('dateRange', 'week')
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
            >
              🔥 Trending This Week
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewFilters