import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface Props {
  customerId: string;
  phoneNumber: string;
  onBack: () => void;
}

export default function OtpScreen({ customerId, phoneNumber, onBack }: Props) {
  const { verifyOtp, register } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const maskedPhone = phoneNumber.length > 4
    ? '***' + phoneNumber.slice(-4)
    : phoneNumber;

  const handleVerify = async () => {
    if (code.length !== 6 || loading) return;
    setLoading(true);

    try {
      const result = await verifyOtp(customerId, code);
      if (!result.success) {
        Alert.alert('', result.message);
        setCode('');
        if (result.deviceBlocked) {
          onBack();
        }
      }
      // On success, AuthProvider updates state → navigation changes automatically
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await register(customerId, phoneNumber);
      setCountdown(300);
      setCanResend(false);
      setCode('');
      Alert.alert('', 'Novi kod je poslat.');
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Nazad</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{t('otp_title')}</Text>
          <Text style={styles.subtitle}>
            {t('otp_subtitle')} {maskedPhone}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            ref={inputRef}
            style={styles.otpInput}
            value={code}
            onChangeText={text => {
              const digits = text.replace(/\D/g, '').slice(0, 6);
              setCode(digits);
            }}
            placeholder={t('otp_placeholder')}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          {countdown > 0 && (
            <Text style={styles.timer}>
              {t('otp_expires_in')} {formatTime(countdown)}
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, code.length !== 6 && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={code.length !== 6 || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t('otp_verify_button')}</Text>
            )}
          </TouchableOpacity>

          {canResend && (
            <TouchableOpacity style={styles.resendButton} onPress={handleResend}>
              <Text style={styles.resendText}>{t('otp_resend')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: SPACING.lg,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  otpInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
    letterSpacing: 12,
  },
  timer: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  buttonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  resendText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
