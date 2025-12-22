import { ButtonHTMLAttributes, forwardRef } from 'react'
import type { Size, Variant } from './types'

// Inline LoadingSpinner to avoid import issues
const LoadingSpinner = ({ size = 'md', className = '' }: { size?: Size; className?: string }) => {
  const sizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }
  
  return (
    <div className={`${sizes[size]} animate-spin ${className}`}>
      <svg
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  loadingText?: string
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    loadingText,
    fullWidth = false,
    leftIcon,
    rightIcon,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2 rounded-lg font-medium 
      transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 
      focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
      active:scale-95 select-none
    `.replace(/\s+/g, ' ').trim()
    
    const variants = {
      default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus-visible:ring-gray-500',
      success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus-visible:ring-yellow-500',
      error: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      info: 'bg-cyan-600 text-white hover:bg-cyan-700 focus-visible:ring-cyan-500',
      outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
    }
    
    const sizes = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-6 text-base',
      xl: 'h-12 px-8 text-lg',
    }
    
    const widthClass = fullWidth ? 'w-full' : ''
    const isDisabled = disabled || isLoading
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-describedby={isLoading ? `${props.id}-loading` : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span id={`${props.id}-loading`} className="sr-only">
              {loadingText || 'Loading...'}
            </span>
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'