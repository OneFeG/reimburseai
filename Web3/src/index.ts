/**
 * @reimburseai/web3
 * =================
 * Production-ready Web3 infrastructure for reimburse.ai
 * 
 * This package provides:
 * - Vault Factory: Deploy smart wallet vaults for company treasuries
 * - Permissions: RBAC with Admin/Operator roles
 * - USDC: Token transfers on Avalanche (Fuji/Mainnet)
 * - Treasury: Orchestration service for all operations
 * - x402: Micropayment protocol for audit fees
 * 
 * Architecture:
 * - Thirdweb SDK v5 for blockchain interactions
 * - Server Wallets via Thirdweb API for secure key management
 * - Avalanche for fast, low-cost USDC transfers
 * - x402 protocol for pay-per-audit micropayments
 * 
 * @packageDocumentation
 */

// Vault Factory - Deploy company treasury vaults
export {
  vaultFactoryService,
  VaultFactoryService,
  type DeployedVault,
  type VaultDeploymentConfig,
  type VaultInfo,
} from './vault/factory.js';

// Permissions - RBAC management
export {
  permissionsService,
  PermissionsService,
  type VaultPermissions,
  type PermissionResult,
  type PermissionConfig,
} from './permissions/service.js';

// USDC - Token operations
export {
  usdcService,
  USDCService,
  type USDCBalance,
  type TransferRequest,
  type TransferResult,
} from './usdc/service.js';

// Treasury - Main orchestration service
export {
  treasuryService,
  TreasuryService,
  type AuditProof,
  type PaymentRequest,
  type PaymentResult,
  type CompanyOnboardingResult,
} from './treasury/service.js';

// Server Wallet - Wallet management
export {
  serverWalletService,
  ServerWalletService,
  type ServerWallet,
  type ServerWalletConfig,
} from './wallet/server-wallet.js';

// x402 Protocol - Micropayments for audit fees
export {
  x402Service,
  X402PaymentService,
  X402_VERSION,
  AUDIT_FEE_WEI,
  AUDIT_FEE_USD,
  type PaymentRequirements,
  type PaymentProof,
  type X402PaymentResult,
  type X402VerificationResult,
} from './x402/service.js';

// Thirdweb Client
export {
  getThirdwebClient,
  getCurrentChain,
  getChainById,
} from './client/thirdweb.js';

// Configuration
export {
  config,
  CHAIN_CONFIG,
  USDC_CONFIG,
  ROLES,
  getCurrentNetwork,
  formatAddress,
  formatUSDC,
  parseUSDC,
} from './config/index.js';

// API Handlers
export {
  apiHandlers,
  type DeployVaultRequest,
  type DeployVaultResponse,
  type ProcessPaymentRequest,
  type ProcessPaymentResponse,
  type VaultStatusResponse,
  type BalanceResponse,
} from './api/handlers.js';

// All types
export type * from './types.js';
