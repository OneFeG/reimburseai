/**
 * USDC Service
 * ============
 * Task C: USDC Token Operations on Avalanche
 * 
 * Handles all USDC-related operations:
 * - Balance checking (vault, employee)
 * - Transfers (reimbursements)
 * - Approval management
 * - x402 micro-payments
 * 
 * Supports:
 * - Avalanche Fuji Testnet (for development)
 * - Avalanche Mainnet (for production)
 */

import { getContract, readContract, prepareContractCall, sendTransaction } from 'thirdweb';
import { transfer, balanceOf, allowance, approve } from 'thirdweb/extensions/erc20';
import { getThirdwebClient, getCurrentChain } from '../client/thirdweb.js';
import { getCurrentNetwork, formatUSDC, parseUSDC, formatAddress } from '../config/index.js';
import type { ThirdwebClient, ThirdwebContract } from 'thirdweb';

// USDC ABI for read operations (minimal)
const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;

export interface USDCBalance {
  address: `0x${string}`;
  balanceWei: bigint;
  balanceFormatted: string;
  balanceUSD: number;
}

export interface TransferResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  amount: string;
  amountWei: bigint;
  error?: string;
}

export interface ApprovalResult {
  success: boolean;
  transactionHash?: `0x${string}`;
  owner: `0x${string}`;
  spender: `0x${string}`;
  amount: string;
  amountWei: bigint;
  error?: string;
}

/**
 * USDCService handles all USDC token operations
 */
export class USDCService {
  private client: ThirdwebClient;
  private chain: ReturnType<typeof getCurrentChain>;
  private usdcAddress: `0x${string}`;
  private decimals: number = 6;
  
  constructor() {
    this.client = getThirdwebClient();
    this.chain = getCurrentChain();
    const network = getCurrentNetwork();
    this.usdcAddress = network.usdc.address;
  }
  
  /**
   * Get USDC contract instance
   */
  private getUSDCContract(): ThirdwebContract {
    return getContract({
      client: this.client,
      chain: this.chain,
      address: this.usdcAddress,
    });
  }
  
  /**
   * Get USDC balance for an address
   * 
   * @param address - Wallet address to check
   * @returns Balance information
   */
  async getBalance(address: `0x${string}`): Promise<USDCBalance> {
    try {
      const contract = this.getUSDCContract();
      
      const balance = await balanceOf({
        contract,
        address,
      });
      
      const balanceNumber = Number(balance) / Math.pow(10, this.decimals);
      
      return {
        address,
        balanceWei: balance,
        balanceFormatted: formatUSDC(balance),
        balanceUSD: balanceNumber,
      };
    } catch (error) {
      console.error('Failed to get USDC balance:', error);
      return {
        address,
        balanceWei: 0n,
        balanceFormatted: '0.000000 USDC',
        balanceUSD: 0,
      };
    }
  }
  
  /**
   * Get vault USDC balance
   */
  async getVaultBalance(vaultAddress: `0x${string}`): Promise<USDCBalance> {
    console.log(`💰 Checking vault balance: ${formatAddress(vaultAddress)}`);
    const balance = await this.getBalance(vaultAddress);
    console.log(`   Balance: ${balance.balanceFormatted}`);
    return balance;
  }
  
  /**
   * Check if vault has sufficient funds for a payment
   */
  async hasSufficientFunds(
    vaultAddress: `0x${string}`,
    amountUSD: string
  ): Promise<{ sufficient: boolean; balance: USDCBalance; required: bigint }> {
    const balance = await this.getBalance(vaultAddress);
    const requiredWei = parseUSDC(amountUSD);
    
    return {
      sufficient: balance.balanceWei >= requiredWei,
      balance,
      required: requiredWei,
    };
  }
  
  /**
   * Get allowance for a spender
   */
  async getAllowance(
    ownerAddress: `0x${string}`,
    spenderAddress: `0x${string}`
  ): Promise<bigint> {
    try {
      const contract = this.getUSDCContract();
      
      const result = await allowance({
        contract,
        owner: ownerAddress,
        spender: spenderAddress,
      });
      
      return result;
    } catch (error) {
      console.error('Failed to get allowance:', error);
      return 0n;
    }
  }
  
  /**
   * Transfer USDC via Thirdweb API
   * Used for reimbursements from vault to employee
   * 
   * @param from - Sender vault address (server wallet)
   * @param to - Recipient employee address
   * @param amountUSD - Amount in USD (e.g., "100.50")
   */
  async transferViaAPI(
    from: `0x${string}`,
    to: `0x${string}`,
    amountUSD: string
  ): Promise<TransferResult> {
    const amountWei = parseUSDC(amountUSD);
    const network = getCurrentNetwork();
    
    console.log('');
    console.log('💸 USDC TRANSFER');
    console.log('─────────────────────────────────────');
    console.log(`📤 From: ${formatAddress(from)}`);
    console.log(`📥 To: ${formatAddress(to)}`);
    console.log(`💰 Amount: ${amountUSD} USDC`);
    console.log(`🔗 Network: ${network.chain.name}`);
    console.log('');
    
    try {
      // Check balance first
      const { sufficient, balance, required } = await this.hasSufficientFunds(from, amountUSD);
      
      if (!sufficient) {
        throw new Error(
          `Insufficient funds. Required: ${formatUSDC(required)}, Available: ${balance.balanceFormatted}`
        );
      }
      
      // Use Thirdweb API for transfer
      const response = await fetch('https://api.thirdweb.com/v1/contracts/write', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': process.env.THIRDWEB_SECRET_KEY!,
        },
        body: JSON.stringify({
          calls: [
            {
              contractAddress: this.usdcAddress,
              method: 'function transfer(address to, uint256 amount)',
              params: [to, amountWei.toString()],
            },
          ],
          chainId: network.chainId,
          from,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Transfer failed: ${response.status}`);
      }
      
      const data = await response.json();
      const transactionHash = data.result?.transactionIds?.[0] || '0x0' as `0x${string}`;
      
      console.log('✅ Transfer successful!');
      console.log(`   Transaction: ${transactionHash}`);
      console.log(`   Explorer: ${network.chain.explorerUrl}/tx/${transactionHash}`);
      console.log('');
      
      return {
        success: true,
        transactionHash: transactionHash as `0x${string}`,
        from,
        to,
        amount: amountUSD,
        amountWei,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Transfer failed:', message);
      
      return {
        success: false,
        from,
        to,
        amount: amountUSD,
        amountWei,
        error: message,
      };
    }
  }
  
  /**
   * Execute reimbursement from company vault to employee
   * This is the main function called after audit approval
   * 
   * @param vaultAddress - Company vault address
   * @param employeeAddress - Employee wallet address (whitelisted)
   * @param amountUSD - Approved reimbursement amount
   * @param receiptId - Receipt ID for audit trail
   */
  async executeReimbursement(
    vaultAddress: `0x${string}`,
    employeeAddress: `0x${string}`,
    amountUSD: string,
    receiptId: string
  ): Promise<TransferResult & { receiptId: string }> {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 EXECUTING REIMBURSEMENT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📄 Receipt ID: ${receiptId}`);
    console.log(`💵 Amount: ${amountUSD} USDC`);
    console.log('');
    
    const result = await this.transferViaAPI(vaultAddress, employeeAddress, amountUSD);
    
    console.log('═══════════════════════════════════════════════════════════');
    if (result.success) {
      console.log('✅ REIMBURSEMENT COMPLETE');
    } else {
      console.log('❌ REIMBURSEMENT FAILED');
    }
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    return {
      ...result,
      receiptId,
    };
  }
  
  /**
   * Execute x402 micro-payment for audit
   * Pays the auditor agent for verifying a receipt
   * 
   * @param fromVault - Company vault paying for audit
   * @param toAuditor - Auditor agent wallet
   * @param auditFeeUSD - Audit fee (default: $0.03)
   */
  async executeAuditPayment(
    fromVault: `0x${string}`,
    toAuditor: `0x${string}`,
    auditFeeUSD: string = '0.03'
  ): Promise<TransferResult> {
    console.log('');
    console.log('🔍 x402 AUDIT PAYMENT');
    console.log('─────────────────────────────────────');
    
    return this.transferViaAPI(fromVault, toAuditor, auditFeeUSD);
  }
  
  /**
   * Get USDC configuration for current network
   */
  getUSDCConfig() {
    const network = getCurrentNetwork();
    return {
      address: network.usdc.address,
      decimals: network.usdc.decimals,
      symbol: network.usdc.symbol,
      name: network.usdc.name,
      chainId: network.chainId,
      chainName: network.chain.name,
      explorerUrl: `${network.chain.explorerUrl}/token/${network.usdc.address}`,
    };
  }
  
  /**
   * Format amount in wei to USD string
   */
  formatToUSD(amountWei: bigint): string {
    return (Number(amountWei) / Math.pow(10, this.decimals)).toFixed(2);
  }
  
  /**
   * Parse USD string to amount in wei
   */
  parseFromUSD(amountUSD: string): bigint {
    return parseUSDC(amountUSD);
  }
}

// Export singleton instance
export const usdcService = new USDCService();

// Export utility functions
export { formatUSDC, parseUSDC };
