export interface BookingItem {
  id: string
  tourId: string
  tourName: string
  tourImage: string
  date: string
  participants: {
    adults: number
    children: number
  }
  pricePerAdult: number
  pricePerChild: number
  totalPrice: number
  meetingPoint: string
  duration: string
}

export interface BookingFormData {
  tourId: string
  date: string
  adults: number
  children: number
  specialRequests?: string
  contactName: string
  contactEmail: string
  contactPhone: string
}

export interface CartState {
  items: BookingItem[]
  totalItems: number
  totalPrice: number
}
