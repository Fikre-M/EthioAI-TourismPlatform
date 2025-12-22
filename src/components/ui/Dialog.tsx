import { ReactNode, useEffect, useRef } from 'react'
import { Button } from './Button'

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      dialogRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      previousFocusRef.current?.focus()
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      <div
        ref={dialogRef}
        className={`relative w-full ${sizes[size]} bg-white dark:bg-gray-800 rounded-lg shadow-xl transform transition-all`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              {title && (
                <h2 id="dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-description" className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="ml-4 p-2"
                aria-label="Close dialog"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// Dialog sub-components for better composition
export const DialogHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`mb-4 ${className}`} {...props} />
)

export const DialogTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${className}`} {...props} />
)

export const DialogDescription = ({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-600 dark:text-gray-400 ${className}`} {...props} />
)

export const DialogFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center justify-end gap-3 mt-6 ${className}`} {...props} />
)