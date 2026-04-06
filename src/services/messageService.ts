import { api } from './apiClient';
import type {
  ApiResponse,
  SendMessageRequest,
  SendMessageResponse,
  MessageHistoryResponse,
} from '../types/api';

export async function sendMessage(
  content: string,
  loanId?: string,
): Promise<SendMessageResponse> {
  const body: SendMessageRequest = { content, loanId };
  const response = await api.post<ApiResponse<SendMessageResponse>>('/messages', body);
  return response.data!;
}

export async function getMessageHistory(
  pageSize: number = 20,
  before?: string,
): Promise<MessageHistoryResponse> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (before) params.set('before', before);
  const response = await api.get<ApiResponse<MessageHistoryResponse>>(`/messages?${params}`);
  return response.data!;
}
