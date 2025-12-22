// Performance utilities for optimization

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Lazy loading utility for images
 */
export const createImageLoader = (
  src: string,
  onLoad?: () => void,
  onError?: () => void
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      onLoad?.()
      resolve(img)
    }
    
    img.onerror = () => {
      onError?.()
      reject(new Error(`Failed to load image: ${src}`))
    }
    
    img.src = src
  })
}

/**
 * Intersection Observer utility for lazy loading
 */
export class LazyLoader {
  private observer: IntersectionObserver
  private elements = new Map<Element, () => void>()

  constructor(options: IntersectionObserverInit = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    )
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const callback = this.elements.get(entry.target)
        if (callback) {
          callback()
          this.unobserve(entry.target)
        }
      }
    })
  }

  observe(element: Element, callback: () => void) {
    this.elements.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
    this.observer.unobserve(element)
  }

  disconnect() {
    this.observer.disconnect()
    this.elements.clear()
  }
}

/**
 * Memory usage monitoring
 */
export const getMemoryUsage = (): any | null => {
  if ('memory' in performance) {
    return (performance as any).memory
  }
  return null
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private marks = new Map<string, number>()

  mark(name: string) {
    this.marks.set(name, performance.now())
  }

  measure(name: string, startMark?: string): number {
    const endTime = performance.now()
    const startTime = startMark ? this.marks.get(startMark) : 0
    
    if (startTime === undefined) {
      throw new Error(`Start mark "${startMark}" not found`)
    }

    const duration = endTime - (startTime || 0)
    console.log(`${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  clear(name?: string) {
    if (name) {
      this.marks.delete(name)
    } else {
      this.marks.clear()
    }
  }
}

/**
 * Bundle size analyzer (development only)
 */
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return

  const scripts = Array.from(document.querySelectorAll('script[src]'))
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  
  console.group('Bundle Analysis')
  console.log('Scripts:', scripts.length)
  console.log('Stylesheets:', styles.length)
  
  scripts.forEach((script: any) => {
    console.log(`Script: ${script.src}`)
  })
  
  styles.forEach((style: any) => {
    console.log(`Stylesheet: ${style.href}`)
  })
  
  console.groupEnd()
}

/**
 * Resource hints for preloading
 */
export const preloadResource = (href: string, as: string, crossorigin?: string) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  if (crossorigin) link.crossOrigin = crossorigin
  
  document.head.appendChild(link)
}

export const prefetchResource = (href: string) => {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = href
  
  document.head.appendChild(link)
}

/**
 * Web Vitals monitoring
 */
export const measureWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Try to import web-vitals if available
    try {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(onPerfEntry)
        getFID(onPerfEntry)
        getFCP(onPerfEntry)
        getLCP(onPerfEntry)
        getTTFB(onPerfEntry)
      }).catch(() => {
        console.warn('web-vitals package not available')
      })
    } catch {
      console.warn('web-vitals package not available')
    }
  }
}