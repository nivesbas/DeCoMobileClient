import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView, BackHandler,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useScreenSecurity } from '../hooks/useScreenSecurity';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

/**
 * Step-up confirmation: user must re-type their phone number to confirm
 * deletion. Validation is local-only — server reads the customerId from
 * the JWT, not from this input. This is a deliberate friction step, not
 * a security control.
 */
export default function DeleteAccountScreen({ onBack, onSuccess }: Props) {
  useScreenSecurity();
  const { phoneNumber, deleteAccount } = useAuth();
  const [confirmPhone, setConfirmPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Android back gesture → cancel and go back
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!submitting) onBack();
      return true;
    });
    return () => handler.remove();
  }, [onBack, submitting]);

  // Match by stripping all non-digit chars on both sides — phone format on
  // file may include +381, spaces, or dashes that the user wouldn't retype.
  const normalize = (s: string) => s.replace(/\D/g, '');
  const phoneMatches =
    !!phoneNumber && normalize(confirmPhone).length > 0 &&
    normalize(confirmPhone) === normalize(phoneNumber);

  const handleDelete = async () => {
    if (!phoneMatches || submitting) return;

    setSubmitting(true);
    try {
      await deleteAccount();
      Alert.alert(
        t('delete_account_success_title'),
        t('delete_account_success_message'),
        [{ text: 'OK', onPress: onSuccess }],
        { cancelable: false },
      );
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('', err?.message ?? t('delete_account_error'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} disabled={submitting}>
          <Text style={[styles.backText, submitting && styles.disabledText]}>
            {'←'} {t('back')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('delete_account_title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t('delete_account_warning')}</Text>
        </View>

        <Text style={styles.explainer}>{t('delete_account_explainer')}</Text>

        <Text style={styles.label}>{t('delete_account_confirm_label')}</Text>
        <TextInput
          style={styles.input}
          value={confirmPhone}
          onChangeText={setConfirmPhone}
          placeholder={t('delete_account_confirm_placeholder')}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!submitting}
        />

        {confirmPhone.length > 0 && !phoneMatches && (
          <Text style={styles.mismatchText}>{t('delete_account_phone_mismatch')}</Text>
        )}

        <TouchableOpacity
          style={[
            styles.deleteButton,
            (!phoneMatches || submitting) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={!phoneMatches || submitting}
        >
          {submitting ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>
                {' '}{t('delete_account_button_loading')}
              </Text>
            </View>
          ) : (
            <Text style={styles.deleteButtonText}>{t('delete_account_button')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} disabled={submitting} style={styles.cancelLink}>
          <Text style={[styles.cancelText, submitting && styles.disabledText]}>
            {t('cancel')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    paddingTop: 56,
    backgroundColor: COLORS.primary,
  },
  backText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textOnPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  scroll: {
    padding: SPACING.lg,
  },
  warningBox: {
    backgroundColor: '#FFF1F1',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.lg,
  },
  warningText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
  explainer: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  mismatchText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  deleteButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelLink: {
    marginTop: SPACING.lg,
    alignItems: 'center',
    padding: SPACING.sm,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
});
