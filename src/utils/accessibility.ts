// Accessibility utilities for better user experience

/**
 * Manages focus trap for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement
  private focusableElements: HTMLElement[]
  private firstFocusableElement: HTMLElement | null = null
  private lastFocusableElement: HTMLElement | null = null

  constructor(element: HTMLElement) {
    this.element = element
    this.focusableElements = this.getFocusableElements()
    this.updateFocusableElements()
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ')

    return Array.from(this.element.querySelectorAll(focusableSelectors)) as HTMLElement[]
  }

  private updateFocusableElements() {
    this.focusableElements = this.getFocusableElements()
    this.firstFocusableElement = this.focusableElements[0] || null
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null
  }

  public activate() {
    this.updateFocusableElements()
    this.element.addEventListener('keydown', this.handleKeyDown)
    this.firstFocusableElement?.focus()
  }

  public deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown)
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault()
        this.lastFocusableElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault()
        this.firstFocusableElement?.focus()
      }
    }
  }
}

/**
 * Announces messages to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Manages skip links for keyboard navigation
 */
export const createSkipLink = (targetId: string, text: string = 'Skip to main content') => {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = text
  skipLink.className = `
    absolute -top-10 left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded
    focus:top-4 transition-all duration-200 sr-only focus:not-sr-only
  `.replace(/\s+/g, ' ').trim()

  skipLink.addEventListener('click', (e) => {
    e.preventDefault()
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  })

  return skipLink
}

/**
 * Checks if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Checks if user prefers high contrast
 */
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches
}

/**
 * Gets appropriate ARIA label for loading states
 */
export const getLoadingAriaLabel = (context?: string): string => {
  return context ? `Loading ${context}` : 'Loading'
}

/**
 * Gets appropriate ARIA label for error states
 */
export const getErrorAriaLabel = (context?: string): string => {
  return context ? `Error loading ${context}` : 'Error occurred'
}

/**
 * Validates color contrast ratio
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  // This is a simplified version - in production, you'd want a more robust implementation
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate luminance
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255

    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Checks if contrast ratio meets WCAG standards
 */
export const meetsContrastStandards = (
  color1: string, 
  color2: string, 
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(color1, color2)
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7
  }
  
  return size === 'large' ? ratio >= 3 : ratio >= 4.5
}