/**
 * Company API
 * ===========
 * API functions for company management.
 */

import { api } from './client';

export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  status: 'pending' | 'verified' | 'suspended' | 'rejected';
  vault_address?: string;
  vault_admin_address?: string;
  vault_chain_id?: number;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CompanyStats {
  total_employees: number;
  active_employees: number;
  total_receipts: number;
  pending_receipts: number;
  approved_receipts: number;
  rejected_receipts: number;
  total_spend_month: number;
  total_spend_all_time: number;
}

export interface CreateCompanyRequest {
  name: string;
  slug: string;
  email: string;
}

export const companyApi = {
  /**
   * Create a new company
   */
  async create(data: CreateCompanyRequest) {
    return api.post<Company>('/companies', data);
  },

  /**
   * Get company by ID
   */
  async getById(companyId: string) {
    return api.get<Company>(`/companies/${companyId}`);
  },

  /**
   * Get company by slug
   */
  async getBySlug(slug: string) {
    return api.get<Company>(`/companies/slug/${slug}`);
  },

  /**
   * Get company statistics
   */
  async getStats(companyId: string) {
    return api.get<CompanyStats>(`/companies/${companyId}/stats`);
  },

  /**
   * Update company
   */
  async update(companyId: string, data: Partial<Company>) {
    return api.patch<Company>(`/companies/${companyId}`, data);
  },
};
