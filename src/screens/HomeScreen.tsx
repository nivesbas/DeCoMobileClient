import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { getDebtSummary } from '../services/debtService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { DebtSummary, DebtItem } from '../types/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation';

interface Props {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Home'>;
}

export default function HomeScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [data, setData] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDebts = useCallback(async () => {
    try {
      const summary = await getDebtSummary();
      setData(summary);
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDebts();
    }, [fetchDebts]),
  );

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logout_confirm'), [
      { text: t('no'), style: 'cancel' },
      { text: t('yes'), style: 'destructive', onPress: logout },
    ]);
  };

  const formatAmount = (amount: number, currency: string) =>
    `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency}`;

  const renderDebtItem = ({ item }: { item: DebtItem }) => (
    <TouchableOpacity
      style={styles.debtCard}
      onPress={() => navigation.navigate('DebtDetail', { loanId: item.loanId })}
      activeOpacity={0.7}
    >
      <View style={styles.debtCardHeader}>
        <Text style={styles.productName}>{item.productName}</Text>
        <View style={[
          styles.dpdBadge,
          item.daysPastDue > 90 ? styles.dpdHigh :
          item.daysPastDue > 30 ? styles.dpdMedium :
          styles.dpdLow,
        ]}>
          <Text style={styles.dpdText}>{item.daysPastDue} DPD</Text>
        </View>
      </View>

      <View style={styles.debtAmounts}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('debt_outstanding')}</Text>
          <Text style={styles.amountValue}>
            {formatAmount(item.outstandingAmount, item.currency)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>{t('debt_due')}</Text>
          <Text style={[styles.amountValue, styles.dueAmount]}>
            {formatAmount(item.dueAmount, item.currency)}
          </Text>
        </View>
      </View>

      {item.nextDueDate && (
        <Text style={styles.nextDue}>
          Sledeće dospeće: {new Date(item.nextDueDate).toLocaleDateString('sr-Latn')}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('home_title')}</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Total summary */}
      {data && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('home_total')}</Text>
          <Text style={styles.summaryAmount}>
            {formatAmount(data.totalOutstanding, data.currency)}
          </Text>
          {data.lastPaymentDate && (
            <Text style={styles.summaryMeta}>
              {t('home_last_payment')}: {new Date(data.lastPaymentDate).toLocaleDateString('sr-Latn')}
            </Text>
          )}
        </View>
      )}

      {/* Debt list */}
      <FlatList
        data={data?.debts ?? []}
        keyExtractor={item => item.loanId}
        renderItem={renderDebtItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchDebts(); }}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('home_no_debts')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  logoutText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnPrimary,
    opacity: 0.8,
  },
  summaryCard: {
    backgroundColor: COLORS.primaryDark,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnPrimary,
    opacity: 0.7,
  },
  summaryAmount: {
    fontSize: FONT_SIZES.title,
    fontWeight: '800',
    color: COLORS.textOnPrimary,
    marginTop: SPACING.xs,
  },
  summaryMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textOnPrimary,
    opacity: 0.6,
    marginTop: SPACING.sm,
  },
  list: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  debtCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  debtCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  dpdBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  dpdLow: { backgroundColor: '#E8F5E9' },
  dpdMedium: { backgroundColor: '#FFF3E0' },
  dpdHigh: { backgroundColor: '#FFEBEE' },
  dpdText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  debtAmounts: {
    gap: SPACING.sm,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  dueAmount: {
    color: COLORS.error,
  },
  nextDue: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.xxl,
  },
});
