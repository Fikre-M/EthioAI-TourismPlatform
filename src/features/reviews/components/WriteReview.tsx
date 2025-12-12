import React, { useState, useRef } from 'react'
import { Button } from '@components/common/Button/Button'
import { Review } from '../pages/ReviewsPage'
import {
  FaStar, FaTimes, FaCamera, FaVideo, FaUpload, FaTrash,
  FaMapMarkerAlt, FaCalendar, FaHashtag, FaUsers, FaGlobe,
  FaPlay, FaImage, FaPlus, FaCheck, FaExclamationTriangle,
  FaSpinner, FaQuoteLeft, FaLightbulb, FaHeart
} from 'react-icons/fa'

interface WriteReviewProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (review: Omit<Review, 'id' | 'createdAt' | 'helpful' | 'notHelpful' | 'replies'>) => void
  prefilledData?: {
    type?: Review['type']
    itemId?: string
    itemName?: string
    itemImage?: string
  }
}

interface MediaFile {
  id: string
  file: File
  type: 'photo' | 'video'
  preview: string
  caption: string
  duration?: number
}

const WriteReview: React.FC<WriteReviewProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prefilledData
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    type: prefilledData?.type || 'tour' as Review['type'],
    itemId: prefilledData?.itemId || '',
    itemName: prefilledData?.itemName || '',
    itemImage: prefilledData?.itemImage || '',
    rating: 0,
    title: '',
    content: '',
    visitDate: '',
    location: '',
    tripType: 'solo' as Review['tripType'],
    tags: [] as string[],
    language: 'en'
  })
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [newTag, setNewTag] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Mock search results for items
  const mockSearchResults = [
    {
      id: 'tour-001',
      name: 'Historic Route & Rock Churches of Lalibela',
      type: 'tour',
      image: '/tours/lalibela-tour.jpg'
    },
    {
      id: 'prod-001',
      name: 'Ethiopian Coffee Experience Set',
      type: 'product',
      image: '/products/coffee-set-1.jpg'
    },
    {
      id: 'guide-001',
      name: 'Dawit Tadesse - Cultural Heritage Guide',
      type: 'guide',
      image: '/guides/dawit.jpg'
    }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }))
  }

  const handleItemSearch = (query: string) => {
    setFormData(prev => ({ ...prev, itemName: query }))
    
    if (query.length > 2) {
      setIsSearching(true)
      // Simulate API search
      setTimeout(() => {
        const filtered = mockSearchResults.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase()) &&
          item.type === formData.type
        )
        setSearchResults(filtered)
        setIsSearching(false)
      }, 500)
    } else {
      setSearchResults([])
    }
  }

  const handleItemSelect = (item: any) => {
    setFormData(prev => ({
      ...prev,
      itemId: item.id,
      itemName: item.name,
      itemImage: item.image
    }))
    setSearchResults([])
  }

  const handleMediaUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video') => {
    const files = Array.from(event.target.files || [])
    
    files.forEach(file => {
      if (mediaFiles.length >= 10) {
        alert('Maximum 10 media files allowed')
        return
      }

      const mediaFile: MediaFile = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        file,
        type,
        preview: URL.createObjectURL(file),
        caption: '',
        duration: type === 'video' ? 0 : undefined
      }

      // For videos, get duration
      if (type === 'video') {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          mediaFile.duration = Math.floor(video.duration)
          URL.revokeObjectURL(video.src)
        }
        video.src = mediaFile.preview
      }

      setMediaFiles(prev => [...prev, mediaFile])
    })

    // Reset input
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleMediaCaptionChange = (mediaId: string, caption: string) => {
    setMediaFiles(prev =>
      prev.map(media =>
        media.id === mediaId ? { ...media, caption } : media
      )
    )
  }

  const handleMediaRemove = (mediaId: string) => {
    setMediaFiles(prev => {
      const media = prev.find(m => m.id === mediaId)
      if (media) {
        URL.revokeObjectURL(media.preview)
      }
      return prev.filter(m => m.id !== mediaId)
    })
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.type && formData.itemId && formData.itemName
      case 2:
        return formData.rating > 0 && formData.title.trim() && formData.content.trim().length >= 50
      case 3:
        return formData.visitDate
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setIsSubmitting(true)

    try {
      // Convert media files to review format
      const photos = mediaFiles
        .filter(media => media.type === 'photo')
        .map(media => ({
          id: media.id,
          url: media.preview, // In real app, this would be uploaded URL
          caption: media.caption
        }))

      const videos = mediaFiles
        .filter(media => media.type === 'video')
        .map(media => ({
          id: media.id,
          url: media.preview, // In real app, this would be uploaded URL
          thumbnail: media.preview, // In real app, this would be generated thumbnail
          caption: media.caption,
          duration: media.duration || 0
        }))

      const reviewData: Omit<Review, 'id' | 'createdAt' | 'helpful' | 'notHelpful' | 'replies'> = {
        type: formData.type,
        itemId: formData.itemId,
        itemName: formData.itemName,
        itemImage: formData.itemImage,
        userId: 'current-user-id', // In real app, get from auth
        userName: 'Current User', // In real app, get from auth
        userAvatar: '/avatars/current-user.jpg', // In real app, get from auth
        userLevel: 'Traveler', // In real app, calculate based on user activity
        rating: formData.rating,
        title: formData.title,
        content: formData.content,
        photos,
        videos,
        location: formData.location ? {
          name: formData.location,
          coordinates: [0, 0] // In real app, geocode the location
        } : undefined,
        visitDate: formData.visitDate,
        updatedAt: undefined,
        isVerified: false, // In real app, verify based on booking/purchase history
        isEdited: false,
        tags: formData.tags,
        language: formData.language,
        tripType: formData.tripType
      }

      await onSubmit(reviewData)
      
      // Reset form
      setFormData({
        type: 'tour',
        itemId: '',
        itemName: '',
        itemImage: '',
        rating: 0,
        title: '',
        content: '',
        visitDate: '',
        location: '',
        tripType: 'solo',
        tags: [],
        language: 'en'
      })
      setMediaFiles([])
      setCurrentStep(1)
      
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
        className={`text-2xl ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        } ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
        disabled={!interactive}
      >
        <FaStar />
      </button>
    ))
  }

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'What are you reviewing?'
      case 2: return 'Share your experience'
      case 3: return 'Add details'
      case 4: return 'Media & final touches'
      default: return 'Write Review'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getStepTitle(currentStep)}</h2>
            <div className="flex items-center mt-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step < currentStep ? <FaCheck /> : step}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Item */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What type of experience are you reviewing?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'tour', label: 'Tour', icon: '🗺️' },
                    { value: 'product', label: 'Product', icon: '🛍️' },
                    { value: 'guide', label: 'Guide', icon: '👨‍🏫' },
                    { value: 'destination', label: 'Destination', icon: '📍' }
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleInputChange('type', type.value)}
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for the {formData.type} you want to review
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => handleItemSearch(e.target.value)}
                    placeholder={`Search for a ${formData.type}...`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <FaSpinner className="animate-spin text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemSelect(item)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 text-left"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600 capitalize">{item.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Item */}
                {formData.itemId && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={formData.itemImage}
                        alt={formData.itemName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="font-medium text-green-900">{formData.itemName}</div>
                        <div className="text-sm text-green-700 capitalize">{formData.type} selected</div>
                      </div>
                      <FaCheck className="text-green-600 ml-auto" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Rating and Review */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How would you rate your experience?
                </label>
                <div className="flex items-center space-x-2 mb-4">
                  {renderStars(formData.rating, true)}
                  <span className="ml-3 text-gray-600">
                    {formData.rating > 0 && (
                      <>
                        {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                        {formData.rating === 5 && ' - Excellent!'}
                        {formData.rating === 4 && ' - Very Good'}
                        {formData.rating === 3 && ' - Good'}
                        {formData.rating === 2 && ' - Fair'}
                        {formData.rating === 1 && ' - Poor'}
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Summarize your experience in a few words"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={100}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.title.length}/100
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review *
                </label>
                <div className="relative">
                  <textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Share your detailed experience. What made it special? What should others know?"
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    minLength={50}
                    maxLength={2000}
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                    {formData.content.length}/2000
                  </div>
                </div>
                {formData.content.length < 50 && formData.content.length > 0 && (
                  <div className="text-sm text-amber-600 mt-1 flex items-center">
                    <FaExclamationTriangle className="mr-1" />
                    Please write at least 50 characters ({50 - formData.content.length} more needed)
                  </div>
                )}
              </div>

              {/* Writing Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FaLightbulb className="text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Writing Tips</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Be specific about what you liked or didn't like</li>
                      <li>• Mention any standout moments or experiences</li>
                      <li>• Include practical tips for future visitors</li>
                      <li>• Be honest and constructive in your feedback</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visit Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When did you visit? *
                  </label>
                  <input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => handleInputChange('visitDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trip Type
                  </label>
                  <select
                    value={formData.tripType}
                    onChange={(e) => handleInputChange('tripType', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="solo">Solo Travel</option>
                    <option value="couple">Couple</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="business">Business</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Lalibela, Ethiopia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      <FaHashtag className="mr-1 text-xs" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags like 'historical', 'family-friendly', etc."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-l-none bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FaPlus />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Media Upload */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Photos and Videos (Optional)
                </h3>
                <p className="text-gray-600 mb-4">
                  Help others by sharing visual content from your experience. You can upload up to 10 files.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleMediaUpload(e, 'photo')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      disabled={mediaFiles.length >= 10}
                    >
                      <FaCamera className="text-3xl text-gray-400 mx-auto mb-2" />
                      <div className="font-medium text-gray-700">Upload Photos</div>
                      <div className="text-sm text-gray-500">JPG, PNG up to 10MB each</div>
                    </button>
                  </div>

                  <div>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => handleMediaUpload(e, 'video')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      disabled={mediaFiles.length >= 10}
                    >
                      <FaVideo className="text-3xl text-gray-400 mx-auto mb-2" />
                      <div className="font-medium text-gray-700">Upload Videos</div>
                      <div className="text-sm text-gray-500">MP4, MOV up to 100MB each</div>
                    </button>
                  </div>
                </div>

                {/* Media Preview */}
                {mediaFiles.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Uploaded Media ({mediaFiles.length}/10)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mediaFiles.map((media) => (
                        <div key={media.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              {media.type === 'photo' ? (
                                <img
                                  src={media.preview}
                                  alt="Preview"
                                  className="w-16 h-16 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <FaPlay className="text-gray-600" />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleMediaRemove(media.id)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                <FaTimes />
                              </button>
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {media.type === 'photo' ? 'Photo' : 'Video'}
                                {media.duration && ` (${Math.floor(media.duration / 60)}:${(media.duration % 60).toString().padStart(2, '0')})`}
                              </div>
                              <input
                                type="text"
                                value={media.caption}
                                onChange={(e) => handleMediaCaptionChange(media.id, e.target.value)}
                                placeholder="Add a caption (optional)"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                maxLength={100}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="or">Oromo</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            {currentStep > 1 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={isSubmitting}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep(currentStep)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!validateStep(currentStep) || isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <FaHeart className="mr-2" />
                    Publish Review
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WriteReview