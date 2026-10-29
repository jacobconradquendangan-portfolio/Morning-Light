'use client';

import { useEffect } from 'react';
import { Icons } from '@/components/Icons';

/**
 * Route-level error boundary (Next.js App Router convention). Catches render
 * errors in the page tree and keeps the app from white-screening.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Calorie Counter crashed:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-base-canvas flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md card p-6 sm:p-8 text-center animate-scale-in">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-semantic-error-muted flex items-center justify-center">
          <Icons.Alert className="w-7 h-7 text-semantic-error" size={28} />
        </div>

        <h1 className="font-display text-xl font-semibold text-text-primary tracking-tight mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-5">
          The app hit an unexpected error. Your logged food and water data is stored
          locally and has not been affected.
        </p>

        {error.digest && (
          <p className="text-xs font-mono text-text-muted tabular mb-5">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => reset()} className="btn btn-primary flex-1">
            Try again
          </button>
          <button onClick={() => window.location.reload()} className="btn btn-secondary flex-1">
            <Icons.Refresh className="w-4 h-4" size={16} />
            Reload app
          </button>
        </div>

        <details className="mt-5 text-left group">
          <summary className="text-xs text-text-muted cursor-pointer hover:text-text-primary transition-colors select-none">
            Technical details
          </summary>
          <pre className="mt-2.5 p-3.5 bg-base-canvas border border-border-subtle rounded-xl text-xs font-mono text-text-secondary overflow-x-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}
