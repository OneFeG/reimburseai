/**
 * Employee API
 * ============
 * API functions for employee management.
 */

import { api } from './client';

export interface Employee {
  id: string;
  company_id: string;
  email: string;
  name: string;
  department?: string;
  employee_number?: string;
  wallet_address?: string;
  wallet_verified_at?: string;
  status: 'active' | 'inactive' | 'pending';
  role?: 'admin' | 'manager' | 'employee'; // For frontend convenience
  created_at: string;
  updated_at: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email: string;
  wallet_address?: string;
  department?: string;
  employee_number?: string;
  role?: 'admin' | 'manager' | 'employee';
  company_id?: string; // Required for backend
}

export const employeeApi = {
  /**
   * Create a new employee
   */
  async create(companyId: string, data: CreateEmployeeRequest) {
    // Backend expects company_id in the body
    return api.post<Employee>('/employees', {
      ...data,
      company_id: companyId,
    });
  },

  /**
   * Get employee by ID
   */
  async getById(employeeId: string) {
    return api.get<Employee>(`/employees/${employeeId}`);
  },

  /**
   * Get employee by wallet address
   */
  async getByWallet(walletAddress: string) {
    return api.get<Employee>(`/employees/wallet/${walletAddress}`);
  },

  /**
   * List employees for company
   */
  async listByCompany(companyId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api.get<{ success: boolean; data: Employee[]; pagination: unknown }>(
      `/employees/company/${companyId}?${params}`
    );
  },

  /**
   * Update employee
   */
  async update(employeeId: string, data: Partial<Employee>) {
    return api.patch<Employee>(`/employees/${employeeId}`, data);
  },

  /**
   * Update employee wallet address
   */
  async updateWallet(employeeId: string, walletAddress: string) {
    return api.patch<Employee>(`/employees/${employeeId}/wallet?wallet_address=${walletAddress}`);
  },
};
