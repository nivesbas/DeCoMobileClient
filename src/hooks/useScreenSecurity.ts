import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

/**
 * Prevents screenshots and screen recording on sensitive screens.
 * Uses expo-screen-capture which sets FLAG_SECURE on Android
 * and prevents screen capture on iOS.
 */
export function useScreenSecurity(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    ScreenCapture.preventScreenCaptureAsync();

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [enabled]);
}
