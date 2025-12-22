import { useEffect, useState } from 'react'
import type { Variant } from './types'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: Variant
  duration?: number
  onClose: (id: string) => void
}

export const Toast = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
  }

  const variants = {
    default: {
      container: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      icon: 'text-gray-400',
    },
    primary: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-400',
    },
    secondary: {
      container: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
      icon: 'text-gray-400',
    },
    success: {
      container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      icon: 'text-green-400',
    },
    warning: {
      container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-400',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon: 'text-red-400',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon: 'text-blue-400',
    },
  }

  const icons = {
    default: null,
    primary: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    secondary: null,
    success: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  }

  const currentVariant = variants[variant]
  const icon = icons[variant]

  return (
    <div
      className={`
        pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg
        transition-all duration-300 ease-in-out
        ${currentVariant.container}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          {icon && (
            <div className={`flex-shrink-0 ${currentVariant.icon}`}>
              {icon}
            </div>
          )}
          
          <div className={`${icon ? 'ml-3' : ''} w-0 flex-1 pt-0.5`}>
            {title && (
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
              </p>
            )}
            {description && (
              <p className={`${title ? 'mt-1' : ''} text-sm text-gray-500 dark:text-gray-400`}>
                {description}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={handleClose}
              aria-label="Close notification"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}