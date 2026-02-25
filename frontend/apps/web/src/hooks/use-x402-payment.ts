/**
 * React Hook for x402 Payments
 * ============================
 * Provides a convenient hook for components to make x402-gated API calls.
 * Compatible with Thirdweb's x402 protocol.
 * 
 * Usage:
 * ```tsx
 * const { fetchWithPayment, isPaying, error } = useX402Payment();
 * 
 * const handleAudit = async () => {
 *   const response = await fetchWithPayment('/api/audit', {
 *     method: 'POST',
 *     body: JSON.stringify({ receipt_id }),
 *   });
 *   // Handle response...
 * };
 * ```
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import {
  fetchWithPayment as fetchWithPaymentUtil,
  parsePaymentRequired,
  createPayment,
  formatAuditFee,
  type PaymentRequirements,
  type X402PaymentResult,
} from '@/lib/x402';

export interface UseX402PaymentResult {
  /** Make an API request with automatic x402 payment handling */
  fetchWithPayment: (url: string, options?: RequestInit) => Promise<Response>;
  /** Whether a payment is currently in progress */
  isPaying: boolean;
  /** Last error that occurred */
  error: Error | null;
  /** Clear the error state */
  clearError: () => void;
  /** Last payment requirements received (for displaying to user) */
  paymentRequirements: PaymentRequirements | null;
  /** Last payment result */
  lastPayment: X402PaymentResult | null;
  /** Whether the wallet is connected */
  isWalletConnected: boolean;
  /** Formatted audit fee for display */
  auditFee: string;
}

export interface UseX402PaymentOptions {
  /** Called when a 402 response is received, before payment */
  onPaymentRequired?: (requirements: PaymentRequirements) => void;
  /** Called after successful payment */
  onPaymentSuccess?: (result: X402PaymentResult) => void;
  /** Called when payment fails */
  onPaymentError?: (error: Error) => void;
  /** Force direct transfer instead of ERC-3009 */
  preferDirectTransfer?: boolean;
}

export function useX402Payment(options: UseX402PaymentOptions = {}): UseX402PaymentResult {
  const account = useActiveAccount();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [paymentRequirements, setPaymentRequirements] = useState<PaymentRequirements | null>(null);
  const [lastPayment, setLastPayment] = useState<X402PaymentResult | null>(null);

  const {
    onPaymentRequired,
    onPaymentSuccess,
    onPaymentError,
    preferDirectTransfer = false,
  } = options;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchWithPayment = useCallback(
    async (url: string, fetchOptions: RequestInit = {}): Promise<Response> => {
      setError(null);
      
      try {
        // First attempt
        const response = await fetch(url, fetchOptions);
        
        // If not 402, return as-is
        if (response.status !== 402) {
          return response;
        }
        
        // Parse payment requirements
        const requirements = await parsePaymentRequired(response);
        if (!requirements) {
          throw new Error('Invalid 402 response - missing payment requirements');
        }
        
        setPaymentRequirements(requirements);
        onPaymentRequired?.(requirements);
        
        // Need to pay - check wallet
        if (!account) {
          throw new Error('Payment required but no wallet connected');
        }
        
        // Execute payment
        setIsPaying(true);
        
        const payment = await createPayment(account, requirements, preferDirectTransfer);
        setLastPayment(payment);
        
        if (!payment.success || !payment.paymentHeader) {
          const paymentError = new Error(payment.error || 'Payment failed');
          onPaymentError?.(paymentError);
          throw paymentError;
        }
        
        onPaymentSuccess?.(payment);
        
        // Retry with payment header
        const retryOptions = {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'X-Payment': payment.paymentHeader,
          },
        };
        
        return fetch(url, retryOptions);
        
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        onPaymentError?.(errorObj);
        throw errorObj;
      } finally {
        setIsPaying(false);
      }
    },
    [account, preferDirectTransfer, onPaymentRequired, onPaymentSuccess, onPaymentError]
  );

  const auditFee = useMemo(() => formatAuditFee(), []);

  return {
    fetchWithPayment,
    isPaying,
    error,
    clearError,
    paymentRequirements,
    lastPayment,
    isWalletConnected: !!account,
    auditFee,
  };
}

/**
 * Hook to check if we can make x402 payments
 */
export function useCanPayX402(): boolean {
  const account = useActiveAccount();
  return !!account;
}

/**
 * Hook to get the connected wallet address for x402 payments
 */
export function useX402PayerAddress(): `0x${string}` | null {
  const account = useActiveAccount();
  return account?.address as `0x${string}` | null;
}

export default useX402Payment;
