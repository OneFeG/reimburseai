/**
 * Thirdweb Configuration
 * ======================
 * Setup Thirdweb client for wallet connection with In-App Wallets.
 * 
 * Supports:
 * - Email login (passwordless OTP)
 * - Google, Apple, Facebook social login
 * - External wallets (MetaMask, Coinbase, etc.)
 */

import { createThirdwebClient } from "thirdweb";
import { avalancheFuji, avalanche } from "thirdweb/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";

// Create Thirdweb client
export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
});

// Network configuration
export const isTestnet = process.env.NEXT_PUBLIC_NETWORK !== "mainnet";
export const chain = isTestnet ? avalancheFuji : avalanche;

// USDC addresses
export const USDC_ADDRESS = isTestnet
  ? "0x5425890298aed601595a70AB815c96711a31Bc65" // Fuji Testnet
  : "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // Mainnet

/**
 * In-App Wallet Configuration
 * Supports email OTP and social logins (Google, Apple, Facebook)
 * This creates embedded wallets - no browser extension needed!
 */
export const inAppWalletConfig = inAppWallet({
  auth: {
    options: [
      "email",    // Email OTP (passwordless)
      "google",   // Google OAuth
      "apple",    // Apple OAuth
      "facebook", // Facebook OAuth
      "phone",    // Phone number OTP
    ],
  },
});

/**
 * Supported external wallets
 * These require browser extensions or mobile apps
 */
export const externalWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("io.rabby"),
  createWallet("me.rainbow"),
  createWallet("walletConnect"),
];

/**
 * All supported wallets (in-app + external)
 * Order matters - first ones are shown prominently
 */
export const supportedWallets = [
  inAppWalletConfig, // Email & social logins first
  ...externalWallets,
];

/**
 * x402 Payment Configuration
 * Used for audit micropayments
 */
export const X402_CONFIG = {
  // Price per audit in USDC (wei - 6 decimals)
  AUDIT_FEE_WEI: 50000n, // $0.05
  AUDIT_FEE_USD: 0.05,
  // Auditor wallet address (receives payments)
  AUDITOR_WALLET: process.env.NEXT_PUBLIC_AUDITOR_WALLET || "0x2fAC7C9858e07eC8CaaAD17Ff358238BdC95dDeD",
  // Token
  TOKEN: USDC_ADDRESS,
  CHAIN_ID: isTestnet ? 43113 : 43114,
};

/**
 * Format USDC amount for display
 */
export function formatUSDC(wei: bigint): string {
  const whole = wei / 1000000n;
  const fraction = wei % 1000000n;
  return `$${whole}.${fraction.toString().padStart(6, '0').slice(0, 2)}`;
}

/**
 * Parse USD amount to USDC wei
 */
export function parseUSDC(usd: number): bigint {
  return BigInt(Math.floor(usd * 1000000));
}
