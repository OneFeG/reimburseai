import { getContract, Engine } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { client, serverClient } from "../thirdweb.server.js";
import { paymentChain, paymentToken } from "../../../utils/constants.js";

export async function createServerWallet(email) {
  const serverWallet = await Engine.createServerWallet({
    client,
    label: email,
  });
  /*console.log("Server Wallet Address:", serverWallet.address);
  console.log(
    "Server Wallet Smart Account Address:",
    serverWallet.smartAccountAddress,
  );*/
  return serverWallet;
}

export async function getServerWallet(serverCompanyWalletAddress) {
  const serverCompanyAccount = Engine.serverWallet({
    client: serverClient,
    address: serverCompanyWalletAddress,
    chain: paymentChain,
  });
  return serverCompanyAccount;
}

export async function makeTransfer(employeeWalletAddress, amount, serverCompanyWalletAddress) {

  const serverCompanyAccount = await getServerWallet(serverCompanyWalletAddress);

  const usdcContract = getContract({
    client: serverClient,
    address: paymentToken.address,
    chain: paymentChain,
  });

  const transaction = transfer({
    contract: usdcContract,
    to: employeeWalletAddress,
    amount,
  });

  const { transactionId } = await serverCompanyAccount.enqueueTransaction({
    transaction,
  });

  const { transactionHash } = await Engine.waitForTransactionHash({
    client: serverClient,
    transactionId,
  });

  return transactionHash;
}
