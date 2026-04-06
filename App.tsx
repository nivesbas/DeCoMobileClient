import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import HomeScreen from './src/screens/HomeScreen';
import DebtDetailScreen from './src/screens/DebtDetailScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import BiometricLockScreen from './src/screens/BiometricLockScreen';
import { COLORS } from './src/constants/theme';

type Screen =
  | { name: 'register' }
  | { name: 'otp'; customerId: string; phoneNumber: string }
  | { name: 'home' }
  | { name: 'debtDetail'; loanId: string }
  | { name: 'messages' };

function AppContent() {
  const { isLoading, isAuthenticated, isRestoredSession, logout, customerId } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: 'register' });
  const [history, setHistory] = useState<Screen[]>([]);
  const [biometricVerified, setBiometricVerified] = useState(false);

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

  // Default: Home
  return (
    <HomeScreen
      onNavigate={(name: string, params?: any) =>
        navigate(
          name === 'DebtDetail'
            ? { name: 'debtDetail', loanId: params.loanId }
            : { name: 'messages' },
        )
      }
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
