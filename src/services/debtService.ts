import { api } from './apiClient';
import type { ApiResponse, DebtSummary, DebtDetail } from '../types/api';

export async function getDebtSummary(): Promise<DebtSummary> {
  const response = await api.get<ApiResponse<DebtSummary>>('/debts');

  if (!response.data) {
    console.error('[DebtService] No data in response:', JSON.stringify(response));
    throw new Error(response.message ?? 'Failed to load debts.');
  }

  return response.data;
}

export async function getDebtDetail(loanId: string): Promise<DebtDetail> {
  const response = await api.get<ApiResponse<DebtDetail>>(`/debts/${encodeURIComponent(loanId)}`);

  if (!response.data) {
    console.error('[DebtService] No detail data in response:', JSON.stringify(response));
    throw new Error(response.message ?? 'Failed to load debt details.');
  }

  return response.data;
}
