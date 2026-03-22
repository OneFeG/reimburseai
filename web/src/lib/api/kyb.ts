/**
 * KYB API
 * =======
 * API functions for Know Your Business verification.
 */

import { api } from "./client";

export type KYBStatus =
  | "unsubmitted"
  | "pending"
  | "approved"
  | "rejected"
  | "under_review";

export interface KYBData {
  company_name?: string;
  registration_number?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  business_type?: string;
  tax_id?: string;
  bank_account_last4?: string;
}

export interface KYBStatusResponse {
  company_id: string;
  status: KYBStatus;
  data: KYBData;
  documents?: string[];
  reviewer_notes?: string;
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
}

export interface KYBSubmissionRequest {
  company_id: string;
  company_name: string;
  registration_number?: string;
  country?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  business_type?: string;
  tax_id?: string;
  bank_account_last4?: string;
  documents?: string[];
}

export interface KYBSubmissionResponse {
  id: string;
  company_id: string;
  status: KYBStatus;
  message: string;
}

export const kybApi = {
  /**
   * Get KYB status for a company
   */
  async getStatus(companyId: string) {
    return api.get<KYBStatusResponse>(`/kyb/${companyId}`);
  },

  /**
   * Submit KYB verification data
   */
  async submit(data: KYBSubmissionRequest) {
    return api.post<KYBSubmissionResponse>("/kyb", data);
  },

  /**
   * Check if company is KYB verified
   */
  async isVerified(companyId: string) {
    return api.get<{ company_id: string; verified: boolean }>(
      `/kyb/${companyId}/verified`,
    );
  },

  /**
   * Update KYB status (admin only)
   */
  async updateStatus(
    submissionId: string,
    status: "pending" | "approved" | "rejected" | "under_review",
    reviewerNotes?: string,
  ) {
    return api.put<KYBStatusResponse>(`/kyb/${submissionId}/status`, {
      status,
      reviewer_notes: reviewerNotes,
    });
  },

  /**
   * Get pending KYB submissions (admin only)
   */
  async getPending(limit = 100) {
    return api.get<KYBStatusResponse[]>(`/kyb/admin/pending?limit=${limit}`);
  },
};
