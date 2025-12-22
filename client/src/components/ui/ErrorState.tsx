import { ReactNode } from 'react'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  description?: string
  error?: Error | string | null
  onRetry?: () => void
  retryText?: string
  icon?: ReactNode
  className?: string
  showDetails?: boolean
}

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  error,
  onRetry,
  retryText = 'Try again',
  icon,
  className = '',
  showDetails = false,
}: ErrorStateProps) => {
  const errorMessage = error instanceof Error ? error.message : error

  const defaultIcon = (
    <svg
      className="h-12 w-12 text-red-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
      />
    </svg>
  )

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {description}
      </p>

      {showDetails && errorMessage && (
        <details className="mb-6 w-full max-w-md">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            Show error details
          </summary>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-left">
            <code className="text-xs text-red-600 dark:text-red-400 break-all">
              {errorMessage}
            </code>
          </div>
        </details>
      )}

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="primary"
          className="min-w-[120px]"
        >
          {retryText}
        </Button>
      )}
    </div>
  )
}