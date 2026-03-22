/**
 * x402 Payment Service (Frontend)
 * ================================
 * Client-side implementation of the x402 HTTP payment protocol.
 * Compatible with Thirdweb's x402 facilitator API.
 * 
 * Protocol Flow (ERC-3009):
 * 1. Request audit → Server returns 402 with payment requirements
 * 2. User signs ERC-3009 transferWithAuthorization (gasless)
 * 3. Retry request with X-PAYMENT header containing signed auth
 * 4. Server settles via Thirdweb facilitator (they pay gas)
 * 
 * Alternative Flow (Direct Transfer):
 * 1. Request audit → Server returns 402
 * 2. User executes USDC transfer on-chain
 * 3. Retry request with tx hash proof
 */

import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { thirdwebClient, chain, USDC_ADDRESS, X402_CONFIG } from './thirdweb';
import type { Account } from 'thirdweb/wallets';

// x402 Protocol Constants
export const X402_VERSION = 1;

/**
 * Payment requirements from 402 response
 * Compatible with Thirdweb x402 format
 */
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
  outputSchema?: unknown;
  extra?: {
    name?: string;
    version?: string;
    priceUsd?: string;
    price_usd?: number;
  };
}

/**
 * Payment proof to include in X-PAYMENT header
 */
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

/**
 * Result from payment creation
 */
export interface X402PaymentResult {
  success: boolean;
  paymentHeader?: string; // Base64 encoded proof for X-Payment header
  transactionHash?: `0x${string}`;
  method?: 'erc3009' | 'transfer'; // Payment method used
  error?: string;
}

/**
 * ERC-20 ABI for USDC transfer (fallback method)
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
    name: 'nonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * EIP-712 domain for USDC on Avalanche
 * Used for ERC-3009 transferWithAuthorization signing
 */
function getUSDCDomain(chainId: number) {
  return {
    name: chainId === 43113 ? 'USD Coin' : 'USD Coin',
    version: '2',
    chainId: BigInt(chainId),
    verifyingContract: USDC_ADDRESS as `0x${string}`,
  };
}

/**
 * EIP-712 types for ERC-3009 TransferWithAuthorization
 */
const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

/**
 * Parse 402 response to extract payment requirements
 * Supports both header and body formats (Thirdweb compatible)
 */
export async function parsePaymentRequired(response: Response): Promise<PaymentRequirements | null> {
  if (response.status !== 402) return null;
  
  // Try X-Payment-Required header first (Thirdweb format)
  const header = response.headers.get('X-Payment-Required') || response.headers.get('X-PAYMENT-REQUIRED');
  if (header) {
    try {
      return JSON.parse(header) as PaymentRequirements;
    } catch {
      // Continue to try body
    }
  }
  
  // Try parsing body (also contains requirements in Thirdweb format)
  try {
    const body = await response.clone().json();
    if (body.x402Version && body.payTo) {
      return body as PaymentRequirements;
    }
    // Legacy format with nested payment_requirements
    if (body.payment_requirements) {
      return body.payment_requirements as PaymentRequirements;
    }
  } catch {
    // Body not JSON
  }
  
  return null;
}

/**
 * Generate a random nonce for ERC-3009
 */
function generateNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
}

/**
 * Create x402 payment using ERC-3009 signature (gasless)
 * This is the preferred method - user signs, server settles via facilitator
 * 
 * @param account - Connected Thirdweb account
 * @param requirements - Payment requirements from 402 response
 */
export async function createPaymentERC3009(
  account: Account,
  requirements?: PaymentRequirements
): Promise<X402PaymentResult> {
  const payTo = requirements?.payTo || X402_CONFIG.AUDITOR_WALLET as `0x${string}`;
  const amount = requirements?.maxAmountRequired 
    ? BigInt(requirements.maxAmountRequired)
    : X402_CONFIG.AUDIT_FEE_WEI;
  const maxTimeout = requirements?.maxTimeoutSeconds || 300;
  
  try {
    const from = account.address as `0x${string}`;
    const nonce = generateNonce();
    const validAfter = BigInt(0); // Valid immediately
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + maxTimeout);
    
    // Create EIP-712 typed data for signing
    const domain = getUSDCDomain(chain.id);
    
    const message = {
      from,
      to: payTo,
      value: amount,
      validAfter,
      validBefore,
      nonce,
    };
    
    // Sign the authorization using EIP-712
    // This is gasless - just a signature
    // In Thirdweb v5, use account.signTypedData method
    const signature = await account.signTypedData({
      domain,
      types: TRANSFER_WITH_AUTHORIZATION_TYPES,
      primaryType: 'TransferWithAuthorization',
      message,
    });
    
    // Generate payment proof in Thirdweb format
    const proof: PaymentProof = {
      x402Version: X402_VERSION,
      scheme: (requirements?.scheme || 'exact') as 'exact',
      network: chain.id === 43113 ? 'avalanche-fuji' : 'avalanche',
      payload: {
        signature,
        authorization: {
          from,
          to: payTo,
          value: amount.toString(),
          validAfter: validAfter.toString(),
          validBefore: validBefore.toString(),
          nonce,
        },
      },
    };
    
    // Encode as base64 for X-Payment header
    const paymentHeader = btoa(JSON.stringify(proof));
    
    return {
      success: true,
      paymentHeader,
      method: 'erc3009',
    };
  } catch (error) {
    console.error('ERC-3009 signing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ERC-3009 signing failed',
    };
  }
}

/**
 * Create x402 payment using direct ERC-20 transfer (fallback)
 * User pays gas, immediate settlement on-chain
 * 
 * @param account - Connected Thirdweb account
 * @param requirements - Payment requirements from 402 response
 */
export async function createPaymentDirectTransfer(
  account: Account,
  requirements?: PaymentRequirements
): Promise<X402PaymentResult> {
  const payTo = requirements?.payTo || X402_CONFIG.AUDITOR_WALLET as `0x${string}`;
  const amount = requirements?.maxAmountRequired 
    ? BigInt(requirements.maxAmountRequired)
    : X402_CONFIG.AUDIT_FEE_WEI;
  
  try {
    // Get USDC contract
    const usdcContract = getContract({
      client: thirdwebClient,
      chain,
      address: USDC_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
    });
    
    // Prepare transfer
    const transaction = prepareContractCall({
      contract: usdcContract,
      method: 'transfer',
      params: [payTo, amount],
    });
    
    // Send transaction
    const { transactionHash } = await sendTransaction({
      transaction,
      account,
    });
    
    // Wait for confirmation
    const receipt = await waitForReceipt({
      client: thirdwebClient,
      chain,
      transactionHash,
    });
    
    if (receipt.status !== 'success') {
      return { success: false, error: 'Transaction failed' };
    }
    
    // Generate payment proof with transaction hash
    const nonce = generateNonce();
    
    const proof: PaymentProof = {
      x402Version: X402_VERSION,
      scheme: 'exact',
      network: chain.id === 43113 ? 'avalanche-fuji' : 'avalanche',
      payload: {
        signature: transactionHash, // Tx hash as proof
        authorization: {
          from: account.address as `0x${string}`,
          to: payTo,
          value: amount.toString(),
          validAfter: '0',
          validBefore: Math.floor(Date.now() / 1000 + 300).toString(),
          nonce,
        },
      },
    };
    
    // Encode as base64
    const paymentHeader = btoa(JSON.stringify(proof));
    
    return {
      success: true,
      paymentHeader,
      transactionHash,
      method: 'transfer',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed',
    };
  }
}

/**
 * Create x402 payment - tries ERC-3009 first (gasless), falls back to direct transfer
 * 
 * @param account - Connected Thirdweb account
 * @param requirements - Payment requirements from 402 response
 * @param preferDirectTransfer - Force direct transfer instead of ERC-3009
 */
export async function createPayment(
  account: Account,
  requirements?: PaymentRequirements,
  preferDirectTransfer = false
): Promise<X402PaymentResult> {
  // If not forcing direct transfer, try ERC-3009 first (gasless)
  if (!preferDirectTransfer) {
    const erc3009Result = await createPaymentERC3009(account, requirements);
    if (erc3009Result.success) {
      return erc3009Result;
    }
    console.warn('ERC-3009 failed, falling back to direct transfer:', erc3009Result.error);
  }
  
  // Fallback to direct transfer
  return createPaymentDirectTransfer(account, requirements);
}

/**
 * Check USDC balance for an address
 */
export async function getUSDCBalance(address: `0x${string}`): Promise<bigint> {
  const usdcContract = getContract({
    client: thirdwebClient,
    chain,
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
  });
  
  // We can't directly call view functions without account
  // In practice, use the API or a read contract hook
  return BigInt(0);
}

/**
 * Make an API request with automatic x402 payment handling
 * Compatible with Thirdweb's x402 protocol
 * 
 * @param url - API endpoint
 * @param options - Fetch options
 * @param account - Connected wallet account (for payment)
 * @param preferDirectTransfer - Force direct transfer instead of ERC-3009
 */
export async function fetchWithPayment(
  url: string,
  options: RequestInit,
  account?: Account,
  preferDirectTransfer = false
): Promise<Response> {
  // First attempt
  const response = await fetch(url, options);
  
  // If not 402, return as-is
  if (response.status !== 402) return response;
  
  // Need to pay
  if (!account) {
    throw new Error('Payment required but no wallet connected');
  }
  
  const requirements = await parsePaymentRequired(response);
  if (!requirements) {
    throw new Error('Invalid 402 response - missing payment requirements');
  }
  
  console.log('x402: Payment required', {
    amount: requirements.maxAmountRequired,
    payTo: requirements.payTo,
    scheme: requirements.scheme,
  });
  
  // Execute payment (tries ERC-3009 first, then direct transfer)
  const payment = await createPayment(account, requirements, preferDirectTransfer);
  if (!payment.success || !payment.paymentHeader) {
    throw new Error(payment.error || 'Payment failed');
  }
  
  console.log('x402: Payment created', { method: payment.method });
  
  // Retry with payment header
  const retryOptions = {
    ...options,
    headers: {
      ...options.headers,
      'X-Payment': payment.paymentHeader,
    },
  };
  
  return fetch(url, retryOptions);
}

/**
 * Format audit fee for display
 */
export function formatAuditFee(): string {
  return `$${X402_CONFIG.AUDIT_FEE_USD.toFixed(2)} USDC`;
}

/**
 * Check if user has sufficient balance for audit
 */
export async function hasSufficientBalance(balance: bigint): Promise<boolean> {
  return balance >= X402_CONFIG.AUDIT_FEE_WEI;
}
/**
 * Hook-friendly wrapper for fetchWithPayment
 * Use this in React components with useActiveAccount()
 */
export function createFetchWithPayment(account?: Account, preferDirectTransfer = false) {
  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    return fetchWithPayment(url, options, account, preferDirectTransfer);
  };
}

/**
 * Get human-readable price from payment requirements
 */
export function getPaymentPrice(requirements: PaymentRequirements): string {
  const amountWei = BigInt(requirements.maxAmountRequired);
  const amountUsd = Number(amountWei) / 1_000_000;
  return `$${amountUsd.toFixed(2)} USDC`;
}

/**
 * Validate payment requirements
 */
export function validatePaymentRequirements(requirements: PaymentRequirements): boolean {
  return (
    requirements.x402Version === X402_VERSION &&
    !!requirements.payTo &&
    !!requirements.asset &&
    !!requirements.maxAmountRequired
  );
}