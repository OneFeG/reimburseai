/**
 * API Integration Layer
 * =====================
 * Express endpoints for integrating with the FastAPI backend
 * 
 * This can be used as:
 * 1. A standalone Node.js microservice
 * 2. Routes to integrate into the Next.js API
 * 
 * Endpoints:
 * - POST /api/vault/deploy - Deploy new company vault
 * - GET /api/vault/:companyId/status - Get vault status
 * - POST /api/payment/process - Process a payment
 * - GET /api/usdc/balance/:address - Get USDC balance
 */

import { treasuryService, type AuditProof } from '../treasury/service.js';
import { usdcService } from '../usdc/service.js';
import { vaultFactoryService } from '../vault/factory.js';
import { permissionsService } from '../permissions/service.js';
import { getCurrentNetwork } from '../config/index.js';

/**
 * Request/Response types for API integration
 */
export interface DeployVaultRequest {
  companyId: string;
  companyName: string;
  adminAddress: `0x${string}`;
}

export interface DeployVaultResponse {
  success: boolean;
  data?: {
    vaultAddress: `0x${string}`;
    chainId: number;
    chainName: string;
    operatorAddress: `0x${string}`;
    adminAddress: `0x${string}`;
    deployedAt: string;
    transactionHash: `0x${string}`;
  };
  error?: string;
}

export interface ProcessPaymentRequest {
  vaultAddress: `0x${string}`;
  employeeAddress: `0x${string}`;
  amount: string;
  receiptId: string;
  auditProof: AuditProof;
}

export interface ProcessPaymentResponse {
  success: boolean;
  data?: {
    transactionHash: `0x${string}`;
    receiptId: string;
    amount: string;
    employeeAddress: `0x${string}`;
    timestamp: string;
  };
  error?: string;
}

export interface VaultStatusResponse {
  success: boolean;
  data?: {
    address: `0x${string}`;
    balance: {
      raw: string;
      formatted: string;
      decimals: number;
    };
    permissions: {
      hasAdmin: boolean;
      hasOperator: boolean;
      adminAddress: `0x${string}`;
    };
    network: {
      chainId: number;
      chainName: string;
      explorerUrl: string;
    };
  };
  error?: string;
}

export interface BalanceResponse {
  success: boolean;
  data?: {
    address: `0x${string}`;
    balance: string;
    balanceFormatted: string;
  };
  error?: string;
}

/**
 * API Handler Functions
 * These can be used directly or wrapped in Express/Next.js route handlers
 */
export const apiHandlers = {
  /**
   * Deploy a new vault for a company
   */
  async deployVault(request: DeployVaultRequest): Promise<DeployVaultResponse> {
    try {
      const result = await treasuryService.onboardCompany(
        request.companyId,
        request.companyName,
        request.adminAddress
      );

      if (result.success && result.vault) {
        return {
          success: true,
          data: {
            vaultAddress: result.vault.vaultAddress,
            chainId: result.vault.chainId,
            chainName: result.vault.chainName,
            operatorAddress: result.vault.operatorAddress,
            adminAddress: result.vault.adminAddress,
            deployedAt: result.vault.deployedAt,
            transactionHash: result.vault.transactionHash,
          },
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Process a payment (after audit approval)
   */
  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      const result = await treasuryService.processPayment(request);

      if (result.success) {
        return {
          success: true,
          data: {
            transactionHash: result.transactionHash!,
            receiptId: result.receiptId,
            amount: result.amount,
            employeeAddress: result.employeeAddress,
            timestamp: result.timestamp,
          },
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get vault status for a company
   */
  async getVaultStatus(
    companyId: string,
    adminAddress: `0x${string}`
  ): Promise<VaultStatusResponse> {
    try {
      const vaultAddress = await vaultFactoryService.getVaultAddress(companyId);
      
      if (!vaultAddress) {
        return { success: false, error: 'Vault not found for company' };
      }

      const status = await treasuryService.getVaultStatus(vaultAddress, adminAddress);
      const network = getCurrentNetwork();

      return {
        success: true,
        data: {
          address: vaultAddress,
          balance: {
            raw: status.balance.balance,
            formatted: status.balance.balanceFormatted,
            decimals: status.balance.decimals,
          },
          permissions: status.permissions,
          network: {
            chainId: network.chainId,
            chainName: network.chain.name,
            explorerUrl: status.network.explorerUrl,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get USDC balance for any address
   */
  async getBalance(address: `0x${string}`): Promise<BalanceResponse> {
    try {
      const balance = await usdcService.getBalance(address);
      
      return {
        success: true,
        data: {
          address,
          balance: balance.balance,
          balanceFormatted: balance.balanceFormatted,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Check if vault exists for company
   */
  async vaultExists(companyId: string): Promise<{ exists: boolean; address?: `0x${string}` }> {
    const exists = await vaultFactoryService.vaultExists(companyId);
    const address = exists ? await vaultFactoryService.getVaultAddress(companyId) : undefined;
    return { exists, address: address ?? undefined };
  },

  /**
   * Grant operator role to an address
   */
  async grantOperatorRole(
    vaultAddress: `0x${string}`,
    operatorAddress: `0x${string}`
  ): Promise<{ success: boolean; error?: string }> {
    const result = await permissionsService.grantOperatorRole(vaultAddress, operatorAddress);
    return result;
  },

  /**
   * Revoke operator role from an address
   */
  async revokeOperatorRole(
    vaultAddress: `0x${string}`,
    operatorAddress: `0x${string}`
  ): Promise<{ success: boolean; error?: string }> {
    const result = await permissionsService.revokeOperatorRole(vaultAddress, operatorAddress);
    return result;
  },
};

/**
 * Export types for use in backend integration
 */
export type {
  AuditProof,
};
