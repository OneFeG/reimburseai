import { makeTransfer } from "./playground/ServerWallet.js";

export async function Reimburse(employeeWalletAddress, amount, serverCompanyWalletAddress) {
  if (!employeeWalletAddress || !employeeWalletAddress.startsWith("0x") || employeeWalletAddress.length !== 42) {
    return { ok: false, error: "employeeWalletAddress is required" };
  }
  if (!serverCompanyWalletAddress || !serverCompanyWalletAddress.startsWith("0x") || serverCompanyWalletAddress.length !== 42) {
    return { ok: false, error: "serverCompanyWalletAddress is required" };
  }

  const transactionHash = await makeTransfer(employeeWalletAddress, amount, serverCompanyWalletAddress);


  return {
    ok: true,
    transactionHash,
  };
}
