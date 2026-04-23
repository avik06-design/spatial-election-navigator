import React, { Component } from 'react';

/**
 * ErrorBoundary — Catches unhandled JavaScript errors in any descendant component tree
 * and renders a graceful fallback UI instead of crashing the entire application.
 *
 * @extends {Component<{children: React.ReactNode}, {hasError: boolean, error: Error|null}>}
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Derives error state from thrown errors in the component tree.
   * @param {Error} error - The thrown error.
   * @returns {{hasError: boolean, error: Error}}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs error details for observability and debugging.
   * @param {Error} error - The thrown error.
   * @param {React.ErrorInfo} errorInfo - Component stack trace.
   */
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught UI fault:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex items-center justify-center h-screen bg-black"
        >
          <div className="text-red-400 p-6 bg-red-900/20 rounded-xl border border-red-500/30 max-w-md text-center">
            <h2 className="text-lg font-semibold mb-2">System UI fault</h2>
            <p className="text-red-400/70 text-sm mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-300 text-sm hover:bg-red-500/30 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
