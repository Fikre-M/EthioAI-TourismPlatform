import { ReactNode } from 'react'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

export interface DataListProps<T = any> {
  data: T[]
  loading?: boolean
  error?: string | Error | null
  onRetry?: () => void
  renderItem: (item: T, index: number) => ReactNode
  keyExtractor: (item: T, index: number) => string | number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  loadingText?: string
  errorTitle?: string
  errorDescription?: string
  className?: string
  itemClassName?: string
  gap?: 'none' | 'sm' | 'md' | 'lg'
  direction?: 'vertical' | 'horizontal'
  showLoadMore?: boolean
  onLoadMore?: () => void
  loadingMore?: boolean
  hasMore?: boolean
}

export function DataList<T = any>({
  data,
  loading = false,
  error = null,
  onRetry,
  renderItem,
  keyExtractor,
  emptyTitle = 'No items found',
  emptyDescription = 'There are no items to display.',
  emptyAction,
  loadingText = 'Loading items...',
  errorTitle = 'Failed to load items',
  errorDescription = 'There was an error loading the items. Please try again.',
  className = '',
  itemClassName = '',
  gap = 'md',
  direction = 'vertical',
  showLoadMore = false,
  onLoadMore,
  loadingMore = false,
  hasMore = false,
}: DataListProps<T>) {
  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row flex-wrap',
  }

  // Loading state
  if (loading && data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <LoadingState text={loadingText} />
      </div>
    )
  }

  // Error state
  if (error && data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <ErrorState
          title={errorTitle}
          description={errorDescription}
          error={error}
          onRetry={onRetry}
        />
      </div>
    )
  }

  // Empty state
  if (!loading && !error && data.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex ${directionClasses[direction]} ${gapClasses[gap]}`}>
        {data.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Load more functionality */}
      {showLoadMore && hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={onLoadMore}
            isLoading={loadingMore}
            loadingText="Loading more..."
            variant="outline"
          >
            Load More
          </Button>
        </div>
      )}

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center mt-4">
          <LoadingState text="Loading more items..." size="sm" />
        </div>
      )}
    </div>
  )
}