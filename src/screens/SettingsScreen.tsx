import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking, BackHandler,
} from 'react-native';
import { useEffect } from 'react';
import Constants from 'expo-constants';
import { useAuth } from '../hooks/useAuth';
import { t, getLocale, setLocale } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useScreenSecurity } from '../hooks/useScreenSecurity';

type Locale = 'sr' | 'en';

interface Props {
  onBack: () => void;
  onDeleteAccount: () => void;
}

const PRIVACY_POLICY_URL = 'https://nivesbas.github.io/DeCoMobileClient/privacy-policy/';

export default function SettingsScreen({ onBack, onDeleteAccount }: Props) {
  useScreenSecurity();
  const { logout } = useAuth();
  const [locale, setCurrentLocale] = useState<Locale>(getLocale() as Locale);

  // Android back button → close settings, not the app
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => handler.remove();
  }, [onBack]);

  const toggleLocale = useCallback(async () => {
    const next: Locale = locale === 'sr' ? 'en' : 'sr';
    await setLocale(next);
    setCurrentLocale(next);
  }, [locale]);

  const handleLogout = () => {
    Alert.alert('', t('logout_confirm'), [
      { text: t('no'), style: 'cancel' },
      {
        text: t('yes'),
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const handleOpenPrivacy = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('', t('error_generic'));
    }
  };

  const handleCloseApp = () => {
    Alert.alert(t('close_app'), t('close_app_confirm'), [
      { text: t('no'), style: 'cancel' },
      { text: t('yes'), style: 'default', onPress: () => BackHandler.exitApp() },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '—';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>{'←'} {t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings_title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Language */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings_language')}</Text>
          <TouchableOpacity onPress={toggleLocale} style={styles.langToggle}>
            <Text style={[styles.langOption, locale === 'sr' && styles.langActive]}>SR</Text>
            <Text style={styles.langSep}>|</Text>
            <Text style={[styles.langOption, locale === 'en' && styles.langActive]}>EN</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy policy */}
        <TouchableOpacity style={styles.row} onPress={handleOpenPrivacy}>
          <Text style={styles.rowLabel}>{t('settings_privacy')}</Text>
          <Text style={styles.rowAction}>{t('settings_open')} ›</Text>
        </TouchableOpacity>

        {/* App version (read-only) */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings_version')}</Text>
          <Text style={styles.rowValue}>{appVersion}</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.row, styles.rowAccent]} onPress={handleLogout}>
          <Text style={[styles.rowLabel, { color: COLORS.primary }]}>{t('settings_logout')}</Text>
        </TouchableOpacity>

        {/* Close app — explicit exit for users who don't use Android back gesture */}
        <TouchableOpacity style={styles.row} onPress={handleCloseApp}>
          <Text style={[styles.rowLabel, { color: COLORS.primary }]}>{t('close_app')}</Text>
        </TouchableOpacity>

        {/* Delete account — danger zone */}
        <View style={styles.dangerBox}>
          <TouchableOpacity onPress={onDeleteAccount}>
            <Text style={styles.deleteLabel}>{t('settings_delete_account')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  rowAccent: {
    marginTop: SPACING.lg,
  },
  rowLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  rowValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
  },
  rowAction: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
  },
  langToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langOption: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.sm,
  },
  langActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  langSep: {
    color: COLORS.textMuted,
  },
  dangerBox: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  deleteLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: '600',
  },
});
