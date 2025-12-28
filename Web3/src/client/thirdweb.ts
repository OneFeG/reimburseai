/**
 * Thirdweb Client Factory
 * =======================
 * Creates and manages Thirdweb client instances for server-side operations.
 */

import { createThirdwebClient, type ThirdwebClient } from 'thirdweb';
import { avalancheFuji, avalanche } from 'thirdweb/chains';
import { getConfig, getCurrentNetwork } from '../config/index.js';

// Singleton client instance
let _client: ThirdwebClient | null = null;

/**
 * Create or retrieve the Thirdweb client singleton
 * Uses secret key for server-side operations
 */
export function getThirdwebClient(): ThirdwebClient {
  if (!_client) {
    const config = getConfig();
    
    _client = createThirdwebClient({
      secretKey: config.THIRDWEB_SECRET_KEY,
      // Optional: Add client ID for analytics
      ...(config.THIRDWEB_CLIENT_ID && { clientId: config.THIRDWEB_CLIENT_ID }),
    });
  }
  
  return _client;
}

/**
 * Create a new client (for testing or custom configurations)
 */
export function createClient(secretKey: string, clientId?: string): ThirdwebClient {
  return createThirdwebClient({
    secretKey,
    ...(clientId && { clientId }),
  });
}

/**
 * Get the current chain based on network configuration
 */
export function getCurrentChain() {
  const { isMainnet } = getCurrentNetwork();
  return isMainnet ? avalanche : avalancheFuji;
}

/**
 * Get chain by ID
 */
export function getChainById(chainId: number) {
  switch (chainId) {
    case 43113:
      return avalancheFuji;
    case 43114:
      return avalanche;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}

export { avalancheFuji, avalanche };
