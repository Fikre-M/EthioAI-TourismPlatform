import { LoadingSpinner } from './LoadingSpinner'
import type { Size } from './types'

export interface LoadingStateProps {
  text?: string
  size?: Size
  className?: string
  showSpinner?: boolean
}

export const LoadingState = ({
  text = 'Loading...',
  size = 'md',
  className = '',
  showSpinner = true,
}: LoadingStateProps) => {
  const sizeClasses = {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
    xl: 'p-16',
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  return (
    <div 
      className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      {showSpinner && (
        <div className="mb-4">
          <LoadingSpinner size={size} />
        </div>
      )}
      
      <p className={`text-gray-600 dark:text-gray-400 ${textSizes[size]}`}>
        {text}
      </p>
    </div>
  )
}