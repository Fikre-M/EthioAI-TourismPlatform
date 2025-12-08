import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addToCart } from '@store/slices/bookingSlice'
import { BookingFormData, BookingItem } from '@/types/booking'
import { Tour } from '@/types/tour'
import Button from '@components/common/Button/Button'
import Input from '@components/common/Input/Input'

interface BookingFormProps {
  tour: Tour
}

export default function BookingForm({ tour }: BookingFormProps) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const [formData, setFormData] = useState<BookingFormData>({
    tourId: tour.id,
    date: '',
    adults: 1,
    children: 0,
    specialRequests: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  })

  const calculateTotal = () => {
    return (formData.adults * tour.price) + (formData.children * tour.price * 0.5)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const bookingItem: BookingItem = {
      id: `${tour.id}-${Date.now()}`,
      tourId: tour.id,
      tourName: tour.title,
      tourImage: tour.image,
      date: formData.date,
      participants: {
        adults: formData.adults,
        children: formData.children,
      },
      pricePerAdult: tour.price,
      pricePerChild: tour.price * 0.5,
      totalPrice: calculateTotal(),
      meetingPoint: tour.location,
      duration: tour.duration,
    }

    dispatch(addToCart(bookingItem))
    navigate('/cart')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900">Book This Tour</h2>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {/* Participants */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adults
          </label>
          <Input
            type="number"
            value={formData.adults}
            onChange={(e) => setFormData({ ...formData, adults: parseInt(e.target.value) })}
            min={1}
            max={20}
            required
          />
          <p className="text-sm text-gray-500 mt-1">${tour.price} per adult</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Children
          </label>
          <Input
            type="number"
            value={formData.children}
            onChange={(e) => setFormData({ ...formData, children: parseInt(e.target.value) })}
            min={0}
            max={20}
          />
          <p className="text-sm text-gray-500 mt-1">${tour.price * 0.5} per child</p>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-gray-900">Contact Information</h3>
        
        <Input
          type="text"
          placeholder="Full Name"
          value={formData.contactName}
          onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          required
        />

        <Input
          type="email"
          placeholder="Email Address"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          required
        />

        <Input
          type="tel"
          placeholder="Phone Number"
          value={formData.contactPhone}
          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
          required
        />
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          rows={3}
          placeholder="Any special requirements or requests..."
          value={formData.specialRequests}
          onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
        />
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Adults ({formData.adults})</span>
          <span>${formData.adults * tour.price}</span>
        </div>
        {formData.children > 0 && (
          <div className="flex justify-between text-sm">
            <span>Children ({formData.children})</span>
            <span>${formData.children * tour.price * 0.5}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span className="text-orange-600">${calculateTotal()}</span>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={!formData.date || !formData.contactName || !formData.contactEmail}
      >
        Add to Cart
      </Button>
    </form>
  )
}
