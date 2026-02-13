import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PaymentMethodSelector from '../components/PaymentMethodSelector'
import PaymentForm from '../components/PaymentForm'
import { api } from '@api/axios.config'

interface LocationState {
  packageDetails?: {
    id: string
    name: string
    price: number
    currency: string
    duration: string
    description: string
  }
  bookingData?: any
  checkoutData?: any
  cartItems?: any[]
  totalPrice?: number
  subtotal?: number
  discount?: number
  appliedPromo?: any
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  const [selectedMethodId, setSelectedMethodId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Get booking details from checkout or use mock data
  const cartItems = state?.cartItems || []
  const checkoutData = state?.checkoutData
  const totalAmount = state?.totalPrice || state?.packageDetails?.price || 0
  const currency = state?.packageDetails?.currency || 'USD'

  // Mock package details if not provided
  const packageDetails = state?.packageDetails || {
    id: 'tour-001',
    name: cartItems.length > 0 ? cartItems[0].tourName : 'Tour Package',
    price: totalAmount,
    currency: currency,
    duration: cartItems.length > 0 ? cartItems[0].duration : '3 Days',
    description: cartItems.length > 0 ? `Booking for ${cartItems.length} tour(s)` : 'Tour booking'
  }

  const handlePaymentSubmit = async (formData: any) => {
    if (!selectedMethodId) {
      setError('Please select a payment method')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      
      if (!token) {
        // Redirect to login with return URL
        setError('Please log in to complete your booking')
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              from: '/payment',
              checkoutData: checkoutData,
              cartItems: cartItems,
              returnMessage: 'Please log in to complete your booking'
            } 
          })
        }, 2000)
        return
      }

      // Step 1: Create bookings for all cart items
      const bookingPromises = cartItems.map(async (item) => {
        const bookingData = {
          tourId: item.tourId,
          startDate: item.date,
          endDate: item.date, // Will be calculated on backend based on tour duration
          numberOfAdults: item.participants.adults,
          numberOfChildren: item.participants.children,
          totalPrice: item.totalPrice,
          specialRequests: checkoutData?.specialRequests || item.specialRequests || '',
          contactInfo: checkoutData?.contactInfo || {
            firstName: formData.cardholderName?.split(' ')[0] || formData.fullName?.split(' ')[0] || 'Guest',
            lastName: formData.cardholderName?.split(' ')[1] || formData.fullName?.split(' ')[1] || 'User',
            email: checkoutData?.contactInfo?.email || 'user@example.com',
            phone: formData.phoneNumber || checkoutData?.contactInfo?.phone || '',
          },
          travelers: checkoutData?.travelers || [],
          emergencyContact: checkoutData?.emergencyContact,
          addOns: item.addOns || [],
        }

        const response = await api.post('/api/bookings', bookingData)
        return response.data.data.booking
      })

      const bookings = await Promise.all(bookingPromises)
      const bookingIds = bookings.map(b => b.id)

      // Step 2: Create payment intent
      const paymentData = {
        amount: packageDetails.price,
        currency: packageDetails.currency,
        bookingIds: bookingIds,
        paymentMethod: selectedMethodId,
        customerInfo: {
          name: formData.cardholderName || formData.fullName || 'Guest User',
          email: checkoutData?.contactInfo?.email || 'user@example.com',
          phone: formData.phoneNumber || checkoutData?.contactInfo?.phone,
        },
        metadata: {
          cartItems: cartItems.map(item => ({
            tourId: item.tourId,
            tourName: item.tourName,
            date: item.date,
            participants: item.participants,
          })),
          discount: state?.discount || 0,
          promoCode: state?.appliedPromo?.code,
        }
      }

      // Use Stripe or Chapa based on selected method
      let paymentResponse
      if (selectedMethodId === 'stripe_card') {
        paymentResponse = await api.post('/api/payments/stripe/create-intent', paymentData)
      } else if (selectedMethodId.startsWith('chapa_')) {
        paymentResponse = await api.post('/api/payments/chapa/initialize', paymentData)
      } else {
        throw new Error('Unsupported payment method')
      }

      if (paymentResponse.data.success) {
        // Navigate to confirmation with all data
        navigate('/confirmation', {
          state: {
            paymentResponse: paymentResponse.data.data,
            bookings: bookings,
            packageDetails,
            totalAmount: packageDetails.price,
            paymentMethod: selectedMethodId,
          }
        })
      } else {
        setError(paymentResponse.data.message || 'Payment failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Payment error:', err)
      const errorMessage = err.response?.data?.error?.message || err.message || 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              from: '/payment',
              returnMessage: 'Please log in to complete your booking'
            } 
          })
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
          <p className="text-gray-600 mt-2">Secure checkout for your tour booking</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Package Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
              
              <div className="space-y-4">
                {cartItems.length > 0 ? (
                  <>
                    {cartItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
                        <img 
                          src={item.tourImage} 
                          alt={item.tourName}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.tourName}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.participants.adults} adult{item.participants.adults > 1 ? 's' : ''}
                            {item.participants.children > 0 && `, ${item.participants.children} child${item.participants.children > 1 ? 'ren' : ''}`}
                          </p>
                          <p className="text-sm font-semibold text-blue-600 mt-1">
                            ${item.totalPrice}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {state?.discount && state.discount > 0 && (
                      <div className="flex justify-between items-center text-green-600 pt-2">
                        <span className="text-sm">Discount ({state.appliedPromo?.code})</span>
                        <span className="font-semibold">-${state.discount.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{packageDetails.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{packageDetails.description}</p>
                      <p className="text-sm text-blue-600 mt-1">Duration: {packageDetails.duration}</p>
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: packageDetails.currency,
                      }).format(packageDetails.price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <PaymentMethodSelector
                selectedMethod={selectedMethodId}
                onMethodSelect={setSelectedMethodId}
                currency={packageDetails.currency}
                country="ET"
              />
            </div>

            {selectedMethodId && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <PaymentForm
                  selectedMethodId={selectedMethodId}
                  amount={packageDetails.price}
                  currency={packageDetails.currency}
                  onSubmit={handlePaymentSubmit}
                  loading={loading}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage