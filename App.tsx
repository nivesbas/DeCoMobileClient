import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
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
import { COLORS } from './src/constants/theme';

type Screen =
  | { name: 'register' }
  | { name: 'otp'; customerId: string; phoneNumber: string }
  | { name: 'home' }
  | { name: 'debtDetail'; loanId: string }
  | { name: 'messages' }
  | { name: 'promise'; loanId?: string }
  | { name: 'paymentPlan'; lid: number }
  | { name: 'paymentQr'; loanId: string };

function AppContent() {
  const { isLoading, isAuthenticated, isRestoredSession, logout, customerId } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'register' });

  // Load remote translations on app start
  useEffect(() => { initTranslations('sr'); }, []);
  const [history, setHistory] = useState<Screen[]>([]);
  const [biometricVerified, setBiometricVerified] = useState(false);

  // Wire foreground + background notification handlers once, at app start.
  // Tap payloads land in `setScreen` via the `type`/`lid` fields the backend
  // emits from ClientNotificationDispatcher (Phase 3B will map more triggers;
  // for now PtpReminder → DebtDetail is a reasonable landing).
  useEffect(() => {
    return setupNotificationHandlers((data) => {
      const type = typeof data?.type === 'string' ? data.type : null;
      const lid = typeof data?.lid === 'number' ? data.lid : null;

      if (type === 'MessageReceived') {
        setScreen({ name: 'messages' });
      } else if (type === 'PtpReminder' || type === 'DueInstallmentReminder') {
        if (lid !== null) {
          setScreen({ name: 'debtDetail', loanId: String(lid) });
        }
      } else if (type === 'PaymentPlanReminder') {
        if (lid !== null) {
          setScreen({ name: 'paymentPlan', lid });
        }
      }
      // Unknown trigger types fall through — the home screen is the safe default.
    });
  }, []);

  const navigate = (next: Screen) => {
    setHistory(prev => [...prev, screen]);
    setScreen(next);
  };

  const goBack = () => {
    setHistory(prev => {
      const copy = [...prev];
      const last = copy.pop();
      if (last) setScreen(last);
      return copy;
    });
  };

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

  // ── Authenticated screens ─────────────────────────────────────
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

  // Default: Home
  return (
    <HomeScreen
      onNavigate={(name: string, params?: any) => {
        const screenMap: Record<string, Screen> = {
          DebtDetail: { name: 'debtDetail', loanId: params?.loanId },
          Promise: { name: 'promise', loanId: params?.loanId },
          Messages: { name: 'messages' },
          PaymentPlan: { name: 'paymentPlan', lid: params?.lid },
        };
        navigate(screenMap[name] ?? { name: 'home' });
      }}
    />
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
