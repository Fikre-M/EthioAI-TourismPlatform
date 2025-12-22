import { ReactNode } from 'react'

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const EmptyState = ({
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  icon,
  action,
  className = '',
  size = 'md',
}: EmptyStateProps) => {
  const defaultIcon = (
    <svg
      className={`${size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12'} text-gray-400`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  )

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  }

  const textSizes = {
    sm: {
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      title: 'text-lg',
      description: 'text-base',
    },
    lg: {
      title: 'text-xl',
      description: 'text-lg',
    },
  }

  return (
    <div className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]} ${className}`}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 ${textSizes[size].title}`}>
        {title}
      </h3>
      
      <p className={`text-gray-600 dark:text-gray-400 mb-6 max-w-md ${textSizes[size].description}`}>
        {description}
      </p>

      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action}
        </div>
      )}
    </div>
  )
}