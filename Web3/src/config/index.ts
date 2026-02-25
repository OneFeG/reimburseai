/**
 * ReimburseAI Web3 Configuration
 * ================================
 * Centralized configuration for all blockchain operations.
 * Supports both Avalanche Fuji (testnet) and Mainnet.
 */

import { config as dotenvConfig } from 'dotenv';
import { z } from 'zod';

// Load .env file
dotenvConfig();

// Environment variable schema with validation
const envSchema = z.object({
  THIRDWEB_CLIENT_ID: z.string().optional(),
  THIRDWEB_SECRET_KEY: z.string().min(1, 'THIRDWEB_SECRET_KEY is required'),
  USE_MAINNET: z.string().transform((val) => val === 'true').default('false'),
  NETWORK: z.string().default('fuji'),  // Alternative to USE_MAINNET
  AVALANCHE_FUJI_RPC_URL: z.string().url().default('https://api.avax-test.network/ext/bc/C/rpc'),
  AVALANCHE_MAINNET_RPC_URL: z.string().url().default('https://api.avax.network/ext/bc/C/rpc'),
  SERVER_WALLET_IDENTIFIER: z.string().default('reimburseai-treasury'),
  AUDITOR_WALLET_IDENTIFIER: z.string().default('reimburseai-auditor'),
  USDC_TESTNET_ADDRESS: z.string().default('0x5425890298aed601595a70AB815c96711a31Bc65'),
  USDC_MAINNET_ADDRESS: z.string().default('0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'),
  VAULT_FACTORY_ADDRESS: z.string().optional(),
  BACKEND_API_URL: z.string().url().default('http://localhost:8000'),
  BACKEND_API_KEY: z.string().optional(),
  DEBUG_MODE: z.string().transform((val) => val === 'true').default('true'),
  TX_CONFIRMATION_TIMEOUT: z.string().transform(Number).default('60000'),
  MAX_TX_RETRIES: z.string().transform(Number).default('3'),
});

type EnvConfig = z.infer<typeof envSchema>;

/**
 * Load and validate environment variables
 */
function loadEnvConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error('Invalid environment configuration');
  }
  
  return result.data;
}

// Lazy-loaded config singleton
let _config: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!_config) {
    _config = loadEnvConfig();
  }
  return _config;
}

// Export config object for convenience
export const config = {
  get thirdwebClientId() { return getConfig().THIRDWEB_CLIENT_ID; },
  get thirdwebSecretKey() { return getConfig().THIRDWEB_SECRET_KEY; },
  get isMainnet() { return getConfig().USE_MAINNET || getConfig().NETWORK === 'mainnet'; },
  get serverWalletId() { return getConfig().SERVER_WALLET_IDENTIFIER; },
  get auditorWalletId() { return getConfig().AUDITOR_WALLET_IDENTIFIER; },
  get backendUrl() { return getConfig().BACKEND_API_URL; },
  get debugMode() { return getConfig().DEBUG_MODE; },
};

/**
 * Chain Configuration
 */
export const CHAIN_CONFIG = {
  // Avalanche Fuji Testnet
  fuji: {
    chainId: 43113,
    name: 'Avalanche Fuji',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
  // Avalanche Mainnet
  mainnet: {
    chainId: 43114,
    name: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
} as const;

/**
 * USDC Token Configuration
 */
export const USDC_CONFIG = {
  // Testnet USDC on Avalanche Fuji
  testnet: {
    address: '0x5425890298aed601595a70AB815c96711a31Bc65' as `0x${string}`,
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
  },
  // Mainnet USDC on Avalanche C-Chain
  mainnet: {
    address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' as `0x${string}`,
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
  },
} as const;

/**
 * Role Configuration for RBAC
 */
export const ROLES = {
  // Default admin role (keccak256 of empty string)
  ADMIN: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  // Operator role - can execute payments but not withdraw
  OPERATOR: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929' as `0x${string}`, // keccak256("OPERATOR")
  // Signer role - can sign audit proofs
  SIGNER: '0xe2f4eaae4a9751e85a3e4a7b9587827a877f29914755229b07a7b2da98285f70' as `0x${string}`, // keccak256("SIGNER")
} as const;

/**
 * Vault Factory Configuration
 */
export const VAULT_CONFIG = {
  // Default vault deployment parameters
  defaultGasLimit: 500000n,
  // Confirmation blocks to wait
  confirmationBlocks: 2,
  // Maximum retries for deployment
  maxRetries: 3,
  // Retry delay in milliseconds
  retryDelay: 2000,
} as const;

/**
 * Get current network configuration based on USE_MAINNET or NETWORK flag
 */
export function getCurrentNetwork() {
  const config = getConfig();
  // Support both NETWORK=mainnet and USE_MAINNET=true
  const isMainnet = config.USE_MAINNET || config.NETWORK === 'mainnet';
  const isTestnet = !isMainnet;
  
  return {
    chain: isMainnet ? CHAIN_CONFIG.mainnet : CHAIN_CONFIG.fuji,
    usdc: isMainnet ? USDC_CONFIG.mainnet : USDC_CONFIG.testnet,
    isMainnet,
    isTestnet,
    chainId: isMainnet ? 43114 : 43113,
  };
}

/**
 * Format address for display
 */
export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
  const decimals = 6n;
  const divisor = 10n ** decimals;
  const whole = amount / divisor;
  const fraction = amount % divisor;
  return `${whole}.${fraction.toString().padStart(6, '0')} USDC`;
}

/**
 * Parse USDC amount from decimal string
 */
export function parseUSDC(amount: string): bigint {
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(6, '0').slice(0, 6);
  return BigInt(whole) * 1000000n + BigInt(paddedFraction);
}
