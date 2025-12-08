import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RootState } from '@store/store'
import CartItem from '../components/CartItem'
import Button from '@components/common/Button/Button'
import { FaShoppingCart, FaArrowLeft } from 'react-icons/fa'

export default function CartPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { items, totalItems, totalPrice } = useSelector((state: RootState) => state.booking)

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <FaShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start exploring amazing tours and add them to your cart!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/tours')}
            >
              Browse Tours
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft className="mr-2" />
            Continue Shopping
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Shopping Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                  <span>${totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>$0</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-orange-600">${totalPrice}</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full mb-3"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/tours')}
              >
                Continue Shopping
              </Button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>Free Cancellation</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
