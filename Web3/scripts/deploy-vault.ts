#!/usr/bin/env npx tsx
/**
 * Deploy Vault Script
 * ===================
 * Deploy a new treasury vault for a company
 * 
 * Usage:
 *   npx tsx scripts/deploy-vault.ts --company-id="acme-corp" --company-name="Acme Corporation" --admin="0x..."
 *   
 * Or for interactive mode:
 *   npx tsx scripts/deploy-vault.ts
 */

import { treasuryService } from '../src/treasury/service.js';
import { getCurrentNetwork } from '../src/config/index.js';
import { parseArgs } from 'node:util';

interface DeployArgs {
  companyId: string;
  companyName: string;
  adminAddress: `0x${string}`;
}

async function parseCliArgs(): Promise<DeployArgs | null> {
  try {
    const { values } = parseArgs({
      options: {
        'company-id': { type: 'string' },
        'company-name': { type: 'string' },
        'admin': { type: 'string' },
        'help': { type: 'boolean', short: 'h' },
      },
    });

    if (values.help) {
      printHelp();
      return null;
    }

    if (values['company-id'] && values['company-name'] && values['admin']) {
      return {
        companyId: values['company-id'],
        companyName: values['company-name'],
        adminAddress: values['admin'] as `0x${string}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function printHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              VAULT DEPLOYMENT SCRIPT                      ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/deploy-vault.ts [options]

Options:
  --company-id    Unique company identifier (e.g., "acme-corp")
  --company-name  Company display name (e.g., "Acme Corporation")
  --admin         Company admin wallet address (EOA)
  -h, --help      Show this help message

Examples:
  # Deploy vault for Acme Corporation
  npx tsx scripts/deploy-vault.ts \\
    --company-id="acme-corp" \\
    --company-name="Acme Corporation" \\
    --admin="0x1234567890abcdef1234567890abcdef12345678"

Environment Variables Required:
  THIRDWEB_CLIENT_ID      Your Thirdweb client ID
  THIRDWEB_SECRET_KEY     Your Thirdweb secret key
  NETWORK                 'fuji' (testnet) or 'mainnet'
`);
}

async function runInteractive(): Promise<DeployArgs> {
  const readline = await import('node:readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           INTERACTIVE VAULT DEPLOYMENT                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const network = getCurrentNetwork();
  console.log(`🌐 Network: ${network.chain.name} (${network.isTestnet ? 'Testnet' : 'Mainnet'})`);
  console.log('');

  const companyId = await question('Company ID (e.g., acme-corp): ');
  const companyName = await question('Company Name (e.g., Acme Corporation): ');
  const adminAddress = await question('Admin Wallet Address (0x...): ');

  rl.close();

  return {
    companyId: companyId.trim(),
    companyName: companyName.trim(),
    adminAddress: adminAddress.trim() as `0x${string}`,
  };
}

function validateArgs(args: DeployArgs): boolean {
  if (!args.companyId || args.companyId.length < 3) {
    console.error('❌ Company ID must be at least 3 characters');
    return false;
  }

  if (!args.companyName || args.companyName.length < 2) {
    console.error('❌ Company name is required');
    return false;
  }

  if (!args.adminAddress || !args.adminAddress.startsWith('0x') || args.adminAddress.length !== 42) {
    console.error('❌ Invalid admin address. Must be a valid Ethereum address (0x...)');
    return false;
  }

  return true;
}

async function main() {
  try {
    let args = await parseCliArgs();

    if (args === null) {
      // Check if help was requested
      if (process.argv.includes('-h') || process.argv.includes('--help')) {
        return;
      }
      // Run interactive mode
      args = await runInteractive();
    }

    if (!validateArgs(args)) {
      process.exit(1);
    }

    console.log('');
    console.log('🚀 Starting vault deployment...');
    console.log('');

    const result = await treasuryService.onboardCompany(
      args.companyId,
      args.companyName,
      args.adminAddress
    );

    if (result.success) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('                    DEPLOYMENT SUMMARY                      ');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log(JSON.stringify({
        success: true,
        vault: {
          address: result.vault?.vaultAddress,
          chainId: result.vault?.chainId,
          chainName: result.vault?.chainName,
          deployedAt: result.vault?.deployedAt,
        },
        permissions: {
          admin: result.vault?.adminAddress,
          operator: result.vault?.operatorAddress,
        },
      }, null, 2));
      console.log('');
      process.exit(0);
    } else {
      console.error('❌ Deployment failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
