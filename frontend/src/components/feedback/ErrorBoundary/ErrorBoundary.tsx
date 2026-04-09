import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
          <h1 className="text-2xl font-bold text-destructive">Something went wrong</h1>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            {this.state.error?.message ?? 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      )
    }
    return this.props.children
  }
}
