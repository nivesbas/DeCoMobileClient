import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, BackHandler, ScrollView, Platform,
  TextInput,
} from 'react-native';
import { checkPromiseEligibility, createPromise } from '../services/promiseService';
import { t } from '../i18n/translations';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import type { PtpLoanEligibility } from '../types/api';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  preselectedLoanId?: string;  // loanId from HomeScreen card
}

export default function PromiseScreen({ onBack, onSuccess, preselectedLoanId }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState<PtpLoanEligibility[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<PtpLoanEligibility | null>(null);
  const [selectedDays, setSelectedDays] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fetchEligibility = useCallback(async () => {
    try {
      const result = await checkPromiseEligibility();
      setLoans(result.loans);
      // Auto-select: preselected loan from card, or single eligible loan
      const eligible = result.loans.filter(l => l.eligible);
      if (preselectedLoanId) {
        const match = eligible.find(l => l.loan === preselectedLoanId);
        if (match) selectLoan(match);
        else if (eligible.length === 1) selectLoan(eligible[0]);
      } else if (eligible.length === 1) {
        selectLoan(eligible[0]);
      }
    } catch (error: any) {
      Alert.alert('', error.message ?? t('error_generic'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEligibility();
  }, [fetchEligibility]);

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedLoan && loans.filter(l => l.eligible).length > 1) {
        // Go back to loan selection
        setSelectedLoan(null);
        setSelectedDays(null);
        setCustomAmount('');
        return true;
      }
      onBack();
      return true;
    });
    return () => handler.remove();
  }, [onBack, selectedLoan, loans]);

  const formatNumber = (n: number) =>
    n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const parseFormattedNumber = (s: string): number => {
    const cleaned = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const getPromiseDate = (daysFromNow: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  };

  const formatDisplayDate = (daysFromNow: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toLocaleDateString('sr-Latn', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const selectLoan = (loan: PtpLoanEligibility) => {
    setSelectedLoan(loan);
    setSelectedDays(1);
    setCustomAmount(formatNumber(loan.dueAmount));
  };

  const getMinAmount = (): number => {
    if (!selectedLoan) return 0;
    const discount = selectedLoan.maxDiscountPercent / 100;
    return selectedLoan.dueAmount * (1 - discount);
  };

  const handleSubmit = async () => {
    if (!selectedLoan || selectedDays === null || submitting) return;

    const amount = parseFormattedNumber(customAmount);
    const minAmount = getMinAmount();

    if (amount < minAmount) {
      Alert.alert(
        t('ptp_error') ?? 'Greska',
        `${t('ptp_min_amount') ?? 'Minimalni iznos je'} ${formatNumber(minAmount)} ${selectedLoan.dueCurrency}`,
      );
      return;
    }

    if (amount > selectedLoan.dueAmount) {
      Alert.alert(
        t('ptp_error') ?? 'Greska',
        t('ptp_max_amount_exceeded') ?? 'Iznos ne moze biti veci od dospelog duga.',
      );
      return;
    }

    Alert.alert(
      t('ptp_confirm_title') ?? 'Potvrda',
      `${t('ptp_confirm_message') ?? 'Obavezujete se da cete platiti'} ${formatNumber(amount)} ${selectedLoan.dueCurrency} ${t('ptp_confirm_by') ?? 'do'} ${formatDisplayDate(selectedDays)}?\n\n${t('ptp_loan') ?? 'Proizvod'}: ${selectedLoan.loan}`,
      [
        { text: t('no'), style: 'cancel' },
        {
          text: t('yes'),
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const result = await createPromise({
                lid: selectedLoan.lid,
                promiseDate: getPromiseDate(selectedDays),
                promiseValue: amount,
                promiseCurrency: selectedLoan.dueCurrency,
              });

              if (result.success) {
                setSubmitted(true);
              } else {
                Alert.alert('', result.message);
              }
            } catch (error: any) {
              Alert.alert('', error.message ?? t('error_generic'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onSuccess}>
            <Text style={styles.backText}>{'←'} {t('back') ?? 'Nazad'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>{t('ptp_title') ?? 'Obecanje uplate'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>{t('ptp_success_title') ?? 'Obecanje zabelezeno!'}</Text>
          <Text style={styles.successText}>
            {t('ptp_success_message') ?? 'Vase obecanje je uspesno zabelezeno. Bice te obavešteni o statusu.'}
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={onSuccess}>
            <Text style={styles.primaryButtonText}>{t('ptp_back_home') ?? 'Nazad na pocetnu'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── No eligible loans at all ──────────────────────────────────────────────
  const eligibleLoans = loans.filter(l => l.eligible);
  const allBlocked = eligibleLoans.length === 0 && loans.length > 0;

  if (allBlocked) {
    // Show the first blocked reason (client-level reasons are the same across all loans)
    const firstReason = loans[0]?.reason;
    const reasonText = getReasonText(firstReason);
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>{'←'} {t('back') ?? 'Nazad'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>{t('ptp_title') ?? 'Obecanje uplate'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.blockedContainer}>
          <Text style={styles.blockedIcon}>⚠</Text>
          <Text style={styles.blockedTitle}>{t('ptp_not_eligible') ?? 'Obecanje nije moguce'}</Text>
          <Text style={styles.blockedText}>{reasonText}</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={onBack}>
            <Text style={styles.secondaryButtonText}>{t('back') ?? 'Nazad'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Loan selection (when multiple eligible loans) ─────────────────────────
  if (!selectedLoan) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>{'←'} {t('back') ?? 'Nazad'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerBarTitle}>{t('ptp_title') ?? 'Obecanje uplate'}</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.sectionTitle}>{t('ptp_select_loan') ?? 'Izaberite proizvod'}</Text>
          {loans.map(loan => {
            const isEligible = loan.eligible;
            const reasonText = !isEligible ? getReasonText(loan.reason) : null;
            return (
              <TouchableOpacity
                key={loan.lid}
                style={[
                  styles.loanCard,
                  !isEligible && styles.loanCardDisabled,
                ]}
                onPress={() => isEligible && selectLoan(loan)}
                disabled={!isEligible}
                activeOpacity={isEligible ? 0.7 : 1}
              >
                <View style={styles.loanCardHeader}>
                  <Text style={[styles.loanName, !isEligible && styles.textDisabled]}>
                    {loan.loan}
                  </Text>
                  {!isEligible && (
                    <View style={styles.blockedBadge}>
                      <Text style={styles.blockedBadgeText}>⚠</Text>
                    </View>
                  )}
                  {isEligible && (
                    <Text style={styles.loanArrow}>›</Text>
                  )}
                </View>
                <Text style={[styles.loanAmount, !isEligible && styles.textDisabled]}>
                  {formatNumber(loan.dueAmount)} {loan.dueCurrency}
                </Text>
                {!isEligible && reasonText && (
                  <Text style={styles.loanBlockedReason}>{reasonText}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── Promise form (for selected loan) ──────────────────────────────────────
  const maxDays = selectedLoan.maxDays;
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => {
          if (eligibleLoans.length > 1) {
            setSelectedLoan(null);
            setSelectedDays(null);
            setCustomAmount('');
          } else {
            onBack();
          }
        }}>
          <Text style={styles.backText}>{'←'} {t('back') ?? 'Nazad'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerBarTitle}>{t('ptp_title') ?? 'Obecanje uplate'}</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* Selected loan info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLoanName}>{selectedLoan.loan}</Text>
          <Text style={styles.infoLabel}>{t('ptp_due_amount') ?? 'Dospeli iznos'}</Text>
          <Text style={styles.infoAmount}>
            {formatNumber(selectedLoan.dueAmount)} {selectedLoan.dueCurrency}
          </Text>
        </View>

        {/* Date selection */}
        <Text style={styles.sectionTitle}>{t('ptp_select_date') ?? 'Izaberite datum uplate'}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {dayOptions.map(days => (
            <TouchableOpacity
              key={days}
              style={[
                styles.dateChip,
                selectedDays === days && styles.dateChipSelected,
              ]}
              onPress={() => setSelectedDays(days)}
            >
              <Text style={[
                styles.dateChipDay,
                selectedDays === days && styles.dateChipTextSelected,
              ]}>
                {days === 1 ? (t('ptp_tomorrow') ?? 'Sutra') : `${days} ${t('ptp_days') ?? 'dana'}`}
              </Text>
              <Text style={[
                styles.dateChipDate,
                selectedDays === days && styles.dateChipTextSelected,
              ]}>
                {formatDisplayDate(days)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Amount input */}
        <Text style={styles.sectionTitle}>{t('ptp_enter_amount') ?? 'Iznos uplate'}</Text>
        <View style={styles.amountInputContainer}>
          <TextInput
            style={styles.amountInput}
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="decimal-pad"
            placeholder={formatNumber(selectedLoan.dueAmount)}
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.currencyLabel}>{selectedLoan.dueCurrency}</Text>
        </View>
        {selectedLoan.maxDiscountPercent > 0 && (
          <Text style={styles.discountHint}>
            {t('ptp_min_hint') ?? 'Minimalno'}: {formatNumber(getMinAmount())} {selectedLoan.dueCurrency}
            {' '}({100 - selectedLoan.maxDiscountPercent}%)
          </Text>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || selectedDays === null}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={COLORS.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {t('ptp_submit') ?? 'Obecaj uplatu'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function getReasonText(reason?: string): string {
  switch (reason) {
    case 'HAS_PAYMENT_PLAN':
      return t('ptp_reason_payment_plan') ?? 'Imate aktivan plan otplate. Pratite ugovorene rate.';
    case 'HAS_ACTIVE_PROMISE':
      return t('ptp_reason_active_promise') ?? 'Vec imate aktivno obecanje uplate po ovom proizvodu.';
    case 'TOO_MANY_BROKEN':
      return t('ptp_reason_broken') ?? 'Prekoracili ste dozvoljeni broj neispunjenih obecanja. Kontaktirajte operatera.';
    case 'COOLDOWN_ACTIVE':
      return t('ptp_reason_cooldown') ?? 'Morate sacekati pre novog obecanja.';
    case 'LEGAL_CASE_ACTIVE':
      return t('ptp_reason_legal') ?? 'Vas predmet je u sudskom postupku. Kontaktirajte pravnu sluzbu.';
    default:
      return t('ptp_reason_generic') ?? 'Obecanje uplate trenutno nije dostupno. Kontaktirajte operatera.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SPACING.md, paddingTop: 56, backgroundColor: COLORS.primary,
  },
  backText: { fontSize: FONT_SIZES.md, color: COLORS.textOnPrimary, fontWeight: '600' },
  headerBarTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textOnPrimary },
  formContainer: { padding: SPACING.lg, paddingBottom: 100 },

  // Info card
  infoCard: {
    backgroundColor: COLORS.primaryDark, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xl,
  },
  infoLoanName: {
    fontSize: FONT_SIZES.sm, color: COLORS.textOnPrimary, opacity: 0.8,
    marginBottom: SPACING.xs, fontWeight: '600',
  },
  infoLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textOnPrimary, opacity: 0.7 },
  infoAmount: {
    fontSize: FONT_SIZES.title, fontWeight: '800', color: COLORS.textOnPrimary, marginTop: SPACING.xs,
  },

  // Section
  sectionTitle: {
    fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary,
    marginBottom: SPACING.sm, marginTop: SPACING.md,
  },

  // Loan cards
  loanCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  loanCardDisabled: {
    opacity: 0.6, backgroundColor: COLORS.background,
  },
  loanCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  loanName: {
    fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, flex: 1,
  },
  loanAmount: {
    fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.primary, marginTop: SPACING.xs,
  },
  loanArrow: {
    fontSize: 28, color: COLORS.primary, fontWeight: '300',
  },
  loanBlockedReason: {
    fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: SPACING.xs, fontStyle: 'italic',
  },
  textDisabled: { color: COLORS.textMuted },
  blockedBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center',
  },
  blockedBadgeText: { fontSize: 14 },

  // Date chips
  dateRow: { paddingBottom: SPACING.sm, gap: SPACING.sm },
  dateChip: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', minWidth: 90,
  },
  dateChipSelected: {
    borderColor: COLORS.primary, backgroundColor: COLORS.primary,
  },
  dateChipDay: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textPrimary },
  dateChipDate: { fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  dateChipTextSelected: { color: COLORS.textOnPrimary },

  // Amount input
  amountInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md,
  },
  amountInput: {
    flex: 1, fontSize: FONT_SIZES.xl, fontWeight: '700',
    color: COLORS.textPrimary, paddingVertical: SPACING.md,
  },
  currencyLabel: {
    fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textMuted, marginLeft: SPACING.sm,
  },
  discountHint: {
    fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: SPACING.xs,
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.xl,
  },
  primaryButtonText: { color: COLORS.textOnPrimary, fontSize: FONT_SIZES.md, fontWeight: '700' },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.lg,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: FONT_SIZES.md, fontWeight: '600' },

  // Blocked
  blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  blockedIcon: { fontSize: 48, marginBottom: SPACING.md },
  blockedTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  blockedText: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: SPACING.lg,
  },

  // Success
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  successIcon: {
    fontSize: 64, color: COLORS.primary, marginBottom: SPACING.md,
    width: 100, height: 100, lineHeight: 100, textAlign: 'center',
    borderRadius: 50, backgroundColor: '#E8F5E9',
  },
  successTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  successText: {
    fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg,
  },
});
