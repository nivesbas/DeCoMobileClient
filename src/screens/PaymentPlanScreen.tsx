import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getPaymentPlan } from '../services/paymentPlanService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { PaymentPlan, PaymentPlanInstallment } from '../types/api';

interface Props {
  lid: number;
  onBack: () => void;
}

const STATUS_CONFIG: Record<number, { label: () => string; color: string; bg: string }> = {
  0: { label: () => t('pp_status_pending'),    color: '#E65100', bg: '#FFF3E0' },
  1: { label: () => t('pp_status_kept'),       color: '#2E7D32', bg: '#E8F5E9' },
  2: { label: () => t('pp_status_broken'),     color: '#C62828', bg: '#FFEBEE' },
  3: { label: () => t('pp_status_terminated'), color: '#616161', bg: '#F5F5F5' },
};

export default function PaymentPlanScreen({ lid, onBack }: Props) {
  const [plan, setPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getPaymentPlan(lid);
        setPlan(result);
      } catch (err: any) {
        setError(err.message ?? t('error_generic'));
      } finally {
        setLoading(false);
      }
    })();
  }, [lid]);

  const formatAmount = (amount: number, currency: string) =>
    `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency}`;

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatShortDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isPastDue = (dateStr: string, status: number): boolean => {
    if (status !== 0) return false;
    return new Date(dateStr) < new Date();
  };

  const totalAmount = plan?.installments.reduce((sum, i) => sum + i.promiseValue, 0) ?? 0;
  const currency = plan?.installments[0]?.currency ?? '';

  const renderInstallment = ({ item, index }: { item: PaymentPlanInstallment; index: number }) => {
    const config = STATUS_CONFIG[item.idPromiseStatus] ?? STATUS_CONFIG[0];
    const overdue = isPastDue(item.promiseDate, item.idPromiseStatus);

    return (
      <View style={[styles.installmentRow, overdue && styles.installmentOverdue]}>
        <View style={styles.installmentLeft}>
          <Text style={styles.installmentIndex}>{index + 1}.</Text>
          <View>
            <Text style={styles.installmentDate}>{formatShortDate(item.promiseDate)}</Text>
            {overdue && <Text style={styles.overdueLabel}>{t('pp_status_broken')}</Text>}
          </View>
        </View>
        <Text style={styles.installmentAmount}>
          {formatAmount(item.promiseValue, item.currency)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
          <Text style={[styles.statusText, { color: config.color }]}>{config.label()}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? t('pp_no_plan')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.headerBack}>{'‹ ' + t('back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pp_title')}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Plan summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryProduct}>{plan.productName}</Text>
        <Text style={styles.summaryLoan}>{plan.loan}</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('pp_period')}</Text>
          <Text style={styles.summaryValue}>
            {formatShortDate(plan.startDate)} — {formatShortDate(plan.endDate)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('pp_total')}</Text>
          <Text style={styles.summaryValue}>{plan.installments.length}</Text>
        </View>

        <View style={[styles.summaryRow, styles.summaryTotalRow]}>
          <Text style={styles.summaryTotalLabel}>{t('home_total')}</Text>
          <Text style={styles.summaryTotalValue}>{formatAmount(totalAmount, currency)}</Text>
        </View>
      </View>

      {/* Installments list */}
      <FlatList
        data={plan.installments}
        keyExtractor={item => item.idPaymentPlanDetail.toString()}
        renderItem={renderInstallment}
        contentContainerStyle={styles.list}
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
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  headerBack: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textOnPrimary,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryProduct: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  summaryLoan: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  summaryTotalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  installmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    marginBottom: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  installmentOverdue: {
    borderLeftWidth: 3,
    borderLeftColor: '#C62828',
  },
  installmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentIndex: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    width: 28,
    fontWeight: '600',
  },
  installmentDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  overdueLabel: {
    fontSize: FONT_SIZES.xs,
    color: '#C62828',
    marginTop: 1,
  },
  installmentAmount: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginRight: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  backButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});
