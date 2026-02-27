"use client";
import * as Sentry from "@sentry/nextjs";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    Sentry.captureException(error, { extra: { errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error }: { error?: Error }) {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>

          <p className="text-muted-foreground mb-6">
            We encountered an unexpected error. This might be due to a navigation issue or temporary problem.
          </p>

          {error && process.env.NODE_ENV === 'development' && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                Error details (development only)
              </summary>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="space-y-3">
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>

              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 