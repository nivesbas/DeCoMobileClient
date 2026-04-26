# Privacy Policy — DeCo Application

**Version 1.0 — effective April 26, 2026**

DeCo is a mobile application provided by **UrilSolutions** (hereinafter "we", "our company") to clients of financial institutions for whom we provide debt-management services. The application allows clients to view debt status, arrange Promise to Pay (PTP) commitments, generate payment QR codes, and chat with our operators. This policy describes what data we collect, why, how long we retain it, and the rights you have.

## 1. Data Controller

The data controller within the meaning of the Serbian Personal Data Protection Act (Official Gazette of RS, No. 87/2018) and the GDPR (EU Regulation 2016/679) is:

**UrilSolutions**
Matice srpske 75, Belgrade, Serbia
Company registration number: 63560073

For all privacy-related questions:
**privacy@uril.rs**

## 2. Data We Collect and Why

### 2.1 Data You Actively Provide

| Data | Purpose | Legal Basis |
|---|---|---|
| Client ID / Customer ID | Identification in our debt-management system | Performance of contract |
| Phone number | Sending OTP for sign-in, identity verification | Performance of contract |
| Message content sent to operators | Communication regarding your debt | Performance of contract |
| PTP amount and date | Recording payment commitments | Performance of contract |

### 2.2 Data Collected Automatically

| Data | Purpose | Legal Basis |
|---|---|---|
| Device ID (anonymous UUID) | Binding session to device, preventing unauthorized access | Legitimate interest (security) |
| Push token (FCM) | Delivering push notifications (new operator messages, debt reminders) | Consent (revocable in OS settings) |
| App version, OS version | Technical support, mandatory-update routing | Legitimate interest |
| Sign-in / sign-out timestamps | Security audit trail | Legitimate interest (security) |

### 2.3 Data We DO NOT Collect

We explicitly do NOT collect:
- Device location (GPS)
- Contact list
- Photos, videos, or audio from the device
- Camera or microphone access
- ID document data (passport, national ID)
- Data from other apps on the device

The app contains no advertising, uses no third-party analytics tools (Google Analytics, Facebook Pixel, etc.), and does not share data with advertisers.

### 2.4 Biometric Data

The app uses fingerprint or Face ID **exclusively locally on your device** to unlock the app on subsequent opens. Biometric data is never transmitted to our servers or anywhere else — verification happens within your phone's secure enclave (Android Keystore / iOS Secure Enclave).

## 3. With Whom We Share Data

**Google LLC (Firebase Cloud Messaging)** — push tokens and notification content pass through Google FCM infrastructure for delivery. Google retains this data per its own privacy policy.

**Bank's CRM system** — your financial data (debts, loans, payments) resides in the systems of the bank or lender of which you are a client. UrilSolutions accesses this data as a processor under contract with the relevant financial institution.

We do not sell data to third parties. We do not share data for marketing purposes.

## 4. How Long We Retain Data

| Data | Retention Period |
|---|---|
| Active account (phone, device ID, push token) | While the account is active |
| After account deletion: messages, PTPs, debt records | As required by law (Consumer Protection Act, Banking Act, NBS regulations) — minimum 5 years, up to 10 years for consumer credit |
| Session data (refresh token, OTP) | Until session expiry or 30 days, whichever is shorter |
| Audit logs (sign-in/sign-out) | 1 year |

## 5. Data Security

- All communication between the app and our servers uses TLS 1.2+ encryption.
- The app implements **certificate pinning** — connections are rejected if server certificates do not match a pre-known fingerprint set.
- Refresh and access tokens are stored in `Android Keystore` / `iOS Keychain` — encrypted within the phone's hardware security module.
- Cloud backup of app data (Google Drive / iCloud) is disabled — data stays on the device.
- The app applies code obfuscation (R8 / ProGuard) and resource shrinking in release builds.

## 6. Your Rights (GDPR and Serbian PDPA)

You have the following rights:

- **Right of access** — request a copy of all data we hold about you.
- **Right to rectification** — incorrect data will be corrected without delay.
- **Right to erasure** ("right to be forgotten") — delete your account directly from the app: **Settings → Delete Account**. Data is deleted per Section 7.
- **Right to restriction of processing** — request that we temporarily halt processing your data.
- **Right to data portability** — receive your data in a structured, machine-readable format (JSON or CSV).
- **Right to object** — object to processing based on legitimate interest.

Contact for exercising rights: **privacy@uril.rs**. We respond within 30 days.

## 7. Account Deletion

You can delete your account from the app: **Settings → Delete Account**. Upon confirmation:

- Your phone number is removed from our database (replaced with `NULL`).
- Push token is removed from Google FCM.
- All your devices are deregistered and sessions terminated.
- You cannot sign back in with the same account — to use the app again you must register as a new user.

**What remains:** debt, payment, and message-history data stays in our systems and the bank's systems as required by retention laws (see Section 4). Such data is anonymized to the extent legally possible.

## 8. Filing Complaints

If you believe your data protection rights have been violated, you have the right to lodge a complaint with:

**Commissioner for Information of Public Importance and Personal Data Protection**
Bulevar kralja Aleksandra 15, 11000 Belgrade, Serbia
office@poverenik.rs
www.poverenik.rs

## 9. Changes to This Policy

This policy may be updated. Material changes will be communicated through the app or by email (if you have provided a contact). The date of the last revision is at the top of this document.

---

*This is the English version. A Serbian version is available [here](policy-sr.md).*
