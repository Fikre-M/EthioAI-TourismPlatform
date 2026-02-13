import { useParams, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import BookingForm from '../components/BookingForm'
import { Loader } from '@components/common/Loader/Loader'
import { api } from '@api/axios.config'

interface Tour {
  id: string
  title: string
  slug: string
  description: string
  shortDescription?: string
  images: string
  price: number
  duration: number
  maxGroupSize: number
  difficulty: string
  status: string
  featured: boolean
  category: string
  startLocation?: string
  locations?: string
  included?: string
  excluded?: string
  itinerary?: string
  tags?: string
  rating?: number
  reviews?: number
}

export default function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTour = async () => {
      if (!tourId) {
        setError('Tour ID is required')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await api.get(`/api/tours/${tourId}`)
        
        if (response.data?.success && response.data?.data?.tour) {
          const tourData = response.data.data.tour
          
          // Parse JSON strings back to arrays/objects
          const parsedTour = {
            ...tourData,
            images: tourData.images ? JSON.parse(tourData.images) : [],
            startLocation: tourData.startLocation ? JSON.parse(tourData.startLocation) : {},
            locations: tourData.locations ? JSON.parse(tourData.locations) : [],
            included: tourData.included ? JSON.parse(tourData.included) : [],
            excluded: tourData.excluded ? JSON.parse(tourData.excluded) : [],
            itinerary: tourData.itinerary ? JSON.parse(tourData.itinerary) : [],
            tags: tourData.tags ? JSON.parse(tourData.tags) : []
          }
          
          setTour(parsedTour)
        } else {
          setError('Tour not found')
        }
      } catch (err: any) {
        console.error('Error fetching tour:', err)
        setError(err.response?.data?.error?.message || 'Failed to load tour')
      } finally {
        setLoading(false)
      }
    }

    fetchTour()
  }, [tourId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (error || !tour) {
    return <Navigate to="/tours" replace />
  }

  // Get the first image or use a default
  const tourImage = Array.isArray(tour.images) && tour.images.length > 0 
    ? tour.images[0] 
    : 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800'

  // Get location from startLocation or fallback
  const location = (tour.startLocation as any)?.description || tour.category || 'Ethiopia'

  // Format the tour data for the BookingForm component
  const formattedTour = {
    id: tour.id,
    title: tour.title,
    image: tourImage,
    images: Array.isArray(tour.images) ? tour.images : [tourImage],
    price: Number(tour.price),
    location: location,
    duration: `${tour.duration} days`,
    rating: tour.rating || 4.5,
    reviews: tour.reviews || 0,
    description: tour.description,
    category: tour.category,
    difficulty: tour.difficulty,
  } as any

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tour Preview */}
          <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <img
                src={tourImage}
                alt={tour.title}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {tour.title}
                </h1>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Location:</span>
                    {location}
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Duration:</span>
                    {tour.duration} days
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Difficulty:</span>
                    {tour.difficulty}
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Max Group Size:</span>
                    {tour.maxGroupSize} people
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold mr-2">Rating:</span>
                    ⭐ {formattedTour.rating} ({formattedTour.reviews} reviews)
                  </div>
                </div>
                <p className="mt-4 text-gray-700">{tour.description}</p>
                
                {/* Show included items if available */}
                {(tour.included as any) && (tour.included as any).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Included:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {(tour.included as any).map((item: any, index: number) => (
                        <li key={index} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div>
            <BookingForm tour={formattedTour} />
          </div>
        </div>
      </div>
    </div>
  )
}
