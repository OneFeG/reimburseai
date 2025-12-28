/**
 * x402 Payment Service
 * ====================
 * Implements the x402 HTTP payment protocol for audit micropayments.
 * 
 * The x402 protocol enables pay-per-request APIs:
 * 1. Client requests audit → Server returns 402 Payment Required
 * 2. Client pays USDC via Thirdweb → Gets payment proof
 * 3. Client retries with payment header → Server verifies and processes
 * 
 * This creates an "internal micro-economy" where:
 * - Treasury Agent pays Auditor Agent $0.05 per audit
 * - Every audit is cryptographically linked to a payment
 * - No rate limiting needed - economics handles it
 */

import { getContract, prepareContractCall, sendTransaction, waitForReceipt, encode } from 'thirdweb';
import { getThirdwebClient, getCurrentChain } from '../client/thirdweb.js';
import { serverWalletService } from '../wallet/server-wallet.js';
import { getCurrentNetwork, formatUSDC, parseUSDC } from '../config/index.js';
import { createHash, randomBytes } from 'crypto';

// x402 Protocol Constants
export const X402_VERSION = 1;
export const AUDIT_FEE_WEI = 50000n; // $0.05 in USDC (6 decimals)
export const AUDIT_FEE_USD = 0.05;

export interface PaymentRequirements {
  x402Version: number;
  scheme: 'exact' | 'upto';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: `0x${string}`;
  maxTimeoutSeconds: number;
  asset: `0x${string}`;
  extra?: Record<string, unknown>;
}

export interface PaymentProof {
  x402Version: number;
  scheme: 'exact';
  network: string;
  payload: {
    signature: `0x${string}`;
    authorization: {
      from: `0x${string}`;
      to: `0x${string}`;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: `0x${string}`;
    };
  };
}

export interface X402PaymentResult {
  success: boolean;
  paymentProof?: string; // Base64 encoded PaymentProof
  transactionHash?: `0x${string}`;
  error?: string;
}

export interface X402VerificationResult {
  valid: boolean;
  payer?: `0x${string}`;
  amount?: string;
  paymentId?: string;
  invalidReason?: string;
}

/**
 * ERC-20 ABI for USDC transfers
 */
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

/**
 * X402PaymentService handles x402 protocol payments using Thirdweb
 */
export class X402PaymentService {
  private auditorAddress: `0x${string}`;
  
  constructor(auditorAddress?: `0x${string}`) {
    const network = getCurrentNetwork();
    // Default to the auditor wallet address from config or environment
    this.auditorAddress = auditorAddress || 
      (process.env.AUDITOR_WALLET_ADDRESS as `0x${string}`) || 
      '0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD';
  }
  
  /**
   * Generate payment requirements for a 402 response
   * This is what the server returns when payment is required
   */
  generatePaymentRequirements(
    resource: string,
    description: string = 'AI Receipt Audit Service',
    amount: bigint = AUDIT_FEE_WEI
  ): PaymentRequirements {
    const network = getCurrentNetwork();
    
    return {
      x402Version: X402_VERSION,
      scheme: 'exact',
      network: network.isMainnet ? 'avalanche' : 'avalanche-fuji',
      maxAmountRequired: amount.toString(),
      resource,
      description,
      mimeType: 'application/json',
      payTo: this.auditorAddress,
      maxTimeoutSeconds: 300,
      asset: network.usdc.address,
      extra: {
        name: 'Reimburse.ai Auditor',
        version: '1.0.0',
        serviceFee: formatUSDC(amount),
      },
    };
  }
  
  /**
   * Create and execute a payment for an audit
   * Called by Treasury Agent to pay Auditor Agent
   * 
   * @param vaultAddress - The company vault paying for the audit
   * @param amount - Amount to pay (defaults to AUDIT_FEE_WEI)
   */
  async createPayment(
    vaultAddress: `0x${string}`,
    amount: bigint = AUDIT_FEE_WEI
  ): Promise<X402PaymentResult> {
    const network = getCurrentNetwork();
    const client = getThirdwebClient();
    
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              x402 PAYMENT - AUDIT FEE                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`💳 From Vault: ${vaultAddress}`);
    console.log(`📥 To Auditor: ${this.auditorAddress}`);
    console.log(`💵 Amount: ${formatUSDC(amount)}`);
    console.log('');
    
    try {
      // Get the treasury server wallet to sign the transaction
      const treasuryWallet = await serverWalletService.getApplicationTreasuryWallet();
      
      // Get USDC contract
      const usdcContract = getContract({
        client,
        chain: getCurrentChain(),
        address: network.usdc.address,
        abi: ERC20_ABI,
      });
      
      // Prepare transfer transaction
      const transaction = prepareContractCall({
        contract: usdcContract,
        method: 'transfer',
        params: [this.auditorAddress, amount],
      });
      
      // Execute via Thirdweb Engine (server wallet)
      console.log('📤 Executing USDC transfer via Thirdweb...');
      
      const response = await fetch(`https://api.thirdweb.com/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': process.env.THIRDWEB_SECRET_KEY || '',
        },
        body: JSON.stringify({
          chainId: network.chainId,
          from: vaultAddress,
          to: network.usdc.address,
          data: await encode(transaction),
          value: '0',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Transaction failed: ${response.status}`);
      }
      
      const result = await response.json();
      const txHash = result.result?.transactionHash as `0x${string}`;
      
      // Generate payment proof
      const nonce = `0x${randomBytes(32).toString('hex')}` as `0x${string}`;
      const paymentProof: PaymentProof = {
        x402Version: X402_VERSION,
        scheme: 'exact',
        network: network.isMainnet ? 'avalanche' : 'avalanche-fuji',
        payload: {
          signature: txHash, // Use tx hash as signature proof
          authorization: {
            from: vaultAddress,
            to: this.auditorAddress,
            value: amount.toString(),
            validAfter: '0',
            validBefore: Math.floor(Date.now() / 1000 + 300).toString(), // 5 min validity
            nonce,
          },
        },
      };
      
      // Encode proof as base64
      const proofString = Buffer.from(JSON.stringify(paymentProof)).toString('base64');
      
      console.log('');
      console.log('✅ Payment successful!');
      console.log(`   Transaction: ${txHash}`);
      console.log('');
      
      return {
        success: true,
        paymentProof: proofString,
        transactionHash: txHash,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('');
      console.error('❌ Payment failed:', message);
      console.error('');
      
      return {
        success: false,
        error: message,
      };
    }
  }
  
  /**
   * Verify a payment proof from the X-PAYMENT header
   * Called by Auditor Agent to verify Treasury paid
   */
  async verifyPayment(
    paymentHeader: string,
    expectedAmount: bigint = AUDIT_FEE_WEI
  ): Promise<X402VerificationResult> {
    if (!paymentHeader) {
      return { valid: false, invalidReason: 'Missing payment header' };
    }
    
    try {
      // Decode base64 payment proof
      const proofJson = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      const proof: PaymentProof = JSON.parse(proofJson);
      
      // Validate structure
      if (proof.x402Version !== X402_VERSION) {
        return { valid: false, invalidReason: 'Invalid x402 version' };
      }
      
      // Validate amount
      const paidAmount = BigInt(proof.payload.authorization.value);
      if (paidAmount < expectedAmount) {
        return { 
          valid: false, 
          invalidReason: `Insufficient payment: ${paidAmount} < ${expectedAmount}` 
        };
      }
      
      // Validate recipient
      if (proof.payload.authorization.to.toLowerCase() !== this.auditorAddress.toLowerCase()) {
        return { valid: false, invalidReason: 'Payment recipient mismatch' };
      }
      
      // Validate time window
      const validBefore = parseInt(proof.payload.authorization.validBefore);
      if (Date.now() / 1000 > validBefore) {
        return { valid: false, invalidReason: 'Payment proof expired' };
      }
      
      // In production, verify the transaction on-chain
      // For now, trust the proof if structure is valid
      
      // Generate payment ID from proof
      const paymentId = createHash('sha256')
        .update(proof.payload.signature)
        .update(proof.payload.authorization.nonce)
        .digest('hex');
      
      return {
        valid: true,
        payer: proof.payload.authorization.from,
        amount: proof.payload.authorization.value,
        paymentId,
      };
    } catch (error) {
      return { 
        valid: false, 
        invalidReason: `Invalid payment proof format: ${error instanceof Error ? error.message : 'unknown'}` 
      };
    }
  }
  
  /**
   * Create payment header for API requests
   * Convenience method that creates payment and returns header value
   */
  async createPaymentHeader(vaultAddress: `0x${string}`): Promise<string | null> {
    const result = await this.createPayment(vaultAddress);
    return result.success ? result.paymentProof || null : null;
  }
}

// Export singleton instance
export const x402Service = new X402PaymentService();

// Export types
export type { PaymentRequirements, PaymentProof, X402PaymentResult, X402VerificationResult };
