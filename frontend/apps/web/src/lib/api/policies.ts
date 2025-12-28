/**
 * Policy API
 * ==========
 * API functions for expense policy management.
 */

import { api } from './client';

export interface Policy {
  id: string;
  company_id: string;
  name: string;
  amount_cap_usd: number;
  monthly_cap_usd?: number;
  allowed_categories: string[];
  vendor_whitelist: string[];
  vendor_blacklist: string[];
  max_days_old: number;
  custom_rules?: string;
  require_description: boolean;
  require_category: boolean;
  auto_approve_under: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePolicyRequest {
  company_id: string;
  name?: string;
  amount_cap_usd?: number;
  monthly_cap_usd?: number;
  allowed_categories?: string[];
  vendor_whitelist?: string[];
  vendor_blacklist?: string[];
  max_days_old?: number;
  custom_rules?: string;
  require_description?: boolean;
  require_category?: boolean;
  auto_approve_under?: number;
}

export interface UpdatePolicyRequest {
  name?: string;
  amount_cap_usd?: number;
  monthly_cap_usd?: number;
  allowed_categories?: string[];
  vendor_whitelist?: string[];
  vendor_blacklist?: string[];
  max_days_old?: number;
  custom_rules?: string;
  require_description?: boolean;
  require_category?: boolean;
  auto_approve_under?: number;
  is_active?: boolean;
}

export const policyApi = {
  /**
   * Create a new policy
   */
  async create(data: CreatePolicyRequest) {
    return api.post<Policy>('/policies', data);
  },

  /**
   * Get policy by ID
   */
  async getById(policyId: string) {
    return api.get<Policy>(`/policies/${policyId}`);
  },

  /**
   * Get active policy for a company
   */
  async getActiveForCompany(companyId: string) {
    return api.get<Policy>(`/policies/company/${companyId}/active`);
  },

  /**
   * List all policies for a company
   */
  async listByCompany(companyId: string) {
    return api.get<{ success: boolean; data: Policy[]; total: number }>(
      `/policies/company/${companyId}`
    );
  },

  /**
   * Update a policy
   */
  async update(policyId: string, data: UpdatePolicyRequest) {
    return api.patch<Policy>(`/policies/${policyId}`, data);
  },

  /**
   * Delete a policy
   */
  async delete(policyId: string) {
    return api.delete<{ success: boolean; message: string }>(`/policies/${policyId}`);
  },
};
