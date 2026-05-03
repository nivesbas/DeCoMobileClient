import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import { useSecurity } from './src/hooks/useSecurity';
import { initTranslations } from './src/i18n/translations';
import { setupNotificationHandlers } from './src/services/pushNotificationService';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import HomeScreen from './src/screens/HomeScreen';
import DebtDetailScreen from './src/screens/DebtDetailScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import PromiseScreen from './src/screens/PromiseScreen';
import PaymentPlanScreen from './src/screens/PaymentPlanScreen';
import PaymentQrScreen from './src/screens/PaymentQrScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';
import { COLORS } from './src/constants/theme';

type Screen =
  | { name: 'register' }
  | { name: 'otp'; customerId: string; phoneNumber: string }
  | { name: 'home' }
  | { name: 'debtDetail'; loanId: string }
  | { name: 'messages' }
  | { name: 'promise'; loanId?: string }
  | { name: 'paymentPlan'; lid: number }
  | { name: 'paymentQr'; loanId: string }
  | { name: 'settings' }
  | { name: 'deleteAccount' };

function AppContent() {
  const { isLoading, isAuthenticated, isRestoredSession, logout, customerId } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'register' });
  const [biometricVerified, setBiometricVerified] = useState(false);
  // Idle/background lock — separate from `biometricVerified` so the
  // restored-session boot gate stays a one-shot. When the inactivity timer
  // fires or the app returns from a long background, we flip this and the
  // BiometricLockScreen takes over until the user re-authenticates.
  const [securityLocked, setSecurityLocked] = useState(false);

  // History lives in a ref — it never needs to trigger a re-render. Keeping it
  // out of state also lets navigate/goBack stay pure (no setState-in-updater).
  const historyRef = useRef<Screen[]>([]);
  const screenRef = useRef<Screen>(screen);
  screenRef.current = screen;

  // Load remote translations on app start
  useEffect(() => { initTranslations('sr'); }, []);

  const handleSecurityLock = useCallback(() => {
    setSecurityLocked(true);
  }, []);

  // Inactivity timeout (5 min) + background re-lock (30 s). Only armed once
  // the user is fully past auth + restored-session biometric — otherwise the
  // boot biometric screen would itself be locked behind a lock screen.
  const securityArmed = isAuthenticated && (!isRestoredSession || biometricVerified);
  const { resetInactivityTimer } = useSecurity({
    onLock: handleSecurityLock,
    enabled: securityArmed && !securityLocked,
  });

  const navigate = (next: Screen) => {
    historyRef.current.push(screenRef.current);
    setScreen(next);
  };

  const goBack = () => {
    const last = historyRef.current.pop();
    setScreen(last ?? { name: 'home' });
  };

  // Wire foreground + background notification handlers once, at app start.
  // Tap payloads route through `navigate()` so history stays consistent and
  // the back arrow always has somewhere to return to.
  useEffect(() => {
    return setupNotificationHandlers((data) => {
      const type = typeof data?.type === 'string' ? data.type : null;
      const lid = typeof data?.lid === 'number' ? data.lid : null;

      if (type === 'MessageReceived') {
        navigate({ name: 'messages' });
      } else if (type === 'PtpReminder' || type === 'DueInstallmentReminder') {
        if (lid !== null) {
          navigate({ name: 'debtDetail', loanId: String(lid) });
        }
      } else if (type === 'PaymentPlanReminder') {
        if (lid !== null) {
          navigate({ name: 'paymentPlan', lid });
        }
      }
      // Unknown trigger types fall through — the home screen is the safe default.
    });
    // navigate reads from refs, safe to pin deps empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Auth screens ──────────────────────────────────────────────
  if (!isAuthenticated) {
    if (screen.name === 'otp') {
      return (
        <OtpScreen
          customerId={screen.customerId}
          phoneNumber={screen.phoneNumber}
          onBack={() => setScreen({ name: 'register' })}
        />
      );
    }

    return (
      <RegisterScreen
        onOtpSent={(customerId, phone) =>
          setScreen({ name: 'otp', customerId, phoneNumber: phone })
        }
      />
    );
  }

  // ── Biometric lock (only on re-open with restored session, not after fresh OTP) ───
  if (isRestoredSession && !biometricVerified) {
    return (
      <BiometricLockScreen
        onSuccess={() => setBiometricVerified(true)}
        onFallback={async () => {
          // User chose "Prijavite se ponovo" → clear session, show Register
          await logout();
          setBiometricVerified(false);
          setScreen({ name: 'register' });
        }}
        customerName={customerId ?? undefined}
      />
    );
  }

  // ── Idle / background re-lock ────────────────────────────────
  // Triggered by useSecurity when the inactivity timer fires or the app
  // returns from a long background. Sits on top of the authenticated state —
  // success just clears the gate, fallback drops the session entirely.
  if (securityLocked) {
    return (
      <BiometricLockScreen
        onSuccess={() => setSecurityLocked(false)}
        onFallback={async () => {
          await logout();
          setSecurityLocked(false);
          setBiometricVerified(false);
          historyRef.current = [];
          setScreen({ name: 'register' });
        }}
        customerName={customerId ?? undefined}
      />
    );
  }

  // ── Authenticated screens ─────────────────────────────────────
  // Wrap in a single touch-listening View so any user interaction resets the
  // inactivity timer. onTouchStart bubbles from every ScrollView/Pressable
  // descendant — a tap or a swipe anywhere counts as "still in use."
  const renderAuthenticatedScreen = (): React.ReactNode => {
    if (screen.name === 'debtDetail') {
      return (
        <DebtDetailScreen
          loanId={screen.loanId}
          onBack={goBack}
          onPay={(loanId) => navigate({ name: 'paymentQr', loanId })}
        />
      );
    }

    if (screen.name === 'paymentQr') {
      return (
        <PaymentQrScreen
          loanId={screen.loanId}
          onBack={goBack}
        />
      );
    }

    if (screen.name === 'messages') {
      return (
        <MessagesScreen
          onBack={goBack}
        />
      );
    }

    if (screen.name === 'promise') {
      return (
        <PromiseScreen
          onBack={goBack}
          onSuccess={() => setScreen({ name: 'home' })}
          preselectedLoanId={screen.loanId}
        />
      );
    }

    if (screen.name === 'paymentPlan') {
      return (
        <PaymentPlanScreen
          lid={screen.lid}
          onBack={goBack}
        />
      );
    }

    if (screen.name === 'settings') {
      return (
        <SettingsScreen
          onBack={goBack}
          onDeleteAccount={() => navigate({ name: 'deleteAccount' })}
        />
      );
    }

    if (screen.name === 'deleteAccount') {
      return (
        <DeleteAccountScreen
          onBack={goBack}
          // After successful deletion the auth state has already been cleared in
          // the deleteAccount() callback in useAuth — auth redirect will surface
          // RegisterScreen on the next render. We still reset history + screen
          // so an Android back press can't surface the deleted-account state.
          onSuccess={() => {
            historyRef.current = [];
            setScreen({ name: 'register' });
          }}
        />
      );
    }

    // Default: Home
    return (
      <HomeScreen
        onNavigate={(name: string, params?: any) => {
          const screenMap: Record<string, Screen> = {
            DebtDetail: { name: 'debtDetail', loanId: params?.loanId },
            Promise: { name: 'promise', loanId: params?.loanId },
            Messages: { name: 'messages' },
            PaymentPlan: { name: 'paymentPlan', lid: params?.lid },
            Settings: { name: 'settings' },
          };
          navigate(screenMap[name] ?? { name: 'home' });
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1 }} onTouchStart={resetInactivityTimer}>
      {renderAuthenticatedScreen()}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
