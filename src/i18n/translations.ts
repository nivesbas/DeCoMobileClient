const translations = {
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
    debt_no_payments: 'Nema evidentianih uplata.',

    // Messages
    messages_title: 'Poruke',
    messages_placeholder: 'Napišite poruku...',
    messages_send: 'Pošalji',
    messages_empty: 'Nemate poruka. Pošaljite prvu poruku Vašem operateru.',

    // Common
    error_generic: 'Došlo je do greške. Pokušajte ponovo.',
    error_network: 'Nema internet konekcije.',
    logout: 'Odjavi se',
    logout_confirm: 'Da li ste sigurni da želite da se odjavite?',
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
    debt_no_payments: 'No payments recorded.',

    messages_title: 'Messages',
    messages_placeholder: 'Write a message...',
    messages_send: 'Send',
    messages_empty: 'No messages yet. Send your first message to your operator.',

    error_generic: 'Something went wrong. Please try again.',
    error_network: 'No internet connection.',
    logout: 'Log out',
    logout_confirm: 'Are you sure you want to log out?',
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
  },
} as const;

export type TranslationKey = keyof typeof translations.sr;
export type Locale = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale = 'sr'): string {
  return translations[locale]?.[key] ?? translations.sr[key] ?? key;
}

export default translations;
