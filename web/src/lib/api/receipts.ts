/**
 * Receipt API
 * ===========
 * API functions for receipt management.
 */

import { api } from "./client";

type Numeric = number | string;

export type AuditStatus = "pending" | "processing" | "approved" | "rejected";

export interface Audit {
  id: string;
  company_id: string;
  employee_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  merchant: string | null;
  merchant_category: string | null;
  receipt_date: string | null;
  amount: Numeric | null;
  currency: string | null;
  converted_amount: Numeric | null;
  payout_currency: string | null;
  exchange_rate: Numeric | null;
  exchange_rate_timestamp: string | null;
  status: AuditStatus | null;
  ai_confidence: Numeric | null;
  ai_decision_reason: string | null;
  ai_extracted_data: unknown | null;
  ai_anomalies: string[] | null;
  signature: string | null;
  audit_fee_paid: boolean | null;
  audit_fee_tx_hash: string | null;
  audit_fee_amount: Numeric | null;
  payout_amount: Numeric | null;
  payout_tx_hash: string | null;
  payout_wallet: string | null;
  paid_at: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export type Receipt = Audit;
export type ReceiptStatus = AuditStatus;

type AuditationsAuthz = { accountType: "company" | "employee" };

export const receiptApi = {
  async getAuditationsByEmployee(authz: AuditationsAuthz, employeeId?: string) {
    const params = new URLSearchParams();
    params.set("employee", String(authz.accountType === "employee"));
    if (employeeId) params.set("id", employeeId);
    return api.get<Audit[]>(`/auditations/employee?${params.toString()}`);
  },

  async getAuditationsByCompany(authz: AuditationsAuthz, companyId?: string) {
    const params = new URLSearchParams();
    params.set("employee", String(authz.accountType === "employee"));
    if (companyId) params.set("id", companyId);
    return api.get<Audit[]>(`/auditations/company?${params.toString()}`);
  },
};
