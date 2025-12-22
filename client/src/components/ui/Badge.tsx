import { HTMLAttributes } from 'react'
import type { Size, Variant } from './types'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
  size?: Size
  dot?: boolean
}

export const Badge = ({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}: BadgeProps) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  }
  
  const sizes = {
    xs: dot ? 'h-2 w-2' : 'px-2 py-0.5 text-xs',
    sm: dot ? 'h-2.5 w-2.5' : 'px-2.5 py-0.5 text-xs',
    md: dot ? 'h-3 w-3' : 'px-3 py-1 text-sm',
    lg: dot ? 'h-3.5 w-3.5' : 'px-3 py-1 text-sm',
    xl: dot ? 'h-4 w-4' : 'px-4 py-1.5 text-base',
  }
  
  if (dot) {
    return (
      <span
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        <span className="sr-only">{children}</span>
      </span>
    )
  }
  
  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}