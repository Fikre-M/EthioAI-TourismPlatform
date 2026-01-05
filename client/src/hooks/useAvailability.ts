// import { useState, useEffect } from 'react'
// import { bookingService, AvailabilityResponse } from '@/services/bookingService'

// export const useAvailability = (tourId: string, date: string) => {
//   const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     if (!tourId || !date) {
//       setAvailability(null)
//       return
//     }

//     const checkAvailability = async () => {
//       setLoading(true)
//       setError(null)
      
//       try {
//         const result = await bookingService.checkAvailability(tourId, date)
//         setAvailability(result)
//       } catch (err) {
//         setError('Failed to check availability')
//         console.error(err)
//       } finally {
//         setLoading(false)
//       }
//     }

//     checkAvailability()
//   }, [tourId, date])

//   return { availability, loading, error }
// }

// client/src/hooks/useAvailability.ts
import { useState, useCallback } from 'react';
import { bookingService, AvailabilityResponse } from '../services/bookingService';

export const useAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);

  const checkAvailability = useCallback(async (tourId: string, date: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bookingService.checkAvailability(tourId, date);
      setAvailability(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to check availability';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkAvailability, availability, loading, error };
};