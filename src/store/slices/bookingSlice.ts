import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BookingItem, CartState } from '@/types/booking'

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalPrice: 0,
}

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<BookingItem>) => {
      state.items.push(action.payload)
      state.totalItems = state.items.length
      state.totalPrice = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      state.totalItems = state.items.length
      state.totalPrice = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
    },
    updateCartItem: (state, action: PayloadAction<BookingItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
        state.totalPrice = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
      }
    },
    clearCart: (state) => {
      state.items = []
      state.totalItems = 0
      state.totalPrice = 0
    },
  },
})

export const { addToCart, removeFromCart, updateCartItem, clearCart } = bookingSlice.actions
export default bookingSlice.reducer
