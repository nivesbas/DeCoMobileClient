import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface Props {
  onSuccess: () => void;
  onFallback: () => void; // "Use PIN" or re-login
  customerName?: string;
}

export default function BiometricLockScreen({ onSuccess, onFallback, customerName }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('biometrics');

  useEffect(() => {
    checkAndAuthenticate();
  }, []);

  async function checkAndAuthenticate() {
    setLoading(true);
    setError(null);

    try {
      // Check hardware support
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        // No biometric hardware — skip to app
        onSuccess();
        return;
      }

      // Check if enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        // Biometrics available but not set up — skip to app
        onSuccess();
        return;
      }

      // Determine biometric type for display
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('otisak prsta');
      }

      // Prompt biometric
      await authenticate();
    } catch {
      setError('Greška pri proveri biometrije');
    } finally {
      setLoading(false);
    }
  }

  async function authenticate() {
    setError(null);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Prijavite se u DeCo',
      cancelLabel: 'Odustani',
      disableDeviceFallback: false,
      fallbackLabel: 'Unesite PIN',
    });

    if (result.success) {
      onSuccess();
    } else if (result.error === 'user_cancel') {
      setError('Autentifikacija otkazana');
    } else if (result.error === 'user_fallback') {
      onFallback();
    } else {
      setError('Autentifikacija nije uspela. Pokušajte ponovo.');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Lock icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.title}>DeCo</Text>
        {customerName && (
          <Text style={styles.subtitle}>Dobrodošli nazad</Text>
        )}

        <Text style={styles.description}>
          Koristite {biometricType} za pristup aplikaciji
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={authenticate}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            Pokušajte ponovo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onFallback}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>
            Prijavite se ponovo
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lockIcon: {
    fontSize: 44,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
});
