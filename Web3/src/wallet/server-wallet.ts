/**
 * Server Wallet Service
 * =====================
 * Manages server-side wallets using Thirdweb's API.
 * Each company gets a unique server wallet that acts as their Treasury Vault.
 * 
 * Architecture:
 * - Company Wallet: Self-custodial vault for company funds
 * - Auditor Wallet: Receives x402 micro-payments for audit services
 * - Operator: Application can execute pre-approved payments
 * - Admin: Company retains full control (withdraw, manage)
 */

import { getThirdwebClient, getCurrentChain } from '../client/thirdweb.js';
import { getConfig, formatAddress, getCurrentNetwork } from '../config/index.js';
import type { ThirdwebClient } from 'thirdweb';

// Thirdweb API base URL for server wallet operations
const THIRDWEB_API_URL = 'https://api.thirdweb.com';

export interface ServerWallet {
  address: `0x${string}`;
  identifier: string;
  createdAt: string;
  profiles: Array<{
    type: string;
    identifier: string;
  }>;
}

export interface CreateWalletResult {
  success: boolean;
  wallet?: ServerWallet;
  error?: string;
}

export interface ListWalletsResult {
  wallets: ServerWallet[];
  pagination: {
    hasMore: boolean;
    limit: number;
    page: number;
  };
}

/**
 * ServerWalletService handles creation and management of server-side wallets
 */
export class ServerWalletService {
  private client: ThirdwebClient;
  private secretKey: string;
  
  constructor() {
    const config = getConfig();
    this.client = getThirdwebClient();
    this.secretKey = config.THIRDWEB_SECRET_KEY;
  }
  
  /**
   * Create a new server wallet with the given identifier
   * Used when onboarding a new company to create their Treasury Vault
   * 
   * @param identifier - Unique identifier for the wallet (e.g., "company-{companyId}")
   */
  async createWallet(identifier: string): Promise<CreateWalletResult> {
    try {
      const response = await fetch(`${THIRDWEB_API_URL}/v1/wallets/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-secret-key': this.secretKey,
        },
        body: JSON.stringify({ identifier }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create wallet: ${response.status}`);
      }
      
      const data = await response.json();
      const wallet: ServerWallet = {
        address: data.result.address as `0x${string}`,
        identifier,
        createdAt: data.result.createdAt,
        profiles: data.result.profiles || [{ type: 'server', identifier }],
      };
      
      console.log(`✅ Created server wallet: ${formatAddress(wallet.address)} (${identifier})`);
      
      return { success: true, wallet };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to create wallet: ${message}`);
      return { success: false, error: message };
    }
  }
  
  /**
   * Get or create a wallet by identifier
   * Returns existing wallet if found, creates new one if not
   */
  async getOrCreateWallet(identifier: string): Promise<ServerWallet> {
    // First try to find existing wallet
    const existing = await this.findWalletByIdentifier(identifier);
    if (existing) {
      console.log(`📍 Found existing wallet: ${formatAddress(existing.address)} (${identifier})`);
      return existing;
    }
    
    // Create new wallet if not found
    const result = await this.createWallet(identifier);
    if (!result.success || !result.wallet) {
      throw new Error(result.error || 'Failed to create wallet');
    }
    
    return result.wallet;
  }
  
  /**
   * Find a wallet by its identifier
   */
  async findWalletByIdentifier(identifier: string): Promise<ServerWallet | null> {
    const { wallets } = await this.listWallets(100);
    
    return wallets.find((w) => 
      w.identifier === identifier || 
      w.profiles.some((p) => p.identifier === identifier)
    ) || null;
  }
  
  /**
   * List all server wallets for this project
   */
  async listWallets(limit = 50, page = 1): Promise<ListWalletsResult> {
    try {
      const response = await fetch(
        `${THIRDWEB_API_URL}/v1/wallets/server?limit=${limit}&page=${page}`,
        {
          method: 'GET',
          headers: {
            'x-secret-key': this.secretKey,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to list wallets: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        wallets: data.result.wallets.map((w: any) => ({
          address: w.address as `0x${string}`,
          identifier: w.profiles?.[0]?.identifier || 'unknown',
          createdAt: w.createdAt,
          profiles: w.profiles || [],
        })),
        pagination: data.result.pagination,
      };
    } catch (error) {
      console.error('Failed to list wallets:', error);
      return { wallets: [], pagination: { hasMore: false, limit, page } };
    }
  }
  
  /**
   * Create company treasury wallet
   * Called during company onboarding
   */
  async createCompanyTreasuryWallet(companyId: string, companyName: string): Promise<ServerWallet> {
    const identifier = `company-treasury-${companyId}`;
    
    console.log(`🏦 Creating Treasury Vault for ${companyName}...`);
    
    const wallet = await this.getOrCreateWallet(identifier);
    
    console.log(`✅ Treasury Vault ready: ${formatAddress(wallet.address)}`);
    console.log(`   Company: ${companyName}`);
    console.log(`   Network: ${getCurrentNetwork().chain.name}`);
    
    return wallet;
  }
  
  /**
   * Get the main application treasury wallet
   */
  async getApplicationTreasuryWallet(): Promise<ServerWallet> {
    const config = getConfig();
    return this.getOrCreateWallet(config.SERVER_WALLET_IDENTIFIER);
  }
  
  /**
   * Get the auditor agent wallet
   */
  async getAuditorWallet(): Promise<ServerWallet> {
    const config = getConfig();
    return this.getOrCreateWallet(config.AUDITOR_WALLET_IDENTIFIER);
  }
}

// Export singleton instance
export const serverWalletService = new ServerWalletService();
