import { ReactNode } from 'react'

// Common UI Types
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
  'data-testid'?: string
}

export interface LoadingProps {
  isLoading?: boolean
  loadingText?: string
}

export interface ErrorProps {
  error?: Error | string | null
  onRetry?: () => void
}

export interface EmptyProps {
  title?: string
  description?: string
  action?: ReactNode
}

// Size variants
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Color variants
export type Variant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'outline'

// State types
export interface AsyncState<T = any> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
  hasMore: boolean
}