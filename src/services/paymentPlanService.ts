import { api } from './apiClient';
import type { ApiResponse, PaymentPlan } from '../types/api';

export async function getPaymentPlan(lid: number): Promise<PaymentPlan> {
  const response = await api.get<ApiResponse<PaymentPlan>>(`/payment-plans/${lid}`);

  if (!response.data) {
    console.error('[PaymentPlanService] No data in response', { correlationId: response.correlationId });
    throw new Error(response.message ?? 'Failed to load payment plan.');
  }

  return response.data;
}
