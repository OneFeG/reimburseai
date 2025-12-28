#!/usr/bin/env npx tsx
/**
 * Test Payment Script
 * ===================
 * Simulate a complete reimbursement flow for testing
 * 
 * This script:
 * 1. Creates a mock audit proof
 * 2. Processes payment through treasury
 * 3. Verifies the transaction
 * 
 * Usage:
 *   npx tsx scripts/test-payment.ts --vault="0x..." --employee="0x..." --amount="25.50"
 */

import { treasuryService, type AuditProof } from '../src/treasury/service.js';
import { usdcService } from '../src/usdc/service.js';
import { getCurrentNetwork, formatAddress } from '../src/config/index.js';
import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';

interface PaymentArgs {
  vaultAddress: `0x${string}`;
  employeeAddress: `0x${string}`;
  amount: string;
}

async function parseCliArgs(): Promise<PaymentArgs | null> {
  try {
    const { values } = parseArgs({
      options: {
        'vault': { type: 'string' },
        'employee': { type: 'string' },
        'amount': { type: 'string' },
        'help': { type: 'boolean', short: 'h' },
      },
    });

    if (values.help) {
      printHelp();
      return null;
    }

    if (values['vault'] && values['employee'] && values['amount']) {
      return {
        vaultAddress: values['vault'] as `0x${string}`,
        employeeAddress: values['employee'] as `0x${string}`,
        amount: values['amount'],
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
║              TEST PAYMENT SCRIPT                          ║
╚═══════════════════════════════════════════════════════════╝

Usage:
  npx tsx scripts/test-payment.ts [options]

Options:
  --vault       Vault address to pay from
  --employee    Employee address to pay to
  --amount      Amount in USDC (e.g., "25.50")
  -h, --help    Show this help message

Example:
  npx tsx scripts/test-payment.ts \\
    --vault="0xVAULT_ADDRESS" \\
    --employee="0xEMPLOYEE_ADDRESS" \\
    --amount="25.50"

Note: This creates a mock audit proof for testing purposes.
In production, audit proofs come from the Auditor Agent.
`);
}

function generateMockAuditProof(
  employeeAddress: `0x${string}`,
  amount: string
): AuditProof {
  const receiptId = `test-${randomBytes(8).toString('hex')}`;
  
  return {
    receiptId,
    isValid: true,
    amount,
    employeeAddress,
    merchantName: 'Test Merchant',
    auditTimestamp: new Date().toISOString(),
    // Mock signature - in production this would be a real cryptographic signature
    auditorSignature: `0x${randomBytes(65).toString('hex')}` as `0x${string}`,
  };
}

async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║              TEST PAYMENT EXECUTION                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  const args = await parseCliArgs();
  
  if (!args) {
    if (process.argv.includes('-h') || process.argv.includes('--help')) {
      return;
    }
    console.error('❌ Missing required arguments. Use --help for usage information.');
    process.exit(1);
  }

  const network = getCurrentNetwork();
  console.log(`🌐 Network: ${network.chain.name}`);
  console.log(`🏦 Vault: ${args.vaultAddress}`);
  console.log(`👤 Employee: ${formatAddress(args.employeeAddress)}`);
  console.log(`💵 Amount: ${args.amount} USDC`);
  console.log('');

  // Check vault balance first
  console.log('📊 Checking vault balance...');
  const { sufficient, balance } = await usdcService.hasSufficientFunds(
    args.vaultAddress,
    args.amount
  );
  
  console.log(`   Current balance: ${balance.balanceFormatted}`);
  
  if (!sufficient) {
    console.error('');
    console.error('❌ Insufficient funds in vault!');
    console.error(`   Required: ${args.amount} USDC`);
    console.error(`   Available: ${balance.balanceFormatted}`);
    console.error('');
    console.error('   Please fund the vault first.');
    process.exit(1);
  }
  
  console.log('   ✓ Sufficient funds');
  console.log('');

  // Generate mock audit proof
  console.log('📝 Generating mock audit proof...');
  const auditProof = generateMockAuditProof(args.employeeAddress, args.amount);
  console.log(`   Receipt ID: ${auditProof.receiptId}`);
  console.log(`   Timestamp: ${auditProof.auditTimestamp}`);
  console.log('');

  // Get employee balance before
  console.log('📊 Employee balance before:', await getBalanceFormatted(args.employeeAddress));
  console.log('');

  // Process payment
  console.log('💸 Processing payment...');
  const result = await treasuryService.processPayment({
    vaultAddress: args.vaultAddress,
    employeeAddress: args.employeeAddress,
    amount: args.amount,
    receiptId: auditProof.receiptId,
    auditProof,
  });

  console.log('');
  
  if (result.success) {
    // Get balances after
    const vaultBalanceAfter = await usdcService.getVaultBalance(args.vaultAddress);
    const employeeBalanceAfter = await getBalanceFormatted(args.employeeAddress);
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    PAYMENT SUMMARY                         ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(JSON.stringify({
      success: true,
      transactionHash: result.transactionHash,
      receiptId: result.receiptId,
      amount: `${result.amount} USDC`,
      employee: result.employeeAddress,
      timestamp: result.timestamp,
      balances: {
        vaultAfter: vaultBalanceAfter.balanceFormatted,
        employeeAfter: employeeBalanceAfter,
      },
      explorer: `${network.chain.explorerUrl}/tx/${result.transactionHash}`,
    }, null, 2));
    console.log('');
    console.log('✅ Payment completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Payment failed:', result.error);
    process.exit(1);
  }
}

async function getBalanceFormatted(address: `0x${string}`): Promise<string> {
  try {
    const balance = await usdcService.getBalance(address);
    return balance.balanceFormatted;
  } catch {
    return 'Unable to fetch';
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
