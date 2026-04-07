// ── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  correlationId?: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  customerId: string;
  phoneNumber: string;
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  appVersion: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  otpSent: boolean;
  otpExpiresInSeconds?: number;
  remainingAttempts?: number;
}

export interface VerifyOtpRequest {
  customerId: string;
  deviceId: string;
  otpCode: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresInSeconds?: number;
  remainingAttempts?: number;
  deviceBlocked: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  deviceId: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresInSeconds?: number;
  message?: string;
}

// ── Debt ─────────────────────────────────────────────────────────────────────

export interface DebtSummary {
  customerId: string;
  debts: DebtItem[];
  totalOutstanding: number;
  currency: string;
  lastPaymentDate?: string;
}

export interface DebtItem {
  loanId: string;
  productName: string;
  outstandingAmount: number;
  dueAmount: number;
  currency: string;
  daysPastDue: number;
  nextDueDate?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
}

export interface DebtDetail {
  loanId: string;
  productName: string;
  outstandingAmount: number;
  dueAmount: number;
  currency: string;
  daysPastDue: number;
  contractDate?: string;
  dueDate?: string;
  recentPayments: PaymentHistoryItem[];
}

export interface PaymentHistoryItem {
  paymentDate: string;
  amount: number;
  currency: string;
}

// ── Messages ─────────────────────────────────────────────────────────────────

export interface SendMessageRequest {
  content: string;
  loanId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId: string;
  timestamp: string;
  message?: string;
}

export interface MessageHistoryItem {
  messageId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
  isRead: boolean;
  operatorName?: string;
}

export interface MessageHistoryResponse {
  messages: MessageHistoryItem[];
  hasMore: boolean;
}
