/**
 * Vault API
 * =========
 * API functions for treasury vault management.
 */

import { api } from './client';

export interface Vault {
  id: string;
  company_id: string;
  vault_address: string;
  admin_address: string;
  operator_address?: string;
  chain_id: number;
  chain_name: string;
  balance?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultBalance {
  address: string;
  balance: string;
  balance_formatted: string;
  chain_id: number;
}

export interface CreateVaultRequest {
  company_id: string;
  admin_address: string;
}

export const vaultApi = {
  /**
   * Create a new vault for company
   */
  async create(data: CreateVaultRequest) {
    return api.post<Vault>('/vaults', data);
  },

  /**
   * Get vault by company ID
   */
  async getByCompany(companyId: string) {
    return api.get<Vault>(`/vaults/company/${companyId}`);
  },

  /**
   * Get vault balance
   */
  async getBalance(companyId: string) {
    return api.get<VaultBalance>(`/vaults/balance/${companyId}`);
  },

  /**
   * Get vault transactions
   */
  async getTransactions(companyId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api.get<{ success: boolean; data: unknown[]; pagination: unknown }>(
      `/vaults/company/${companyId}/transactions?${params}`
    );
  },
};
