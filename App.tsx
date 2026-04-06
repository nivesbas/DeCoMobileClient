import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/hooks/useAuth';
import MainNavigator from './src/navigation';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import { COLORS } from './src/constants/theme';

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [authStep, setAuthStep] = useState<'register' | 'otp'>('register');
  const [pendingCustomerId, setPendingCustomerId] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authStep === 'otp') {
      return (
        <OtpScreen
          customerId={pendingCustomerId}
          phoneNumber={pendingPhone}
          onBack={() => setAuthStep('register')}
        />
      );
    }

    return (
      <RegisterScreen
        onOtpSent={(customerId, phone) => {
          setPendingCustomerId(customerId);
          setPendingPhone(phone);
          setAuthStep('otp');
        }}
      />
    );
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
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
