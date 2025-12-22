import { HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'rectangular' | 'circular'
  animation?: 'pulse' | 'wave' | 'none'
}

export const Skeleton = ({ 
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
  style,
  ...props 
}: SkeletonProps) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700'
  
  const variants = {
    text: 'rounded',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  }
  
  const animations = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Could be enhanced with custom wave animation
    none: '',
  }
  
  const inlineStyles = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  }
  
  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${animations[animation]} ${className}`}
      style={inlineStyles}
      role="status"
      aria-label="Loading content"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Predefined skeleton components for common use cases
export const SkeletonText = ({ lines = 1, ...props }: { lines?: number } & SkeletonProps) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        height="1rem"
        width={i === lines - 1 ? '75%' : '100%'}
        {...props}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ ...props }: SkeletonProps) => (
  <div className="space-y-4 p-4 border rounded-lg">
    <Skeleton variant="rectangular" height="12rem" {...props} />
    <div className="space-y-2">
      <Skeleton variant="text" height="1.5rem" width="60%" />
      <SkeletonText lines={2} />
    </div>
  </div>
)

export const SkeletonAvatar = ({ size = 40, ...props }: { size?: number } & SkeletonProps) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    {...props}
  />
)