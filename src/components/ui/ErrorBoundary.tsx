import { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorState } from './ErrorState'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorState
          title="Application Error"
          description="Something went wrong in the application. Please try refreshing the page."
          error={this.state.error}
          onRetry={this.handleRetry}
          retryText="Try again"
          showDetails={process.env.NODE_ENV === 'development'}
        />
      )
    }

    return this.props.children
  }
}