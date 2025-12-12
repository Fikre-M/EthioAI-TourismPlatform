import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@components/common/Button/Button'
import { Review } from '../pages/ReviewsPage'
import {
  FaStar, FaThumbsUp, FaThumbsDown, FaComment, FaShare,
  FaFlag, FaMapMarkerAlt, FaCalendar, FaCheckCircle,
  FaPlay, FaExpand, FaTimes, FaHeart, FaEye, FaUser,
  FaTrophy, FaGlobe, FaCamera, FaVideo, FaClock,
  FaQuoteLeft, FaHashtag, FaUsers, FaEdit
} from 'react-icons/fa'

interface ReviewCardProps {
  review: Review
  onHelpfulVote: (reviewId: string, isHelpful: boolean) => void
  onReply: (reviewId: string) => void
  onShare: (reviewId: string) => void
  onReport: (reviewId: string) => void
  compact?: boolean
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onHelpfulVote,
  onReply,
  onShare,
  onReport,
  compact = false
}) => {
  const navigate = useNavigate()
  const [showFullContent, setShowFullContent] = useState(false)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatVisitDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    })
  }

  const getUserLevelColor = (level: string) => {
    switch (level) {
      case 'Local Expert': return 'bg-purple-100 text-purple-800'
      case 'Adventurer': return 'bg-green-100 text-green-800'
      case 'Explorer': return 'bg-blue-100 text-blue-800'
      case 'Traveler': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tour': return '🗺️'
      case 'product': return '🛍️'
      case 'guide': return '👨‍🏫'
      case 'destination': return '📍'
      default: return '⭐'
    }
  }

  const getTripTypeIcon = (tripType?: string) => {
    switch (tripType) {
      case 'solo': return '🚶'
      case 'couple': return '💑'
      case 'family': return '👨‍👩‍👧‍👦'
      case 'friends': return '👥'
      case 'business': return '💼'
      default: return '🌟'
    }
  }

  const handleItemClick = () => {
    switch (review.type) {
      case 'tour':
        navigate(`/tours/${review.itemId}`)
        break
      case 'product':
        navigate(`/marketplace/product/${review.itemId}`)
        break
      case 'guide':
        navigate(`/guides/${review.itemId}`)
        break
      case 'destination':
        navigate(`/destinations/${review.itemId}`)
        break
    }
  }

  const handleVideoPlay = (video: any) => {
    setSelectedVideo(video)
    setShowVideoModal(true)
  }

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <FaStar
        key={i}
        className={i < rating ? 'text-yellow-400' : 'text-gray-300'}
      />
    ))
  }

  const shouldTruncateContent = review.content.length > 300 && !showFullContent
  const displayContent = shouldTruncateContent 
    ? review.content.substring(0, 300) + '...'
    : review.content

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <img
              src={review.userAvatar}
              alt={review.userName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{review.userName}</h3>
                {review.isVerified && (
                  <FaCheckCircle className="text-blue-500 text-sm" title="Verified Reviewer" />
                )}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUserLevelColor(review.userLevel)}`}>
                  {review.userLevel}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center">
                  <FaCalendar className="mr-1" />
                  Visited {formatVisitDate(review.visitDate)}
                </div>
                {review.location && (
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-1" />
                    {review.location.name}
                  </div>
                )}
                {review.tripType && (
                  <div className="flex items-center">
                    <span className="mr-1">{getTripTypeIcon(review.tripType)}</span>
                    <span className="capitalize">{review.tripType} trip</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              {formatDate(review.createdAt)}
              {review.isEdited && <span className="ml-1">(edited)</span>}
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(review.rating)}
            </div>
          </div>
        </div>

        {/* Item Reference */}
        <div 
          onClick={handleItemClick}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4"
        >
          <img
            src={review.itemImage}
            alt={review.itemName}
            className="w-12 h-12 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getTypeIcon(review.type)}</span>
              <span className="font-medium text-gray-900">{review.itemName}</span>
            </div>
            <span className="text-sm text-gray-600 capitalize">{review.type}</span>
          </div>
        </div>

        {/* Review Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3">{review.title}</h2>

        {/* Review Content */}
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </p>
          {shouldTruncateContent && (
            <button
              onClick={() => setShowFullContent(true)}
              className="text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              Read more
            </button>
          )}
          {showFullContent && review.content.length > 300 && (
            <button
              onClick={() => setShowFullContent(false)}
              className="text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              Show less
            </button>
          )}
        </div>

        {/* Tags */}
        {review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {review.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
              >
                <FaHashtag className="mr-1 text-xs" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Gallery */}
      {(review.photos.length > 0 || review.videos.length > 0) && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Photos */}
            {review.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setSelectedMediaIndex(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || `Review photo ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <FaExpand className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-white text-xs truncate">{photo.caption}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Videos */}
            {review.videos.map((video, index) => (
              <div
                key={video.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => handleVideoPlay(video)}
              >
                <img
                  src={video.thumbnail}
                  alt={video.caption || `Review video ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <FaPlay className="text-white text-2xl group-hover:scale-110 transition-transform" />
                </div>
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  <FaClock className="inline mr-1" />
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </div>
                {video.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-white text-xs truncate">{video.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onHelpfulVote(review.id, true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
            >
              <FaThumbsUp />
              <span className="text-sm font-medium">{review.helpful}</span>
            </button>
            
            <button
              onClick={() => onHelpfulVote(review.id, false)}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <FaThumbsDown />
              <span className="text-sm font-medium">{review.notHelpful}</span>
            </button>
            
            <button
              onClick={() => onReply(review.id)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <FaComment />
              <span className="text-sm font-medium">{review.replies}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onShare(review.id)}
              className="text-gray-600 hover:text-blue-600 transition-colors"
              title="Share review"
            >
              <FaShare />
            </button>
            
            <button
              onClick={() => onReport(review.id)}
              className="text-gray-600 hover:text-red-600 transition-colors"
              title="Report review"
            >
              <FaFlag />
            </button>
          </div>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedMediaIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedMediaIndex(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl"
            >
              <FaTimes />
            </button>
            
            <img
              src={review.photos[selectedMediaIndex]?.url}
              alt={review.photos[selectedMediaIndex]?.caption}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {review.photos[selectedMediaIndex]?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <p className="text-white text-center">{review.photos[selectedMediaIndex].caption}</p>
              </div>
            )}

            {/* Navigation */}
            {review.photos.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedMediaIndex(
                    selectedMediaIndex > 0 ? selectedMediaIndex - 1 : review.photos.length - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl"
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedMediaIndex(
                    selectedMediaIndex < review.photos.length - 1 ? selectedMediaIndex + 1 : 0
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-2xl"
            >
              <FaTimes />
            </button>
            
            <video
              src={selectedVideo.url}
              controls
              autoPlay
              className="max-w-full max-h-full rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
            
            {selectedVideo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <p className="text-white text-center">{selectedVideo.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewCard