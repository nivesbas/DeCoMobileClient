import { api } from './apiClient';
import type { ApiResponse, DebtSummary, DebtDetail } from '../types/api';

export async function getDebtSummary(): Promise<DebtSummary> {
  const response = await api.get<ApiResponse<DebtSummary>>('/debts');
  return response.data!;
}

export async function getDebtDetail(loanId: string): Promise<DebtDetail> {
  const response = await api.get<ApiResponse<DebtDetail>>(`/debts/${encodeURIComponent(loanId)}`);
  return response.data!;
}
