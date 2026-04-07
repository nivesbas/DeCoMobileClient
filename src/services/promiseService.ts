import { api } from './apiClient';
import type {
  ApiResponse,
  PtpEligibilityResponse,
  PtpCreateRequest,
  PtpCreateResponse,
} from '../types/api';

export async function checkPromiseEligibility(): Promise<PtpEligibilityResponse> {
  const response = await api.get<ApiResponse<PtpEligibilityResponse>>('/promise/eligibility');
  return response.data!;
}

export async function createPromise(
  request: PtpCreateRequest,
): Promise<PtpCreateResponse> {
  const response = await api.post<ApiResponse<PtpCreateResponse>>('/promise', request);
  return response.data!;
}
