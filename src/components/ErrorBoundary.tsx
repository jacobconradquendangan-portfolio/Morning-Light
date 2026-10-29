'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Shown in the fallback so the user knows which section failed. */
  label?: string;
  /** Changing this value resets the boundary (e.g. pass the active tab). */
  resetKey?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Component-level error boundary. `app/error.tsx` only catches errors in the
 * page tree as a whole, so without this a crash in one tab would unmount the
 * bottom navigation and every other tab along with it.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`Error in ${this.props.label ?? 'component'}:`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Clear the error when the caller signals a context change (e.g. tab switch)
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-900/50 p-4 text-center">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {this.props.label ? `${this.props.label} couldn't load` : 'This section hit an error'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Your data is safe — this only affects what&apos;s on screen.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Try again
          </button>
          <details className="mt-3 text-left">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200">
              Technical details
            </summary>
            <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
