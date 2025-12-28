/**
 * Type Definitions
 * ================
 * Central type exports for @reimburseai/web3
 */

// Re-export all types from modules
export type {
  DeployedVault,
  VaultDeploymentConfig,
  VaultInfo,
} from './vault/factory.js';

export type {
  VaultPermissions,
  PermissionResult,
  PermissionConfig,
} from './permissions/service.js';

export type {
  USDCBalance,
  TransferRequest,
  TransferResult,
} from './usdc/service.js';

export type {
  AuditProof,
  PaymentRequest,
  PaymentResult,
  CompanyOnboardingResult,
} from './treasury/service.js';

export type {
  ServerWallet,
  ServerWalletConfig,
} from './wallet/server-wallet.js';

export type {
  DeployVaultRequest,
  DeployVaultResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  VaultStatusResponse,
  BalanceResponse,
} from './api/handlers.js';

// Common utility types
export type Address = `0x${string}`;
export type TransactionHash = `0x${string}`;

// Network types
export interface NetworkConfig {
  chainId: number;
  isTestnet: boolean;
  chain: {
    name: string;
    rpcUrl: string;
    explorerUrl: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
  usdc: Address;
}

// Event types for webhook integration
export interface VaultDeployedEvent {
  eventType: 'vault.deployed';
  companyId: string;
  vaultAddress: Address;
  adminAddress: Address;
  operatorAddress: Address;
  chainId: number;
  timestamp: string;
  transactionHash: TransactionHash;
}

export interface PaymentProcessedEvent {
  eventType: 'payment.processed';
  receiptId: string;
  vaultAddress: Address;
  employeeAddress: Address;
  amount: string;
  timestamp: string;
  transactionHash: TransactionHash;
}

export interface PaymentFailedEvent {
  eventType: 'payment.failed';
  receiptId: string;
  vaultAddress: Address;
  employeeAddress: Address;
  amount: string;
  error: string;
  timestamp: string;
}

export type ReimburseEvent = 
  | VaultDeployedEvent 
  | PaymentProcessedEvent 
  | PaymentFailedEvent;
