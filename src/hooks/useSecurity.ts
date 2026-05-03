import { useEffect, useRef, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

interface SecurityOptions {
  /** Called when the user has been inactive too long or app returns from background */
  onLock: () => void;
  /** Inactivity timeout in milliseconds (default: 5 minutes) */
  inactivityTimeoutMs?: number;
  /** Minimum background duration (ms) before requiring re-lock (default: 30 seconds) */
  backgroundLockThresholdMs?: number;
  /** Whether security monitoring is active */
  enabled?: boolean;
}

/**
 * Security hook that enforces:
 * 1. Inactivity timeout — locks session after N minutes without user interaction
 * 2. Background re-lock — requires biometric when app returns from background
 */
export function useSecurity({
  onLock,
  inactivityTimeoutMs = 5 * 60 * 1000, // 5 minutes
  backgroundLockThresholdMs = 30 * 1000, // 30 seconds
  enabled = true,
}: SecurityOptions) {
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backgroundTimestamp = useRef<number | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (!enabled) return;
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(onLock, inactivityTimeoutMs);
  }, [enabled, inactivityTimeoutMs, onLock]);

  // Inactivity timer — reset on user interaction
  useEffect(() => {
    if (!enabled) return;
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [enabled, resetInactivityTimer]);

  // AppState listener — lock on return from background
  useEffect(() => {
    if (!enabled) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimestamp.current = Date.now();
        // Clear inactivity timer while in background
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      } else if (nextState === 'active') {
        const elapsed = backgroundTimestamp.current
          ? Date.now() - backgroundTimestamp.current
          : 0;
        backgroundTimestamp.current = null;

        if (elapsed >= backgroundLockThresholdMs) {
          onLock();
        } else {
          // App returned quickly — restart inactivity timer
          resetInactivityTimer();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [enabled, backgroundLockThresholdMs, onLock, resetInactivityTimer]);

  return { resetInactivityTimer };
}
