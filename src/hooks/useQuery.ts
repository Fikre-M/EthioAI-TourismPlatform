import { useCallback, useEffect, useRef, useState } from 'react'

export interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  isStale: boolean
}

export interface UseQueryOptions<T> {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  retry?: number
  retryDelay?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

const queryCache = new Map<string, { data: any; timestamp: number }>()

export function useQuery<T = any>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    retry = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options

  const queryKey = Array.isArray(key) ? key.join(':') : key
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: false,
    error: null,
    isStale: false,
  })

  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const lastFetchRef = useRef(0)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return

    const cached = queryCache.get(queryKey)
    const now = Date.now()
    
    // Use cache if available and not stale
    if (!force && cached && (now - cached.timestamp) < staleTime) {
      if (mountedRef.current) {
        setState({
          data: cached.data,
          loading: false,
          error: null,
          isStale: false,
        })
      }
      return
    }

    const fetchId = ++lastFetchRef.current

    if (mountedRef.current) {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null,
        isStale: !!cached 
      }))
    }

    try {
      const data = await queryFn()
      
      if (mountedRef.current && fetchId === lastFetchRef.current) {
        // Update cache
        queryCache.set(queryKey, { data, timestamp: now })
        
        setState({
          data,
          loading: false,
          error: null,
          isStale: false,
        })
        
        onSuccess?.(data)
        retryCountRef.current = 0
      }
    } catch (error) {
      if (mountedRef.current && fetchId === lastFetchRef.current) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        
        // Retry logic
        if (retryCountRef.current < retry) {
          retryCountRef.current++
          setTimeout(() => {
            if (mountedRef.current) {
              fetchData(force)
            }
          }, retryDelay * retryCountRef.current)
          return
        }
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
        
        onError?.(error as Error)
      }
    }
  }, [queryKey, queryFn, enabled, staleTime, retry, retryDelay, onSuccess, onError])

  const refetch = useCallback(() => {
    retryCountRef.current = 0
    return fetchData(true)
  }, [fetchData])

  const invalidate = useCallback(() => {
    queryCache.delete(queryKey)
    return fetchData(true)
  }, [queryKey, fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      const cached = queryCache.get(queryKey)
      if (cached && (Date.now() - cached.timestamp) > staleTime) {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, queryKey, staleTime, fetchData])

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect) return

    const handleOnline = () => fetchData()
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, fetchData])

  // Cleanup cache
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      for (const [key, value] of queryCache.entries()) {
        if (now - value.timestamp > cacheTime) {
          queryCache.delete(key)
        }
      }
    }

    const interval = setInterval(cleanup, cacheTime)
    return () => clearInterval(interval)
  }, [cacheTime])

  return {
    ...state,
    refetch,
    invalidate,
  }
}