import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen modern-bg flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card/90 backdrop-blur-sm rounded-2xl p-8 border border-border text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-display text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <Button onClick={this.handleReload} size="lg" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Return to Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
