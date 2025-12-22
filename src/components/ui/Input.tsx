import { InputHTMLAttributes, forwardRef, useState } from 'react'
import type { Size } from './types'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  size?: Size
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  isLoading?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className = '', 
    label,
    error,
    helperText,
    size = 'md',
    leftIcon,
    rightIcon,
    isLoading = false,
    type = 'text',
    id,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseStyles = `
      w-full rounded-lg border transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed
      placeholder:text-gray-400 dark:placeholder:text-gray-500
    `.replace(/\s+/g, ' ').trim()
    
    const sizes = {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-4 text-base',
      xl: 'h-12 px-6 text-lg',
    }
    
    const stateStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-900/10'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800'
    
    const paddingWithIcons = leftIcon && rightIcon 
      ? 'pl-10 pr-10' 
      : leftIcon 
      ? 'pl-10' 
      : rightIcon 
      ? 'pr-10' 
      : ''

    const inputType = type === 'password' && showPassword ? 'text' : type

    const PasswordToggle = () => (
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        onClick={() => setShowPassword(!showPassword)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    )

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={`${baseStyles} ${sizes[size]} ${stateStyles} ${paddingWithIcons} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {type === 'password' && <PasswordToggle />}
          
          {rightIcon && type !== 'password' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>
          )}
        </div>
        
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'