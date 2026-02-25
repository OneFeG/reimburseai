#!/usr/bin/env npx tsx
/**
 * Setup Testnet Script
 * ====================
 * Configure and verify testnet environment for development
 * 
 * This script:
 * 1. Verifies Thirdweb credentials
 * 2. Creates or retrieves server wallets
 * 3. Checks USDC balances
 * 4. Provides testnet USDC faucet links
 * 
 * Usage:
 *   npx tsx scripts/setup-testnet.ts
 */

import { serverWalletService } from '../src/wallet/server-wallet.js';
import { usdcService } from '../src/usdc/service.js';
import { getCurrentNetwork, formatAddress, USDC_CONFIG } from '../src/config/index.js';

interface SetupResult {
  network: {
    name: string;
    chainId: number;
    isTestnet: boolean;
  };
  wallets: {
    treasury: string | null;
    auditor: string | null;
  };
  balances: {
    treasury: string;
    auditor: string;
  };
  status: 'ready' | 'needs-funding' | 'error';
}

async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              TESTNET SETUP VERIFICATION                   ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const network = getCurrentNetwork();
  
  // Step 1: Verify Network
  console.log('📡 Step 1: Verifying Network Configuration');
  console.log('────────────────────────────────────────────');
  console.log(`   Chain: ${network.chain.name}`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   Type: ${network.isTestnet ? '🧪 Testnet' : '🔴 Mainnet'}`);
  console.log(`   RPC: ${network.chain.rpcUrl}`);
  console.log(`   Explorer: ${network.chain.explorerUrl}`);
  console.log('');

  if (!network.isTestnet) {
    console.warn('⚠️  WARNING: You are connected to MAINNET!');
    console.warn('   Set NETWORK=fuji in your .env for testnet');
    console.log('');
  }

  // Step 2: Verify Credentials
  console.log('🔑 Step 2: Verifying Thirdweb Credentials');
  console.log('────────────────────────────────────────────');
  
  const clientId = process.env.THIRDWEB_CLIENT_ID;
  const secretKey = process.env.THIRDWEB_SECRET_KEY;
  
  if (!clientId || !secretKey) {
    console.error('   ❌ Missing credentials!');
    console.error('');
    console.error('   Please set the following environment variables:');
    console.error('     THIRDWEB_CLIENT_ID=your-client-id');
    console.error('     THIRDWEB_SECRET_KEY=your-secret-key');
    console.error('');
    console.error('   Get these from: https://thirdweb.com/dashboard/settings/api-keys');
    process.exit(1);
  }
  
  console.log(`   ✓ Client ID: ${clientId.substring(0, 8)}...`);
  console.log(`   ✓ Secret Key: ${secretKey.substring(0, 8)}...`);
  console.log('');

  // Step 3: Setup Server Wallets
  console.log('👛 Step 3: Setting Up Server Wallets');
  console.log('────────────────────────────────────────────');

  let treasuryWallet: string | null = null;
  let auditorWallet: string | null = null;
  
  try {
    console.log('   Creating/retrieving application treasury wallet...');
    const treasury = await serverWalletService.getApplicationTreasuryWallet();
    treasuryWallet = treasury.address;
    console.log(`   ✓ Treasury: ${formatAddress(treasuryWallet as `0x${string}`)}`);
    console.log(`     Full: ${treasuryWallet}`);
  } catch (error) {
    console.error('   ❌ Failed to create treasury wallet:', error);
  }

  try {
    console.log('   Creating/retrieving auditor wallet...');
    const auditor = await serverWalletService.getAuditorWallet();
    auditorWallet = auditor.address;
    console.log(`   ✓ Auditor: ${formatAddress(auditorWallet as `0x${string}`)}`);
    console.log(`     Full: ${auditorWallet}`);
  } catch (error) {
    console.error('   ❌ Failed to create auditor wallet:', error);
  }
  console.log('');

  // Step 4: Check USDC Balances
  console.log('💰 Step 4: Checking USDC Balances');
  console.log('────────────────────────────────────────────');
  
  const usdcAddress = network.isTestnet ? USDC_CONFIG.testnet : USDC_CONFIG.mainnet;
  console.log(`   USDC Contract: ${usdcAddress}`);
  console.log('');

  let treasuryBalance = '0.00';
  let auditorBalance = '0.00';

  if (treasuryWallet) {
    try {
      const balance = await usdcService.getBalance(treasuryWallet as `0x${string}`);
      treasuryBalance = balance.balanceFormatted;
      console.log(`   Treasury Balance: ${treasuryBalance} USDC`);
    } catch (error) {
      console.log('   Treasury Balance: Unable to fetch');
    }
  }

  if (auditorWallet) {
    try {
      const balance = await usdcService.getBalance(auditorWallet as `0x${string}`);
      auditorBalance = balance.balanceFormatted;
      console.log(`   Auditor Balance: ${auditorBalance} USDC`);
    } catch (error) {
      console.log('   Auditor Balance: Unable to fetch');
    }
  }
  console.log('');

  // Step 5: Provide Faucet Links
  const needsFunding = parseFloat(treasuryBalance) < 10 || parseFloat(auditorBalance) < 1;
  
  if (network.isTestnet && needsFunding) {
    console.log('🚰 Step 5: Get Testnet Tokens');
    console.log('────────────────────────────────────────────');
    console.log('');
    console.log('   Your wallets need funding! Use these faucets:');
    console.log('');
    console.log('   1. AVAX (for gas fees):');
    console.log('      https://core.app/tools/testnet-faucet/?subnet=c&token=c');
    console.log('');
    console.log('   2. Testnet USDC:');
    console.log('      Option A: Use Aave Faucet');
    console.log('        https://staging.aave.com/faucet/');
    console.log('        (Connect wallet, select Avalanche Fuji, mint USDC)');
    console.log('');
    console.log('      Option B: Circle Testnet');
    console.log('        https://faucet.circle.com/');
    console.log('');
    console.log('   Wallet Addresses to Fund:');
    if (treasuryWallet) {
      console.log(`      Treasury: ${treasuryWallet}`);
    }
    if (auditorWallet) {
      console.log(`      Auditor: ${auditorWallet}`);
    }
    console.log('');
  }

  // Final Summary
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    SETUP SUMMARY                          ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const result: SetupResult = {
    network: {
      name: network.chain.name,
      chainId: network.chainId,
      isTestnet: network.isTestnet,
    },
    wallets: {
      treasury: treasuryWallet,
      auditor: auditorWallet,
    },
    balances: {
      treasury: treasuryBalance,
      auditor: auditorBalance,
    },
    status: needsFunding ? 'needs-funding' : 'ready',
  };

  console.log(JSON.stringify(result, null, 2));
  console.log('');

  if (result.status === 'ready') {
    console.log('✅ Testnet environment is ready for development!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Deploy a test vault:');
    console.log('     npx tsx scripts/deploy-vault.ts');
    console.log('');
    console.log('  2. Run the test suite:');
    console.log('     npm test');
    console.log('');
  } else if (result.status === 'needs-funding') {
    console.log('⚠️  Wallets need funding before you can test transactions.');
    console.log('   Use the faucet links above to get testnet tokens.');
    console.log('');
  }

  process.exit(result.status === 'error' ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
