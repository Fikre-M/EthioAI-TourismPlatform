import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { BookingItem, CartState, PromoCode } from '@/types/booking'
import bookingService, { 
  CreateBookingData, 
  UpdateBookingData, 
  CancelBookingData,
  ValidatePromoCodeData,
  BookingQueryParams 
} from '@/services/booking.service'

// Mock promo codes (in production, validate these on the backend)
export const AVAILABLE_PROMO_CODES: PromoCode[] = [
  {
    code: 'WELCOME10',
    discount: 10,
    type: 'percentage',
    minPurchase: 50,
  },
  {
    code: 'SUMMER20',
    discount: 20,
    type: 'percentage',
    minPurchase: 100,
    maxDiscount: 50,
  },
  {
    code: 'FIRST25',
    discount: 25,
    type: 'fixed',
    minPurchase: 75,
  },
  {
    code: 'HOLIDAY15',
    discount: 15,
    type: 'percentage',
    expiryDate: '2025-12-31',
  },
]

const calculateTotals = (state: CartState) => {
  state.subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0)
  state.totalItems = state.items.length
  
  // Calculate discount
  if (state.appliedPromo) {
    const promo = state.appliedPromo
    
    if (promo.type === 'percentage') {
      state.discount = (state.subtotal * promo.discount) / 100
      if (promo.maxDiscount) {
        state.discount = Math.min(state.discount, promo.maxDiscount)
      }
    } else {
      state.discount = promo.discount
    }
  } else {
    state.discount = 0
  }
  
  state.totalPrice = Math.max(0, state.subtotal - state.discount)
}

// Async Thunks
export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (data: CreateBookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(data);
      return response.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (params?: BookingQueryParams, { rejectWithValue }) => {
    try {
      const response = await bookingService.getMyBookings(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'booking/fetchBookingById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(id);
      return response.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
    }
  }
);

export const updateBooking = createAsyncThunk(
  'booking/updateBooking',
  async ({ id, data }: { id: string; data: UpdateBookingData }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBooking(id, data);
      return response.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ id, data }: { id: string; data: CancelBookingData }, { rejectWithValue }) => {
    try {
      const response = await bookingService.cancelBooking(id, data);
      return response.data.booking;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
    }
  }
);

export const validatePromoCodeAsync = createAsyncThunk(
  'booking/validatePromoCode',
  async (data: ValidatePromoCodeData, { rejectWithValue }) => {
    try {
      const response = await bookingService.validatePromoCode(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid promo code');
    }
  }
);

export const fetchUpcomingBookings = createAsyncThunk(
  'booking/fetchUpcomingBookings',
  async (limit?: number, { rejectWithValue }) => {
    try {
      const response = await bookingService.getUpcomingBookings(limit);
      return response.data.bookings;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming bookings');
    }
  }
);

const initialState: CartState & {
  bookings: any[];
  currentBooking: any | null;
  loading: boolean;
  error: string | null;
  promoValidation: {
    loading: boolean;
    error: string | null;
    validatedPromo: any | null;
  };
} = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  discount: 0,
  totalPrice: 0,
  appliedPromo: null,
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
  promoValidation: {
    loading: false,
    error: null,
    validatedPromo: null,
  },
}

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<BookingItem>) => {
      // Check if item already exists (same tour, same date)
      const existingIndex = state.items.findIndex(
        item => item.tourId === action.payload.tourId && item.date === action.payload.date
      )
      
      if (existingIndex !== -1) {
        // Update existing item
        state.items[existingIndex] = action.payload
      } else {
        // Add new item
        state.items.push(action.payload)
      }
      
      calculateTotals(state)
    },
    
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload)
      calculateTotals(state)
    },
    
    updateCartItem: (state, action: PayloadAction<BookingItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id)
      if (index !== -1) {
        state.items[index] = action.payload
        calculateTotals(state)
      }
    },
    
    updateParticipants: (state, action: PayloadAction<{ id: string; adults: number; children: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id)
      if (item) {
        item.participants.adults = action.payload.adults
        item.participants.children = action.payload.children
        
        // Recalculate total price
        const participantsTotal = 
          (item.participants.adults * item.pricePerAdult) + 
          (item.participants.children * item.pricePerChild)
        const addOnsTotal = item.addOns?.reduce((sum, addon) => sum + addon.price, 0) || 0
        item.totalPrice = participantsTotal + addOnsTotal
        
        calculateTotals(state)
      }
    },
    
    applyPromoCode: (state, action: PayloadAction<string>) => {
      const code = action.payload.toUpperCase()
      const promo = AVAILABLE_PROMO_CODES.find(p => p.code === code)
      
      if (!promo) {
        return // Invalid code
      }
      
      // Check expiry
      if (promo.expiryDate && new Date(promo.expiryDate) < new Date()) {
        return // Expired
      }
      
      // Check minimum purchase
      if (promo.minPurchase && state.subtotal < promo.minPurchase) {
        return // Doesn't meet minimum
      }
      
      state.appliedPromo = promo
      calculateTotals(state)
    },
    
    removePromoCode: (state) => {
      state.appliedPromo = null
      calculateTotals(state)
    },
    
    clearCart: (state) => {
      state.items = []
      state.totalItems = 0
      state.subtotal = 0
      state.discount = 0
      state.totalPrice = 0
      state.appliedPromo = null
    },
  },
  extraReducers: (builder) => {
    // Create Booking
    builder.addCase(createBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.currentBooking = action.payload;
      // Clear cart after successful booking
      state.items = [];
      state.totalItems = 0;
      state.subtotal = 0;
      state.discount = 0;
      state.totalPrice = 0;
      state.appliedPromo = null;
    });
    builder.addCase(createBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch My Bookings
    builder.addCase(fetchMyBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings = action.payload.bookings;
    });
    builder.addCase(fetchMyBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Booking By ID
    builder.addCase(fetchBookingById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBookingById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentBooking = action.payload;
    });
    builder.addCase(fetchBookingById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update Booking
    builder.addCase(updateBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.currentBooking = action.payload;
      // Update in bookings list if exists
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    });
    builder.addCase(updateBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Cancel Booking
    builder.addCase(cancelBooking.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(cancelBooking.fulfilled, (state, action) => {
      state.loading = false;
      state.currentBooking = action.payload;
      // Update in bookings list if exists
      const index = state.bookings.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bookings[index] = action.payload;
      }
    });
    builder.addCase(cancelBooking.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Validate Promo Code
    builder.addCase(validatePromoCodeAsync.pending, (state) => {
      state.promoValidation.loading = true;
      state.promoValidation.error = null;
      state.promoValidation.validatedPromo = null;
    });
    builder.addCase(validatePromoCodeAsync.fulfilled, (state, action) => {
      state.promoValidation.loading = false;
      state.promoValidation.validatedPromo = action.payload;
      // Apply the validated promo code
      if (action.payload.valid && action.payload.promoCode) {
        state.appliedPromo = {
          code: action.payload.promoCode.code,
          discount: action.payload.promoCode.discountValue,
          type: action.payload.promoCode.discountType,
        };
        state.discount = action.payload.discountAmount || 0;
        state.totalPrice = Math.max(0, state.subtotal - state.discount);
      }
    });
    builder.addCase(validatePromoCodeAsync.rejected, (state, action) => {
      state.promoValidation.loading = false;
      state.promoValidation.error = action.payload as string;
    });

    // Fetch Upcoming Bookings
    builder.addCase(fetchUpcomingBookings.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUpcomingBookings.fulfilled, (state, action) => {
      state.loading = false;
      state.bookings = action.payload;
    });
    builder.addCase(fetchUpcomingBookings.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
})

export const { 
  addToCart, 
  removeFromCart, 
  updateCartItem, 
  updateParticipants,
  applyPromoCode,
  removePromoCode,
  clearCart 
} = bookingSlice.actions

export default bookingSlice.reducer
