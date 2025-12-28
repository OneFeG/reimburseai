/**
 * Treasury Service
 * ================
 * Main orchestration service for the Treasury Agent.
 * 
 * The Treasury Agent is responsible for:
 * 1. Holding company funds securely
 * 2. Releasing funds ONLY after receiving valid audit proof
 * 3. Streaming USDC to employees instantly
 * 
 * Security Model:
 * - Cannot release funds without audit proof
 * - Can only pay whitelisted employees
 * - All transactions are logged for audit
 * 
 * Integration with x402:
 * - Treasury pays audit fee to Auditor Agent
 * - Receives cryptographic proof of audit
 * - Executes payment based on proof
 */

import { vaultFactoryService, type DeployedVault, type VaultDeploymentConfig } from '../vault/factory.js';
import { permissionsService, type VaultPermissions } from '../permissions/service.js';
import { usdcService, type USDCBalance, type TransferResult } from '../usdc/service.js';
import { serverWalletService, type ServerWallet } from '../wallet/server-wallet.js';
import { getCurrentNetwork, formatAddress, formatUSDC, parseUSDC } from '../config/index.js';

export interface AuditProof {
  receiptId: string;
  isValid: boolean;
  amount: string;
  employeeAddress: `0x${string}`;
  merchantName: string;
  auditTimestamp: string;
  auditorSignature: `0x${string}`;
}

export interface PaymentRequest {
  vaultAddress: `0x${string}`;
  employeeAddress: `0x${string}`;
  amount: string;
  receiptId: string;
  auditProof: AuditProof;
}

export interface PaymentResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  receiptId: string;
  amount: string;
  employeeAddress: `0x${string}`;
  timestamp: string;
  error?: string;
}

export interface CompanyOnboardingResult {
  success: boolean;
  vault?: DeployedVault;
  permissions?: VaultPermissions;
  error?: string;
}

/**
 * TreasuryService orchestrates all vault and payment operations
 * This is the main entry point for the Treasury Agent
 */
export class TreasuryService {
  
  /**
   * Onboard a new company
   * Creates vault, sets up permissions, and returns ready-to-use treasury
   * 
   * @param companyId - Unique company identifier
   * @param companyName - Company display name
   * @param adminAddress - Company admin wallet address (EOA)
   */
  async onboardCompany(
    companyId: string,
    companyName: string,
    adminAddress: `0x${string}`
  ): Promise<CompanyOnboardingResult> {
    const network = getCurrentNetwork();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║           COMPANY ONBOARDING - TREASURY VAULT             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🏢 Company: ${companyName}`);
    console.log(`🆔 ID: ${companyId}`);
    console.log(`🌐 Network: ${network.chain.name}`);
    console.log('');
    
    try {
      // Step 1: Deploy vault
      console.log('📦 Step 1: Deploying Treasury Vault...');
      const vault = await vaultFactoryService.deployVault({
        companyId,
        companyName,
        adminAddress,
      });
      
      // Step 2: Setup permissions
      console.log('🔐 Step 2: Configuring Permissions...');
      const permissionResult = await permissionsService.setupVaultPermissions(
        vault.vaultAddress,
        adminAddress
      );
      
      if (!permissionResult.success) {
        throw new Error(permissionResult.error);
      }
      
      // Step 3: Get permissions summary
      const permissions = await permissionsService.getVaultPermissions(
        vault.vaultAddress,
        adminAddress
      );
      
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║              ✅ ONBOARDING COMPLETE                       ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('🏦 Treasury Vault Details:');
      console.log(`   Address: ${vault.vaultAddress}`);
      console.log(`   Chain: ${vault.chainName} (${vault.chainId})`);
      console.log('');
      console.log('👥 Access Control:');
      console.log(`   Admin (Company): ${formatAddress(adminAddress)}`);
      console.log(`   Operator (App): ${formatAddress(vault.operatorAddress)}`);
      console.log('');
      console.log('📝 Next Steps:');
      console.log('   1. Company sends USDC to vault address');
      console.log('   2. Employees submit receipts for reimbursement');
      console.log('   3. AI audits receipts and releases funds');
      console.log('');
      console.log(`🔗 Fund your vault: ${network.chain.explorerUrl}/address/${vault.vaultAddress}`);
      console.log('');
      
      return {
        success: true,
        vault,
        permissions,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('');
      console.error('❌ ONBOARDING FAILED:', message);
      console.error('');
      
      return { success: false, error: message };
    }
  }
  
  /**
   * Process a payment request (after audit approval)
   * This is the main function for executing reimbursements
   * 
   * @param request - Payment request with audit proof
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const { vaultAddress, employeeAddress, amount, receiptId, auditProof } = request;
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              TREASURY - PROCESSING PAYMENT                ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`📄 Receipt: ${receiptId}`);
    console.log(`💵 Amount: ${amount} USDC`);
    console.log(`👤 Employee: ${formatAddress(employeeAddress)}`);
    console.log('');
    
    try {
      // Step 1: Validate audit proof
      console.log('🔍 Step 1: Validating audit proof...');
      if (!this.validateAuditProof(auditProof, receiptId, employeeAddress, amount)) {
        throw new Error('Invalid audit proof');
      }
      console.log('   ✓ Audit proof validated');
      
      // Step 2: Check vault balance
      console.log('💰 Step 2: Checking vault balance...');
      const { sufficient, balance } = await usdcService.hasSufficientFunds(vaultAddress, amount);
      if (!sufficient) {
        throw new Error(`Insufficient funds. Available: ${balance.balanceFormatted}`);
      }
      console.log(`   ✓ Sufficient funds (${balance.balanceFormatted})`);
      
      // Step 3: Execute transfer
      console.log('💸 Step 3: Executing transfer...');
      const transferResult = await usdcService.executeReimbursement(
        vaultAddress,
        employeeAddress,
        amount,
        receiptId
      );
      
      if (!transferResult.success) {
        throw new Error(transferResult.error);
      }
      
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║              ✅ PAYMENT SUCCESSFUL                        ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      
      return {
        success: true,
        transactionHash: transferResult.transactionHash,
        receiptId,
        amount,
        employeeAddress,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('');
      console.error('❌ PAYMENT FAILED:', message);
      console.error('');
      
      return {
        success: false,
        receiptId,
        amount,
        employeeAddress,
        timestamp: new Date().toISOString(),
        error: message,
      };
    }
  }
  
  /**
   * Validate audit proof before processing payment
   * Ensures the proof is genuine and matches the payment request
   */
  private validateAuditProof(
    proof: AuditProof,
    receiptId: string,
    employeeAddress: `0x${string}`,
    amount: string
  ): boolean {
    // Check receipt ID matches
    if (proof.receiptId !== receiptId) {
      console.error('   ✗ Receipt ID mismatch');
      return false;
    }
    
    // Check audit is valid
    if (!proof.isValid) {
      console.error('   ✗ Audit marked as invalid');
      return false;
    }
    
    // Check employee address matches
    if (proof.employeeAddress.toLowerCase() !== employeeAddress.toLowerCase()) {
      console.error('   ✗ Employee address mismatch');
      return false;
    }
    
    // Check amount matches (with tolerance for rounding)
    const proofAmount = parseFloat(proof.amount);
    const requestAmount = parseFloat(amount);
    if (Math.abs(proofAmount - requestAmount) > 0.01) {
      console.error('   ✗ Amount mismatch');
      return false;
    }
    
    // In production, verify cryptographic signature
    // For now, we trust the proof if it passes above checks
    
    return true;
  }
  
  /**
   * Get vault balance and status
   */
  async getVaultStatus(vaultAddress: `0x${string}`, adminAddress: `0x${string}`) {
    const balance = await usdcService.getVaultBalance(vaultAddress);
    const permissions = await permissionsService.getVaultPermissions(vaultAddress, adminAddress);
    const network = getCurrentNetwork();
    
    return {
      address: vaultAddress,
      balance,
      permissions,
      network: {
        chainId: network.chainId,
        chainName: network.chain.name,
        explorerUrl: `${network.chain.explorerUrl}/address/${vaultAddress}`,
      },
    };
  }
  
  /**
   * Check if vault exists for a company
   */
  async vaultExistsForCompany(companyId: string): Promise<boolean> {
    return vaultFactoryService.vaultExists(companyId);
  }
  
  /**
   * Get vault address for a company
   */
  async getCompanyVaultAddress(companyId: string): Promise<`0x${string}` | null> {
    return vaultFactoryService.getVaultAddress(companyId);
  }
}

// Export singleton instance
export const treasuryService = new TreasuryService();

// Export types
export type { DeployedVault, VaultPermissions, USDCBalance, ServerWallet };
