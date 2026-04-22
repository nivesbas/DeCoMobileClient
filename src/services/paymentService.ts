import { api } from './apiClient';
import type { ApiResponse, PaymentQrResponse } from '../types/api';

export async function getPaymentQr(loanId: string, amount?: number): Promise<PaymentQrResponse> {
  const query = amount != null ? `?amount=${encodeURIComponent(amount)}` : '';
  const response = await api.get<ApiResponse<PaymentQrResponse>>(
    `/payments/qr/${encodeURIComponent(loanId)}${query}`,
  );

  if (!response.data) {
    throw new Error(response.message ?? 'Failed to load payment QR.');
  }

  return response.data;
}
