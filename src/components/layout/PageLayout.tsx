import { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'

export interface PageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  loading?: boolean
  error?: string | Error | null
  onRetry?: () => void
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

export const PageLayout = ({
  children,
  title,
  description,
  loading = false,
  error = null,
  onRetry,
  className = '',
  maxWidth = 'full',
  padding = true,
}: PageLayoutProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  const paddingClass = padding ? 'p-4 md:p-6 lg:p-8' : ''

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <LoadingState text="Loading page..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <ErrorState
          title="Failed to load page"
          description="There was an error loading this page. Please try again."
          error={error}
          onRetry={onRetry}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className={`mx-auto ${maxWidthClasses[maxWidth]} ${paddingClass}`}>
          {(title || description) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}