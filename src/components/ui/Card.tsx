import { HTMLAttributes, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className = '', 
    variant = 'default', 
    padding = 'md',
    hover = false,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = 'rounded-lg transition-all duration-200'
    
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700',
    }
    
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }
    
    const hoverStyles = hover ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : ''
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card sub-components
export const CardHeader = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props} />
)

export const CardTitle = ({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`} {...props} />
)

export const CardDescription = ({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`} {...props} />
)

export const CardContent = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${className}`} {...props} />
)

export const CardFooter = ({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`mt-4 flex items-center justify-between ${className}`} {...props} />
)