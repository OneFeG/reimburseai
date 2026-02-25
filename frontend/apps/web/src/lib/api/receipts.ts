/**
 * Receipt API
 * ===========
 * API functions for receipt management.
 */

import { api } from './client';

export interface Receipt {
  id: string;
  company_id: string;
  employee_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  status: ReceiptStatus;
  merchant_name?: string;
  amount?: number;
  currency?: string;
  transaction_date?: string;
  category?: string;
  description?: string;
  ai_confidence?: number;
  decision_reason?: string;
  anomalies?: string[];
  payout_tx_hash?: string;
  created_at: string;
  updated_at: string;
}

export type ReceiptStatus =
  | 'uploaded'
  | 'processing'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'paid';

export interface UploadResponse {
  success: boolean;
  message: string;
  receipt_id: string;
  file_path: string;
  status: ReceiptStatus;
}

export interface ReceiptListResponse {
  success: boolean;
  data: Receipt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PendingReceiptsResponse {
  success: boolean;
  data: Receipt[];
  total: number;
}

export const receiptApi = {
  /**
   * Upload a receipt
   */
  async upload(file: File, description?: string, category?: string) {
    return api.uploadFile<UploadResponse>('/upload', file, {
      ...(description && { description }),
      ...(category && { category }),
    });
  },

  /**
   * Get receipt by ID
   */
  async getById(receiptId: string) {
    return api.get<Receipt>(`/receipts/${receiptId}`);
  },

  /**
   * Get receipt image URL
   */
  async getImageUrl(receiptId: string) {
    return api.get<{ success: boolean; url: string; expires_in: number }>(
      `/receipts/${receiptId}/image-url`
    );
  },

  /**
   * List receipts for company
   */
  async listByCompany(companyId: string, page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return api.get<ReceiptListResponse>(`/receipts/company/${companyId}?${params}`);
  },

  /**
   * List receipts for employee
   */
  async listByEmployee(employeeId: string, page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    return api.get<ReceiptListResponse>(`/receipts/employee/${employeeId}?${params}`);
  },

  /**
   * Get pending receipts for approval queue
   */
  async getPending(companyId: string) {
    return api.get<PendingReceiptsResponse>(`/receipts/company/${companyId}/pending`);
  },

  /**
   * Update receipt status (approve/reject)
   */
  async updateStatus(receiptId: string, status: ReceiptStatus) {
    return api.patch<Receipt>(`/receipts/${receiptId}/status?status=${status}`);
  },
};
