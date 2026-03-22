/**
 * API Index
 * =========
 * Export all API modules.
 */

export { api } from "./client";
export type { ApiError, ApiResponse } from "./client";

export { receiptApi } from "./receipts";
export type { Audit, AuditStatus, Receipt, ReceiptStatus } from "./receipts";

export { companyApi, companyStatsApi } from "./companies";
export type {
  Company,
  CompanyStats,
  CreateCompanyRequest,
} from "./companies";

export { employeeApi, employeeStatsApi } from "./employees";
export type {
  Employee,
  EmployeeStats,
  CreateEmployeeRequest,
} from "./employees";

export { vaultApi } from "./vaults";
export type { Vault, VaultBalance, CreateVaultRequest } from "./vaults";

export { policyApi } from "./policies";
export type {
  Policy,
  PolicyRequest
} from "./policies";

export { ledgerApi } from "./ledger";
export type {
  LedgerEntry,
  LedgerSummary,
  LedgerEntryType,
  LedgerEntryStatus,
} from "./ledger";

export { kybApi } from "./kyb";
export type {
  KYBStatus,
  KYBStatusResponse,
  KYBSubmissionRequest,
  KYBData,
} from "./kyb";

// x402 Payment Protocol
export {
  X402_VERSION,
  createPayment,
  parsePaymentRequired,
  fetchWithPayment,
  formatAuditFee,
  hasSufficientBalance,
} from "../x402";
export type {
  PaymentRequirements,
  PaymentProof,
  X402PaymentResult,
} from "../x402";
