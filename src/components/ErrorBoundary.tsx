/**
 * ErrorBoundary Component
 * 
 * Implements AC1: React Error Boundaries to catch rendering errors
 * Implements AC2: User-friendly error messages
 * Implements AC5: Fallback UI when error boundaries catch errors
 * Implements AC10: Allow users to manually retry (via reset)
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { errorService } from '@/services/errorService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error using our ErrorService (AC6 & AC7)
    errorService.handleError(error, {
      componentStack: errorInfo.componentStack,
      type: 'render_error',
    });

    // Call optional callback
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI (AC5)
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback - Default fallback UI component
 * AC2: User-friendly error messages (no stack traces)
 * AC5: Fallback UI
 * AC10: Manual retry option
 */
interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  onReload?: () => void;
  title?: string;
  message?: string;
}

export function ErrorFallback({
  error,
  onReset,
  onReload,
  title = 'Something went wrong',
  message,
}: ErrorFallbackProps) {
  // Get user-friendly message (AC2 & AC9)
  const userMessage = message || errorService.getUserMessage(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-3 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {title}
      </h2>
      
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {userMessage}
      </p>

      <div className="flex gap-3">
        {onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        
        {onReload && (
          <Button
            variant="ghost"
            onClick={onReload}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Reload Page
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * WidgetErrorFallback - Compact fallback for widget-level errors
 */
interface WidgetErrorFallbackProps {
  title: string;
  onRetry?: () => void;
}

export function WidgetErrorFallback({ title, onRetry }: WidgetErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center border rounded-lg bg-muted/30">
      <AlertTriangle className="h-5 w-5 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-2">
        Failed to load {title}
      </p>
      {onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="gap-1 h-7 text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * withErrorBoundary - HOC to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

