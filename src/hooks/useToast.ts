import { useCallback, useState } from 'react'
import type { Variant } from '@/components/ui/types'

export interface ToastData {
  id: string
  title?: string
  description?: string
  variant?: Variant
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastData = {
      id,
      variant: 'default',
      duration: 5000,
      ...toast,
    }

    setToasts(prev => [...prev, newToast])
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Convenience methods
  const toast = useCallback((message: string, options?: Partial<ToastData>) => {
    return addToast({ description: message, ...options })
  }, [addToast])

  const success = useCallback((message: string, options?: Partial<ToastData>) => {
    return addToast({ description: message, variant: 'success', ...options })
  }, [addToast])

  const error = useCallback((message: string, options?: Partial<ToastData>) => {
    return addToast({ description: message, variant: 'error', ...options })
  }, [addToast])

  const warning = useCallback((message: string, options?: Partial<ToastData>) => {
    return addToast({ description: message, variant: 'warning', ...options })
  }, [addToast])

  const info = useCallback((message: string, options?: Partial<ToastData>) => {
    return addToast({ description: message, variant: 'info', ...options })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    toast,
    success,
    error,
    warning,
    info,
  }
}