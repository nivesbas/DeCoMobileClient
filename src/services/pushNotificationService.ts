import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api, ApiError } from './apiClient';
import { CONFIG } from '../constants/config';
import type { ApiResponse } from '../types/api';

// ── Wire types ─────────────────────────────────────────────────────────────

interface PushTokenUpsertRequest {
  expoPushToken: string;
  platform: 'ios' | 'android';
  appVersion?: string;
}

interface PushTokenUpsertResponse {
  success: boolean;
  error?: string;
}

// ── Foreground presentation ────────────────────────────────────────────────
//
// We tell expo-notifications to actually show the banner + play a sound when
// a notification arrives while the app is open. Without this, push messages
// arrive silently and only the tap handler fires — poor UX for PtpReminder
// and MessageReceived, which users should see immediately.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * One-shot: request OS permission, fetch the Expo push token, POST it to the
 * gateway so `gw.Client_Device_PushToken` is populated. Idempotent — the
 * backend SP is an UPSERT keyed on (CID, CustomeryId, DeviceId), so calling
 * this on every login / session restore is safe.
 *
 * Returns the token on success, null on any failure (permission denied,
 * simulator, network error). Never throws — push is best-effort and must not
 * block the login flow.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[Push] Skipping registration — not a physical device.');
      return null;
    }

    // Android 8+ requires a notification channel before notifications render.
    // We set it up eagerly so the very first push has the right importance.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'DeCo obaveštenja',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted — skipping token registration.');
      return null;
    }

    // projectId is required for Expo's token service on SDK 49+. It comes
    // from app.json → extra.eas.projectId at build time.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    if (!projectId) {
      console.warn('[Push] No EAS projectId configured — cannot fetch Expo push token.');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data;

    if (!expoPushToken) {
      console.warn('[Push] getExpoPushTokenAsync returned empty token.');
      return null;
    }

    const platform = (Platform.OS === 'ios' ? 'ios' : 'android') as 'ios' | 'android';

    const body: PushTokenUpsertRequest = {
      expoPushToken,
      platform,
      appVersion: CONFIG.APP_VERSION,
    };

    const response = await api.post<ApiResponse<PushTokenUpsertResponse>>(
      '/device/push-token',
      body,
    );

    if (!response?.success || !response.data?.success) {
      console.warn(
        '[Push] Backend refused token registration:',
        response?.message ?? response?.data?.error ?? 'unknown',
      );
      return null;
    }

    console.log('[Push] Registered token for', platform);
    return expoPushToken;
  } catch (err) {
    // Network/auth errors must not break login. We log and move on; the app
    // will try again on next launch.
    if (err instanceof ApiError) {
      console.warn('[Push] API error during registration:', err.statusCode, err.message);
    } else {
      console.warn('[Push] Unexpected error during registration:', err);
    }
    return null;
  }
}

/**
 * Wire foreground + background tap handlers. Returns a cleanup function to
 * remove both subscriptions — call it from the effect in App.tsx.
 *
 * <para>
 * Phase 3A parks the tap handler on a simple console log; Phase 3B will
 * route `response.notification.request.content.data.type` + `lid` to the
 * right screen (DebtDetail / PaymentPlan / Messages / Promise).
 * </para>
 */
export function setupNotificationHandlers(
  onTap?: (data: Record<string, unknown>) => void,
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    console.log(
      '[Push] Received foreground:',
      notification.request.content.title,
      notification.request.content.data,
    );
  });

  const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data ?? {};
    console.log('[Push] Tapped notification with data:', data);
    if (onTap) {
      try {
        onTap(data as Record<string, unknown>);
      } catch (err) {
        console.warn('[Push] onTap handler threw:', err);
      }
    }
  });

  return () => {
    receivedSub.remove();
    tapSub.remove();
  };
}
