/**
 * Ledger API
 * ==========
 * API functions for financial ledger management.
 */

import { api } from './client';

export type LedgerEntryType = 'advance' | 'payout' | 'fee' | 'deposit';
export type LedgerEntryStatus = 'pending' | 'processing' | 'settled' | 'failed' | 'cancelled';

export interface LedgerEntry {
  id: string;
  company_id: string;
  employee_id?: string;
  amount_usd: number;
  fee_usd: number;
  entry_type: LedgerEntryType;
  status: LedgerEntryStatus;
  reference_id?: string;
  reference_type?: string;
  transaction_hash?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  settled_at?: string;
}

export interface LedgerSummary {
  total_payouts: number;
  total_advances: number;
  total_fees: number;
  pending_amount: number;
  settled_amount: number;
  entry_count: number;
}

export interface CreateLedgerEntryRequest {
  company_id: string;
  employee_id?: string;
  amount_usd: number;
  fee_usd?: number;
  entry_type: LedgerEntryType;
  reference_id?: string;
  reference_type?: string;
  metadata?: Record<string, unknown>;
}

export const ledgerApi = {
  /**
   * Get all ledger entries for a company
   */
  async getByCompany(
    companyId: string,
    limit = 100,
    offset = 0,
    entryType?: LedgerEntryType,
    status?: LedgerEntryStatus
  ) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (entryType) params.append('entry_type', entryType);
    if (status) params.append('status', status);

    return api.get<LedgerEntry[]>(`/ledger/company/${companyId}?${params}`);
  },

  /**
   * Get ledger summary for a company
   */
  async getSummary(companyId: string) {
    return api.get<LedgerSummary>(`/ledger/company/${companyId}/summary`);
  },

  /**
   * Get ledger entry by ID
   */
  async getById(entryId: string) {
    return api.get<LedgerEntry>(`/ledger/${entryId}`);
  },

  /**
   * Get ledger entries for an employee
   */
  async getByEmployee(employeeId: string, limit = 100, offset = 0) {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    return api.get<LedgerEntry[]>(`/ledger/employee/${employeeId}?${params}`);
  },

  /**
   * Create a new ledger entry
   */
  async create(data: CreateLedgerEntryRequest) {
    return api.post<LedgerEntry>('/ledger', data);
  },

  /**
   * Update ledger entry status
   */
  async updateStatus(
    entryId: string,
    status: LedgerEntryStatus,
    transactionHash?: string,
    errorMessage?: string
  ) {
    return api.put<LedgerEntry>(`/ledger/${entryId}`, {
      status,
      transaction_hash: transactionHash,
      error_message: errorMessage,
    });
  },
};
