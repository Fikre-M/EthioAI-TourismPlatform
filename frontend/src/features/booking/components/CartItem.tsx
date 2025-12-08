import { useDispatch } from 'react-redux'
import { removeFromCart } from '@store/slices/bookingSlice'
import { BookingItem } from '@/types/booking'
import Button from '@components/common/Button/Button'
import { FaTrash, FaCalendar, FaUsers, FaMapMarkerAlt, FaClock } from 'react-icons/fa'

interface CartItemProps {
  item: BookingItem
}

export default function CartItem({ item }: CartItemProps) {
  const dispatch = useDispatch()

  const handleRemove = () => {
    dispatch(removeFromCart(item.id))
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="md:flex">
        {/* Tour Image */}
        <div className="md:w-48 h-48 md:h-auto">
          <img
            src={item.tourImage}
            alt={item.tourName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-900">{item.tourName}</h3>
            <button
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Remove from cart"
            >
              <FaTrash className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-gray-600">
              <FaCalendar className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm">{new Date(item.date).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <FaUsers className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm">
                {item.participants.adults} Adult{item.participants.adults > 1 ? 's' : ''}
                {item.participants.children > 0 && `, ${item.participants.children} Child${item.participants.children > 1 ? 'ren' : ''}`}
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm">{item.meetingPoint}</span>
            </div>

            <div className="flex items-center text-gray-600">
              <FaClock className="w-4 h-4 mr-2 text-orange-500" />
              <span className="text-sm">{item.duration}</span>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{item.participants.adults} × Adult</span>
              <span>${item.pricePerAdult * item.participants.adults}</span>
            </div>
            {item.participants.children > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{item.participants.children} × Child</span>
                <span>${item.pricePerChild * item.participants.children}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-2">
              <span>Subtotal</span>
              <span className="text-orange-600">${item.totalPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
