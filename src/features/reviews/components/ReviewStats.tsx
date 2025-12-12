import React from 'react'
import { Review } from '../pages/ReviewsPage'
import {
  FaStar, FaCamera, FaVideo, FaCheckCircle, FaGlobe,
  FaUsers, FaTrophy, FaHeart, FaComment, FaShare,
  FaChartLine, FaCalendar, FaMapMarkerAlt
} from 'react-icons/fa'

interface ReviewStatsProps {
  reviews: Review[]
  className?: string
}

const ReviewStats: React.FC<ReviewStatsProps> = ({ reviews, className = '' }) => {
  const calculateStats = () => {
    const total = reviews.length
    if (total === 0) return null

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / total
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    
    reviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++
    })

    const withPhotos = reviews.filter(r => r.photos.length > 0).length
    const withVideos = reviews.filter(r => r.videos.length > 0).length
    const verified = reviews.filter(r => r.isVerified).length
    const totalHelpful = reviews.reduce((sum, review) => sum + review.helpful, 0)
    const totalReplies = reviews.reduce((sum, review) => sum + review.replies, 0)

    const typeDistribution = reviews.reduce((acc, review) => {
      acc[review.type] = (acc[review.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const languageDistribution = reviews.reduce((acc, review) => {
      acc[review.language] = (acc[review.language] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tripTypeDistribution = reviews.reduce((acc, review) => {
      if (review.tripType) {
        acc[review.tripType] = (acc[review.tripType] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentReviews = reviews.filter(r => new Date(r.createdAt) > thirtyDaysAgo).length

    return {
      total,
      averageRating: averageRating.toFixed(1),
      ratingDistribution,
      withPhotos,
      withVideos,
      verified,
      totalHelpful,
      totalReplies,
      typeDistribution,
      languageDistribution,
      tripTypeDistribution,
      recentReviews
    }
  }

  const stats = calculateStats()
  if (!stats) return null

  const getRatingPercentage = (rating: number) => {
    return ((stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.total) * 100).toFixed(1)
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Community Insights</h3>
      
      <div className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-gray-900 mr-2">{stats.averageRating}</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.floor(parseFloat(stats.averageRating)) ? 'text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-600">{stats.total} total reviews</p>
        </div>

        {/* Rating Distribution */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Rating Breakdown</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 w-8">
                  {rating} ★
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getRatingPercentage(rating)}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {getRatingPercentage(rating)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FaCamera className="text-blue-600 mr-1" />
              <span className="font-semibold text-blue-900">{stats.withPhotos}</span>
            </div>
            <p className="text-xs text-blue-700">With Photos</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FaVideo className="text-purple-600 mr-1" />
              <span className="font-semibold text-purple-900">{stats.withVideos}</span>
            </div>
            <p className="text-xs text-purple-700">With Videos</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FaCheckCircle className="text-green-600 mr-1" />
              <span className="font-semibold text-green-900">{stats.verified}</span>
            </div>
            <p className="text-xs text-green-700">Verified</p>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FaCalendar className="text-orange-600 mr-1" />
              <span className="font-semibold text-orange-900">{stats.recentReviews}</span>
            </div>
            <p className="text-xs text-orange-700">This Month</p>
          </div>
        </div>

        {/* Engagement Stats */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Community Engagement</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaHeart className="text-red-500 mr-2" />
                <span className="text-sm text-gray-700">Total Helpful Votes</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalHelpful}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaComment className="text-blue-500 mr-2" />
                <span className="text-sm text-gray-700">Total Replies</span>
              </div>
              <span className="font-semibold text-gray-900">{stats.totalReplies}</span>
            </div>
          </div>
        </div>

        {/* Review Types */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Review Categories</h4>
          <div className="space-y-2">
            {Object.entries(stats.typeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-lg mr-2">
                    {type === 'tour' ? '🗺️' : 
                     type === 'product' ? '🛍️' : 
                     type === 'guide' ? '👨‍🏫' : '📍'}
                  </span>
                  <span className="text-sm text-gray-700 capitalize">{type}s</span>
                </div>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trip Types */}
        {Object.keys(stats.tripTypeDistribution).length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Trip Types</h4>
            <div className="space-y-2">
              {Object.entries(stats.tripTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">
                      {type === 'solo' ? '🚶' : 
                       type === 'couple' ? '💑' : 
                       type === 'family' ? '👨‍👩‍👧‍👦' : 
                       type === 'friends' ? '👥' : '💼'}
                    </span>
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Languages</h4>
          <div className="space-y-2">
            {Object.entries(stats.languageDistribution).map(([lang, count]) => (
              <div key={lang} className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaGlobe className="text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">
                    {lang === 'en' ? 'English' : 
                     lang === 'am' ? 'Amharic' : 
                     lang === 'or' ? 'Oromo' : lang}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewStats