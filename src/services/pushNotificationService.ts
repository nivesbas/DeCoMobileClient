import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api, ApiError } from './apiClient';
import { CONFIG } from '../constants/config';
import type { ApiResponse } from '../types/api';

// ── Wire types ─────────────────────────────────────────────────────────────

interface PushTokenUpsertRequest {
  // Historically an Expo push token (ExponentPushToken[...]). Since April 2026
  // this is a raw FCM (Android) / APNs (iOS) token — we moved off the Expo push
  // proxy after the permission wrapper proved unreliable on Android 14+/OneUI 7.
  // Field name is preserved for backend / DB compatibility.
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
 * One-shot: request OS permission, fetch the native device push token (FCM
 * on Android, APNs on iOS), POST it to the gateway so `gw.Client_Device_PushToken`
 * is populated. Idempotent — the backend SP is an UPSERT keyed on
 * (CID, CustomeryId, DeviceId), so calling this on every login / session
 * restore is safe.
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

    // Permission dance — request if we haven't yet. We log the actual status
    // values because Android 14+/OneUI 7 has been known to return non-standard
    // strings here; if you see "[Push] Permission check:" with a status that
    // isn't "granted"/"denied"/"undetermined", that's your hint.
    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    console.log('[Push] Permission check:', {
      status: existing.status,
      granted: existing.granted,
      canAskAgain: existing.canAskAgain,
    });

    if (existing.status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
      console.log('[Push] Permission after request:', {
        status: requested.status,
        granted: requested.granted,
      });
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permission not granted — skipping token registration.');
      return null;
    }

    // Ask the OS for the raw device push token. On Android this is the FCM
    // registration token; on iOS it's the APNs device token. We send it
    // straight to our backend which uses the Firebase Admin SDK (Android) /
    // APNs (iOS, later) to deliver.
    //
    // We bypass getExpoPushTokenAsync() deliberately — that call routes
    // through exp.host's proxy and has additional permission-detection quirks
    // on Samsung devices. Raw device tokens are more reliable.
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const expoPushToken = tokenData.data;

    if (!expoPushToken) {
      console.warn('[Push] getDevicePushTokenAsync returned empty token.');
      return null;
    }

    console.log('[Push] Got device push token', {
      type: tokenData.type,
      preview: typeof expoPushToken === 'string' ? expoPushToken.slice(0, 20) + '...' : '(non-string)',
    });

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
