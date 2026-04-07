import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, BackHandler, Image,
} from 'react-native';
import { getDebtSummary } from '../services/debtService';
import { checkPromiseEligibility } from '../services/promiseService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { DebtSummary, DebtItem, PtpLoanEligibility } from '../types/api';

interface Props {
  onNavigate: (screen: string, params?: any) => void;
}

export default function HomeScreen({ onNavigate }: Props) {
  const [data, setData] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PTP eligibility per loan (keyed by loan identifier)
  const [ptpByLoan, setPtpByLoan] = useState<Map<string, PtpLoanEligibility>>(new Map());

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // Fetch debt summary and PTP eligibility in parallel
      const [summary, eligibility] = await Promise.all([
        getDebtSummary(),
        checkPromiseEligibility().catch(() => null), // graceful: don't block home if PTP fails
      ]);

      setData(summary);

      if (eligibility?.loans) {
        const map = new Map<string, PtpLoanEligibility>();
        for (const loan of eligibility.loans) {
          map.set(loan.loan, loan);
        }
        setPtpByLoan(map);
      }
    } catch (err: any) {
      const msg = err.message ?? t('error_generic');
      console.error('[HomeScreen] Failed to load:', msg, err.statusCode);
      setError(msg);
      Alert.alert(t('error_generic'), msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Block Android back gesture on home screen — exit app instead
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCloseApp();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleCloseApp = () => {
    Alert.alert(t('close_app'), t('close_app_confirm'), [
      { text: t('no'), style: 'cancel' },
      { text: t('yes'), style: 'default', onPress: () => BackHandler.exitApp() },
    ]);
  };

  const formatAmount = (amount: number, currency: string) =>
    `${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} ${currency}`;

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Check if there are any eligible loans for the global PTP button
  const hasEligibleLoans = useMemo(() => {
    for (const loan of ptpByLoan.values()) {
      if (loan.eligible) return true;
    }
    return false;
  }, [ptpByLoan]);

  const getBlockedReason = (reason?: string): string => {
    switch (reason) {
      case 'HAS_PAYMENT_PLAN':  return t('ptp_reason_payment_plan');
      case 'HAS_ACTIVE_PROMISE': return t('ptp_reason_active_promise');
      case 'COOLDOWN_ACTIVE':   return t('ptp_reason_cooldown');
      case 'TOO_MANY_BROKEN':   return t('ptp_reason_broken');
      case 'LEGAL_CASE_ACTIVE': return t('ptp_reason_legal');
      default:                  return t('ptp_reason_generic');
    }
  };

  const renderDebtItem = ({ item }: { item: DebtItem }) => {
    const ptp = ptpByLoan.get(item.loanId);
    const hasActivePromise = ptp?.hasActivePromise && ptp.activePromiseDate;
    const isEligible = ptp?.eligible;
    const isBlocked = ptp && !isEligible && !hasActivePromise;

    return (
      <TouchableOpacity
        style={styles.debtCard}
        onPress={() => onNavigate('DebtDetail', { loanId: item.loanId })}
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
            {t('debt_next_due')}: {new Date(item.nextDueDate).toLocaleDateString('sr-Latn')}
          </Text>
        )}

        {/* Active promise banner */}
        {hasActivePromise && (
          <View style={styles.promiseBanner}>
            <View style={styles.promiseBannerIcon}>
              <Text style={styles.promiseBannerIconText}>✓</Text>
            </View>
            <View style={styles.promiseBannerContent}>
              <Text style={styles.promiseBannerTitle}>
                {t('ptp_home_banner')}
              </Text>
              <Text style={styles.promiseBannerDetail}>
                {formatAmount(ptp.activePromiseValue!, ptp.activePromiseCurr ?? item.currency)} — {t('ptp_confirm_by')} {formatDate(ptp.activePromiseDate!)}
              </Text>
            </View>
          </View>
        )}

        {/* PTP button — always visible when no active promise banner */}
        {!hasActivePromise && item.dueAmount > 0 && (
          <View>
            <TouchableOpacity
              style={[styles.cardPtpButton, isBlocked && styles.cardPtpButtonDisabled]}
              onPress={() => onNavigate('Promise', { loanId: item.loanId })}
              activeOpacity={0.7}
              disabled={!!isBlocked}
            >
              <Text style={[styles.cardPtpIcon, isBlocked && styles.cardPtpIconDisabled]}>🤝</Text>
              <Text style={[styles.cardPtpText, isBlocked && styles.cardPtpTextDisabled]}>{t('ptp_button')}</Text>
            </TouchableOpacity>
            {isBlocked && ptp?.reason === 'HAS_PAYMENT_PLAN' && ptp.lid && (
              <TouchableOpacity
                onPress={() => onNavigate('PaymentPlan', { lid: ptp.lid })}
                activeOpacity={0.7}
              >
                <Text style={styles.cardPtpLink}>{t('pp_view_plan')}</Text>
              </TouchableOpacity>
            )}
            {isBlocked && ptp?.reason !== 'HAS_PAYMENT_PLAN' && (
              <Text style={styles.cardPtpReason}>{getBlockedReason(ptp?.reason)}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => { setLoading(true); fetchData(); }}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCloseApp} style={{ marginTop: SPACING.lg }}>
          <Text style={[styles.closeText, { color: COLORS.primary }]}>{t('close_app')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/deco-logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={handleCloseApp}>
          <Text style={styles.closeText}>{t('close_app')}</Text>
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
            onRefresh={() => { setRefreshing(true); fetchData(); }}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('home_no_debts')}</Text>
        }
      />

      {/* Floating Messages button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => onNavigate('Messages')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>💬</Text>
      </TouchableOpacity>
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
    backgroundColor: COLORS.surface,
  },
  headerLogo: {
    height: 64,
    width: 240,
    marginLeft: -SPACING.sm,
  },
  closeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
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
  ptpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  ptpButtonIcon: { fontSize: 28, marginRight: SPACING.md },
  ptpButtonContent: { flex: 1 },
  ptpButtonTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },
  ptpButtonSub: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  ptpArrow: { fontSize: 24, color: COLORS.textMuted },
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

  // Active promise banner on card
  promiseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: '#E8F5E9',
    borderRadius: BORDER_RADIUS.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  promiseBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  promiseBannerIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  promiseBannerContent: {
    flex: 1,
  },
  promiseBannerTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: '#2E7D32',
  },
  promiseBannerDetail: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#1B5E20',
    marginTop: 1,
  },

  // PTP button on card
  cardPtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cardPtpButtonDisabled: {
    borderColor: COLORS.textMuted,
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },
  cardPtpIcon: { fontSize: 16, marginRight: SPACING.xs },
  cardPtpIconDisabled: { opacity: 0.4 },
  cardPtpText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.primary },
  cardPtpTextDisabled: { color: COLORS.textMuted },
  cardPtpReason: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  cardPtpLink: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.xxl,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  retryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 26,
  },
});
