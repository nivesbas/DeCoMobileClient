import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface Props {
  onOtpSent: (customerId: string, phoneNumber: string) => void;
}

export default function RegisterScreen({ onOtpSent }: Props) {
  const { register } = useAuth();
  const [customerId, setCustomerId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = customerId.length >= 5 && phoneNumber.length >= 8;

  const handleRegister = async () => {
    if (!isValid || loading) return;
    setLoading(true);

    try {
      const result = await register(customerId.trim(), phoneNumber.trim());
      if (result.otpSent) {
        onOtpSent(customerId.trim(), phoneNumber.trim());
      } else {
        Alert.alert('', result.message);
      }
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>DeCo</Text>
          <Text style={styles.title}>{t('register_title')}</Text>
          <Text style={styles.subtitle}>{t('register_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>{t('customer_id_label')}</Text>
          <TextInput
            style={styles.input}
            value={customerId}
            onChangeText={setCustomerId}
            placeholder={t('customer_id_placeholder')}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="number-pad"
            maxLength={20}
            autoFocus
          />

          <Text style={styles.label}>{t('phone_label')}</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={t('phone_placeholder')}
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            maxLength={20}
          />

          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={!isValid || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>{t('register_button')}</Text>
            )}
          </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
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
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  buttonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});
