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

// ── Promise to Pay ──────────────────────────────────────────────────────────

export interface PtpLoanEligibility {
  lid: number;
  loan: string;
  eligible: boolean;
  reason?: string;
  dueAmount: number;
  dueCurrency: string;
  maxDays: number;
  maxDiscountPercent: number;
  hasActivePromise: boolean;
  hasPaymentPlan: boolean;
  brokenPromiseCount: number;
  activePromiseDate?: string;
  activePromiseValue?: number;
  activePromiseCurr?: string;
}

export interface PtpEligibilityResponse {
  loans: PtpLoanEligibility[];
}

export interface PtpCreateRequest {
  lid: number;              // specific loan LID
  promiseDate: string;      // yyyy-MM-dd
  promiseValue: number;
  promiseCurrency: string;
  comment?: string;
}

export interface PtpCreateResponse {
  success: boolean;
  message: string;
  approvalMode: string;     // "auto" | "manual"
  actionIds: number[];
}

// ── Payment Plan ───────────────────────────────────────────────────────────

export interface PaymentPlan {
  idPaymentPlan: number;
  lid: number;
  loan: string;
  productName: string;
  status: number;            // 0=Active, 1=Completed, 2=Broken, 3=Terminated
  startDate: string;
  endDate: string;
  installments: PaymentPlanInstallment[];
}

export interface PaymentPlanInstallment {
  idPaymentPlanDetail: number;
  promiseDate: string;
  promiseValue: number;
  currency: string;
  idPromiseStatus: number;   // 0=Pending, 1=Kept, 2=Broken, 3=Terminated
}
