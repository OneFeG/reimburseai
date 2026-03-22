/**
 * Policy API
 * ==========
 * API functions for expense policy management.
 */

import { api } from "./client";
import type { ApiResponse } from "./client";

type Numeric = number | string;

export interface Policy {
  id: string;
  company_id: string;
  name: string;
  verification_mode?: "autonomous" | "human_verification" | string;
  daily_receipt_limit?: number;
  currencies?: string[] | null;
  amount_cap?: Numeric | null;
  monthly_cap?: Numeric | null;
  allowed_categories?: string[] | null;
  vendor_whitelist?: string[] | null;
  vendor_blacklist?: string[] | null;
  max_days_old?: number | null;
  custom_rules?: string;
  require_description?: boolean | null;
  require_category?: boolean | null;
  auto_approve_under?: Numeric | null;
  is_active?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface PolicyRequest {
  name: string;
  verification_mode?: "autonomous" | "human_verification";
  daily_receipt_limit?: number;
  currencies?: string[];
  amount_cap?: number;
  monthly_cap?: number;
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

type PolicyAuthz = {
  accountType: "company" | "employee";
  employeeRole?: string;
};

const withCompanyQuery = (endpoint: string, authz: PolicyAuthz) => {
  if (authz.accountType !== "company") return endpoint;
  return endpoint.includes("?")
    ? `${endpoint}&company=true`
    : `${endpoint}?company=true`;
};

const forbidden = <T>(message: string): ApiResponse<T> => ({
  success: false,
  error: { code: "FORBIDDEN", message },
});

const employeeCanManagePolicies = (authz: PolicyAuthz) => {
  if (authz.accountType !== "employee") return false;
  const role = authz.employeeRole || "employee";
  return role === "admin" || role === "manager";
};

export const policyApi = {
  /**
   * List policies for current user's company
   */
  async list(authz: PolicyAuthz): Promise<ApiResponse<Policy>> {
    return api.get<Policy>(withCompanyQuery("/policy", authz));
  },

  /**
   * Create a new policy (admins/managers only)
   */
  async create(
    data: PolicyRequest,
    authz: PolicyAuthz,
  ): Promise<ApiResponse<Policy>> {
    if (
      authz?.accountType === "employee" &&
      !employeeCanManagePolicies(authz)
    ) {
      return forbidden("Not allowed");
    }
    return api.post<Policy>(withCompanyQuery("/policy", authz), data);
  },

  /**
   * Update a policy (admins/managers only)
   */
  async update(
    policyId: string,
    data: PolicyRequest,
    authz: PolicyAuthz,
  ): Promise<ApiResponse<Policy>> {
    if (
      authz?.accountType === "employee" &&
      !employeeCanManagePolicies(authz)
    ) {
      return forbidden("Not allowed");
    }
    return api.put<Policy>(
      withCompanyQuery(`/policy?id=${encodeURIComponent(policyId)}`, authz),
      data,
    );
  },

  /**
   * Delete a policy (admins/managers only)
   */
  async delete(
    policyId: string,
    authz: PolicyAuthz,
  ): Promise<ApiResponse<{ message: string }>> {
    if (
      authz?.accountType === "employee" &&
      !employeeCanManagePolicies(authz)
    ) {
      return forbidden("Not allowed");
    }
    return api.delete<{ message: string }>(
      withCompanyQuery(`/policy?id=${encodeURIComponent(policyId)}`, authz),
    );
  },
};
