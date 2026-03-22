/**
 * Company API
 * ===========
 * API functions for company management.
 */

import { api } from "./client";
import type { ApiResponse } from "./client";
import { Employee } from "./employees";

export interface Company {
  id: string;
  name: string;
  email: string;
  identificationnumber?: number;
  status?: string;
  base_currency?: string;
  smart_wallet_address?: string | null;
  wallet_address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyRequest {
  name: string;
  IdentificationNumber: number;
}

export interface CompanyStats {
  company_id: string;
  total_employees: number;
  active_employees: number;
  total_receipts: number;
  pending_receipts: number;
  approved_receipts: number;
  rejected_receipts: number;
  total_spend_month: number;
  total_spend_all_time: number;
  updated_at?: string;
}

export const companyApi = {
  /**
   * Create a new company
   */
  async create(data: CreateCompanyRequest) {
    return api.post<Company>("/companyup", data);
  },

  /**
   * Get company by ID (employee scoped)
   */
  async get(companyId: string, isEmployee: boolean) {
    return api.get<Company>(
      `/company?id=${encodeURIComponent(companyId)}&employee=${isEmployee}`,
    );
  },

  /**
   * Update company (employee scoped; requires manager role in backend)
   */
  async update(
    companyId: string,
    data: Partial<Company>,
    isEmployee: boolean,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<Company>> {
    if (
      authz &&
      authz.accountType === "employee" &&
      authz.employeeRole !== "manager"
    ) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Not allowed" },
      };
    }
    return api.put<Company>(
      `/company?id=${encodeURIComponent(companyId)}&employee=${isEmployee}`,
      data,
    );
  },
  /**
   * Delete company (employee scoped; requires manager role in backend)
   */
  async delete(
    companyId: string,
    isEmployee: boolean,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<{ message: string }>> {
    if (
      authz &&
      authz.accountType === "employee" &&
      authz.employeeRole !== "manager"
    ) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "Not allowed" },
      };
    }
    return api.delete<{ message: string }>(
      `/company?id=${encodeURIComponent(companyId)}&employee=${isEmployee}`,
    );
  },

  /**
   * Invite an employee by email (employee scoped; requires manager role in backend)
   */
  async inviteEmployee(
    employeeEmail: string,
    isEmployee: boolean,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<{ message: string }>> {
    if (authz && authz.accountType === "employee") {
      const role = authz.employeeRole || "employee";
      if (role !== "manager" && role !== "admin") {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Not allowed" },
        };
      }
    }
    return api.post<{ message: string }>(
      `/company/invite?employeeEmail=${encodeURIComponent(employeeEmail)}&employee=${isEmployee}`,
    );
  },

  /**
   * Delete employee (admin/manager within same company)
   */
  async deleteEmployee(
    employeeId: string,
    isEmployee: boolean,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<{ message: string }>> {
    if (authz && authz.accountType === "employee") {
      const role = authz.employeeRole || "employee";
      if (role !== "manager" && role !== "admin") {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Not allowed" },
        };
      }
    }
    return api.put<{ message: string }>(
      `/company/delete?id=${encodeURIComponent(employeeId)}&employee=${isEmployee}`,
    );
  },

  /**
   * Get employees in company (employee scoped)
   */
  async getEmployeesInCompany(
    isEmployee: boolean,
    authz?: { accountType: "company" | "employee"; employeeRole?: string },
  ): Promise<ApiResponse<Employee[]>> {
    if (authz && authz.accountType === "employee") {
      const role = authz.employeeRole || "employee";
      if (role !== "manager" && role !== "admin") {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Not allowed" },
        };
      }
    }
    return api.get<Employee[]>(`/company/employees?employee=${isEmployee}`);
  },
};

export const companyStatsApi = {
  async create(data: CompanyStats) {
    return api.post<CompanyStats>("/company_stats", data);
  },

  async getByCompanyId(companyId: string) {
    return api.get<CompanyStats>(
      `/company_stats?company_id=${encodeURIComponent(companyId)}`,
    );
  },

  async update(companyId: string, data: Partial<CompanyStats>) {
    return api.put<CompanyStats>(
      `/company_stats?company_id=${encodeURIComponent(companyId)}`,
      data,
    );
  },

  async delete(companyId: string) {
    return api.delete<{ message: string }>(
      `/company_stats?company_id=${encodeURIComponent(companyId)}`,
    );
  },
};
