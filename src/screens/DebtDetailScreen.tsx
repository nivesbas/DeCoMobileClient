import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { getDebtDetail } from '../services/debtService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { DebtDetail } from '../types/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation';

type Props = NativeStackScreenProps<MainStackParamList, 'DebtDetail'>;

export default function DebtDetailScreen({ route }: Props) {
  const { loanId } = route.params;
  const [data, setData] = useState<DebtDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const detail = await getDebtDetail(loanId);
        setData(detail);
      } catch (error: any) {
        Alert.alert('', error.message ?? t('error_generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [loanId]);

  const formatAmount = (amount: number, currency: string) =>
    `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency}`;

  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString('sr-Latn') : '—';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.productName}>{data.productName}</Text>
        <Text style={styles.loanId}>ID: {data.loanId}</Text>
      </View>

      {/* Amounts */}
      <View style={styles.card}>
        <InfoRow label={t('debt_original')} value={formatAmount(data.originalAmount, data.currency)} />
        <InfoRow label={t('debt_outstanding')} value={formatAmount(data.outstandingAmount, data.currency)} bold />
        <InfoRow
          label={t('debt_due')}
          value={formatAmount(data.dueAmount, data.currency)}
          valueColor={COLORS.error}
          bold
        />
        <InfoRow label={t('debt_dpd')} value={String(data.daysPastDue)} />
      </View>

      {/* Dates */}
      <View style={styles.card}>
        <InfoRow label={t('debt_contract_date')} value={formatDate(data.contractDate)} />
        <InfoRow label={t('debt_maturity_date')} value={formatDate(data.maturityDate)} />
      </View>

      {/* Payments */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('debt_payments')}</Text>
        {data.recentPayments.length === 0 ? (
          <Text style={styles.emptyText}>{t('debt_no_payments')}</Text>
        ) : (
          data.recentPayments.map((payment, i) => (
            <View key={i} style={[styles.paymentRow, i > 0 && styles.paymentDivider]}>
              <Text style={styles.paymentDate}>{formatDate(payment.paymentDate)}</Text>
              <Text style={styles.paymentAmount}>
                {formatAmount(payment.amount, payment.currency)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value, valueColor, bold }: {
  label: string; value: string; valueColor?: string; bold?: boolean;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[
        rowStyles.value,
        bold && rowStyles.bold,
        valueColor ? { color: valueColor } : undefined,
      ]}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  bold: {
    fontWeight: '700',
  },
});

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
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  productName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  loanId: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textOnPrimary,
    opacity: 0.7,
    marginTop: SPACING.xs,
  },
  card: {
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
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  paymentDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  paymentDate: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  paymentAmount: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.success,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontStyle: 'italic',
  },
});
