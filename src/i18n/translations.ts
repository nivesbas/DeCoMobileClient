import { fetchTranslations } from '../services/translationService';

// ── Hardcoded fallback translations ─────────────────────────────────────────
const fallback = {
  sr: {
    // Auth
    register_title: 'Dobrodošli',
    register_subtitle: 'Unesite Vaše podatke za verifikaciju',
    customer_id_label: 'Matični broj / ID klijenta',
    customer_id_placeholder: 'Unesite matični broj',
    phone_label: 'Broj telefona',
    phone_placeholder: '+381 6X XXX XXXX',
    register_button: 'Pošalji verifikacioni kod',
    register_loading: 'Slanje...',

    // OTP
    otp_title: 'Verifikacija',
    otp_subtitle: 'Unesite kod koji ste primili na broj',
    otp_placeholder: '000000',
    otp_verify_button: 'Verifikuj',
    otp_verify_loading: 'Provera...',
    otp_resend: 'Pošalji ponovo',
    otp_expires_in: 'Kod ističe za',

    // Home
    home_title: 'Moja dugovanja',
    home_total: 'Ukupno dugovanje',
    home_last_payment: 'Poslednja uplata',
    home_no_debts: 'Nemate aktivnih dugovanja.',

    // Debt
    debt_detail_title: 'Detalji duga',
    debt_outstanding: 'Preostalo',
    debt_due: 'Dospelo',
    debt_dpd: 'Dana kašnjenja',
    debt_contract_date: 'Datum ugovora',
    debt_due_date: 'Datum dospeća',
    debt_payments: 'Poslednje uplate',
    debt_next_due: 'Sledeće dospeće',
    debt_no_payments: 'Nema evidentianih uplata.',

    // Messages
    messages_title: 'Poruke',
    messages_placeholder: 'Napišite poruku...',
    messages_send: 'Pošalji',
    messages_empty: 'Nemate poruka. Pošaljite prvu poruku Vašem operateru.',

    // Promise to Pay
    ptp_title: 'Obećanje uplate',
    ptp_select_loan: 'Izaberite proizvod',
    ptp_loan: 'Proizvod',
    ptp_due_amount: 'Dospeli iznos',
    ptp_select_date: 'Izaberite datum uplate',
    ptp_tomorrow: 'Sutra',
    ptp_days: 'dana',
    ptp_enter_amount: 'Iznos uplate',
    ptp_min_hint: 'Minimalno',
    ptp_submit: 'Obećaj uplatu',
    ptp_confirm_title: 'Potvrda obećanja',
    ptp_confirm_message: 'Obavezujete se da ćete platiti',
    ptp_confirm_by: 'do',
    ptp_error: 'Greška',
    ptp_min_amount: 'Minimalni iznos je',
    ptp_max_amount_exceeded: 'Iznos ne može biti veći od dospelog duga.',
    ptp_success_title: 'Obećanje zabeleženo!',
    ptp_success_message: 'Vaše obećanje je uspešno zabeleženo. Bićete obavešteni o statusu.',
    ptp_back_home: 'Nazad na početnu',
    ptp_not_eligible: 'Obećanje nije moguće',
    ptp_reason_payment_plan: 'Imate aktivan plan otplate. Pratite ugovorene rate.',
    ptp_reason_active_promise: 'Već imate aktivno obećanje uplate.',
    ptp_reason_broken: 'Prekoračili ste dozvoljeni broj neispunjenih obećanja. Kontaktirajte operatera.',
    ptp_reason_cooldown: 'Morate sačekati pre novog obećanja.',
    ptp_reason_legal: 'Vaš predmet je u sudskom postupku. Kontaktirajte pravnu službu.',
    ptp_reason_generic: 'Obećanje uplate trenutno nije dostupno. Kontaktirajte operatera.',
    ptp_home_banner: 'Obećanje uplate',
    ptp_home_banner_detail: 'do',
    ptp_button: 'Obećaj uplatu',

    // Payment Plan
    pp_title: 'Plan otplate',
    pp_loan: 'Proizvod',
    pp_period: 'Period',
    pp_total: 'Ukupno rata',
    pp_installment: 'Rata',
    pp_status_pending: 'Čeka uplatu',
    pp_status_kept: 'Plaćeno',
    pp_status_broken: 'Neplaćeno',
    pp_status_terminated: 'Otkazano',
    pp_no_plan: 'Nema aktivnog plana otplate.',
    pp_view_plan: 'Pogledaj plan otplate',
    pp_total_debt: 'Ukupno dugovanje',

    // Common
    back: 'Nazad',
    retry: 'Pokušajte ponovo',
    error_generic: 'Došlo je do greške. Pokušajte ponovo.',
    error_network: 'Nema internet konekcije.',
    logout: 'Odjavi se',
    logout_confirm: 'Da li ste sigurni da želite da se odjavite?',
    close_app: 'Zatvori',
    close_app_confirm: 'Da li želite da zatvorite aplikaciju?',
    yes: 'Da',
    no: 'Ne',
    cancel: 'Otkaži',
  },
  en: {
    register_title: 'Welcome',
    register_subtitle: 'Enter your details for verification',
    customer_id_label: 'Customer ID',
    customer_id_placeholder: 'Enter your customer ID',
    phone_label: 'Phone number',
    phone_placeholder: '+381 6X XXX XXXX',
    register_button: 'Send verification code',
    register_loading: 'Sending...',

    otp_title: 'Verification',
    otp_subtitle: 'Enter the code sent to',
    otp_placeholder: '000000',
    otp_verify_button: 'Verify',
    otp_verify_loading: 'Verifying...',
    otp_resend: 'Resend code',
    otp_expires_in: 'Code expires in',

    home_title: 'My Debts',
    home_total: 'Total outstanding',
    home_last_payment: 'Last payment',
    home_no_debts: 'No active debts.',

    debt_detail_title: 'Debt Details',
    debt_outstanding: 'Outstanding',
    debt_due: 'Due',
    debt_dpd: 'Days past due',
    debt_contract_date: 'Contract date',
    debt_due_date: 'Due date',
    debt_payments: 'Recent payments',
    debt_next_due: 'Next due date',
    debt_no_payments: 'No payments recorded.',

    messages_title: 'Messages',
    messages_placeholder: 'Write a message...',
    messages_send: 'Send',
    messages_empty: 'No messages yet. Send your first message to your operator.',

    ptp_title: 'Promise to Pay',
    ptp_select_loan: 'Select product',
    ptp_loan: 'Product',
    ptp_due_amount: 'Due amount',
    ptp_select_date: 'Select payment date',
    ptp_tomorrow: 'Tomorrow',
    ptp_days: 'days',
    ptp_enter_amount: 'Payment amount',
    ptp_min_hint: 'Minimum',
    ptp_submit: 'Promise to pay',
    ptp_confirm_title: 'Confirm promise',
    ptp_confirm_message: 'You commit to paying',
    ptp_confirm_by: 'by',
    ptp_error: 'Error',
    ptp_min_amount: 'Minimum amount is',
    ptp_max_amount_exceeded: 'Amount cannot exceed the due amount.',
    ptp_success_title: 'Promise recorded!',
    ptp_success_message: 'Your promise has been successfully recorded. You will be notified about the status.',
    ptp_back_home: 'Back to home',
    ptp_not_eligible: 'Promise not available',
    ptp_reason_payment_plan: 'You have an active repayment plan. Follow the agreed installments.',
    ptp_reason_active_promise: 'You already have an active payment promise.',
    ptp_reason_broken: 'You have exceeded the allowed number of broken promises. Contact your operator.',
    ptp_reason_cooldown: 'You must wait before making a new promise.',
    ptp_reason_legal: 'Your case is in legal proceedings. Contact the legal department.',
    ptp_reason_generic: 'Promise to pay is currently unavailable. Contact your operator.',
    ptp_home_banner: 'Payment promise',
    ptp_home_banner_detail: 'by',
    ptp_button: 'Promise to pay',

    pp_title: 'Payment Plan',
    pp_loan: 'Product',
    pp_period: 'Period',
    pp_total: 'Total installments',
    pp_installment: 'Installment',
    pp_status_pending: 'Pending',
    pp_status_kept: 'Paid',
    pp_status_broken: 'Unpaid',
    pp_status_terminated: 'Terminated',
    pp_no_plan: 'No active payment plan.',
    pp_view_plan: 'View payment plan',
    pp_total_debt: 'Total outstanding',

    back: 'Back',
    retry: 'Try again',
    error_generic: 'Something went wrong. Please try again.',
    error_network: 'No internet connection.',
    logout: 'Log out',
    logout_confirm: 'Are you sure you want to log out?',
    close_app: 'Close',
    close_app_confirm: 'Do you want to close the application?',
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
  },
} as const;

// ── Runtime state ───────────────────────────────────────────────────────────

type Locale = 'sr' | 'en';
let currentLocale: Locale = 'sr';
let remoteTranslations: Record<string, Record<string, string>> = {};
let initialized = false;

/**
 * Load translations from backend and cache them.
 * Call once at app startup.
 */
export async function initTranslations(locale: Locale = 'sr'): Promise<void> {
  currentLocale = locale;

  try {
    const remote = await fetchTranslations(locale);
    if (remote) {
      remoteTranslations[locale] = remote;
    }
  } catch (error) {
    console.warn('[i18n] Failed to init translations, using fallback');
  }

  initialized = true;
}

/**
 * Set active locale and load translations if not cached.
 */
export async function setLocale(locale: Locale): Promise<void> {
  currentLocale = locale;

  if (!remoteTranslations[locale]) {
    const remote = await fetchTranslations(locale);
    if (remote) {
      remoteTranslations[locale] = remote;
    }
  }
}

/**
 * Get translation by key.
 * Priority: remote translations → fallback → key itself.
 */
export function t(key: string, locale?: Locale): string {
  const loc = locale ?? currentLocale;

  // Try remote translations first (dot-notation keys from backend)
  const remote = remoteTranslations[loc];
  if (remote) {
    // Try exact key match
    if (remote[key]) return remote[key];
    // Try with "mobile." prefix (backend may namespace mobile keys)
    if (remote[`mobile.${key}`]) return remote[`mobile.${key}`];
  }

  // Fall back to hardcoded translations
  const fb = fallback[loc] ?? fallback.sr;
  return (fb as Record<string, string>)[key] ?? (fallback.sr as Record<string, string>)[key] ?? key;
}

export function getLocale(): Locale {
  return currentLocale;
}

export type TranslationKey = keyof typeof fallback.sr;
export default fallback;
