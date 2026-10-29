'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { IScannerControls } from '@zxing/browser';
import type { FoodSearchResult, BarcodeLookupResult } from '@/types/foodDatabase';
import { Icons } from './Icons';

interface BarcodeScannerProps {
  scanning: boolean;
  onStart: () => void;
  onStop: () => void;
  onResult: (food: FoodSearchResult) => void;
}

type Status = 'idle' | 'starting' | 'scanning' | 'looking-up' | 'not-found' | 'error';

const BARCODE_REGEX = /^\d{8,14}$/;

export function BarcodeScanner({ scanning, onStart, onStop, onResult }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lookupInFlightRef = useRef(false);

  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    lookupInFlightRef.current = false;
  }, []);

  const lookupCode = useCallback(
    async (code: string) => {
      if (lookupInFlightRef.current) return;
      lookupInFlightRef.current = true;

      setStatus('looking-up');
      setLastCode(code);

      try {
        const response = await fetch(`/api/food/barcode?code=${encodeURIComponent(code)}`);
        const data: BarcodeLookupResult & { error?: string } = await response.json();

        if (response.status === 404) {
          setStatus('not-found');
          lookupInFlightRef.current = false;
          return;
        }

        if (!response.ok || !data.success || !data.result) {
          setErrorMessage(data.error || 'Lookup failed');
          setStatus('error');
          lookupInFlightRef.current = false;
          return;
        }

        stopCamera();
        onStop();
        onResult(data.result);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Network error');
        setStatus('error');
        lookupInFlightRef.current = false;
      }
    },
    [onResult, onStop, stopCamera]
  );

  // Start/stop the camera stream. Status here reflects the camera's lifecycle,
  // which is an external system, so driving it from an effect is intentional.
  useEffect(() => {
    if (!scanning) {
      stopCamera();
      return;
    }

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus('starting');
    setErrorMessage(null);

    (async () => {
      try {
        // Dynamic import keeps zxing out of the initial bundle
        const { BrowserMultiFormatReader, BarcodeFormat } = await import('@zxing/browser');

        if (cancelled) return;

        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 200,
        });
        reader.possibleFormats = [
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.EAN_8,
          BarcodeFormat.EAN_13,
          BarcodeFormat.CODE_128,
        ];

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
          videoRef.current ?? undefined,
          (result, err) => {
            if (result) {
              const text = result.getText();
              if (BARCODE_REGEX.test(text)) {
                void lookupCode(text);
              }
            }
            // NotFoundException fires constantly while no barcode is visible —
            // ignore it and keep scanning.
            void err;
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setStatus('scanning');
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setErrorMessage(
          message.includes('Permission') || message.includes('NotAllowed')
            ? 'Camera permission denied. Enable camera access or enter the barcode manually.'
            : message.includes('NotFound') || message.includes('DevicesNotFound')
              ? 'No camera found on this device. Enter the barcode manually.'
              : 'Could not start the camera.'
        );
        setStatus('error');
        onStop();
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [scanning, lookupCode, stopCamera, onStop]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!BARCODE_REGEX.test(code)) {
      setErrorMessage('Barcode must be 8–14 digits.');
      setStatus('error');
      return;
    }
    void lookupCode(code);
  };

  return (
    <div className="space-y-4">
      {/* Viewfinder */}
      {scanning && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Targeting frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-1/3 border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>

          {(status === 'starting' || status === 'looking-up') && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm text-white font-medium">
                {status === 'starting' ? 'Starting camera…' : 'Looking up product…'}
              </p>
            </div>
          )}

          <button
            onClick={onStop}
            className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-black/60 text-white rounded-lg hover:bg-black/80"
          >
            Stop
          </button>
        </div>
      )}

      {!scanning && status !== 'looking-up' && (
        <button
          onClick={onStart}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          <Icons.Camera className="w-8 h-8" size={32} />
          <span className="text-sm font-medium">Scan a barcode</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Point your camera at a UPC or EAN code
          </span>
        </button>
      )}

      {/* Status messages */}
      {status === 'not-found' && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No product found for <span className="font-mono">{lastCode}</span>.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
            Try scanning again, or add the food manually.
          </p>
          {scanning && (
            <button
              onClick={() => {
                lookupInFlightRef.current = false;
                setStatus('scanning');
              }}
              className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300 underline"
            >
              Resume scanning
            </button>
          )}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Manual entry fallback */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label
          htmlFor="manual-barcode"
          className="block text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          Or enter the barcode manually
        </label>
        <div className="flex gap-2">
          <input
            id="manual-barcode"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g., 012000161155"
            maxLength={14}
            className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
          />
          <button
            type="submit"
            disabled={!BARCODE_REGEX.test(manualCode.trim())}
            className="px-4 py-2.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            Look up
          </button>
        </div>
      </form>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center leading-relaxed">
        Product data from OpenFoodFacts.
        <br />
        Camera frames never leave your device.
      </p>
    </div>
  );
}
