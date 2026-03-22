import { getUser } from "thirdweb/wallets";
import { predictSmartAccountAddress } from "thirdweb/wallets/smart";
import { client, serverClient } from "../thirdweb.server.js";
import { THIRDWEB_SECRET_KEY } from "../../../../config.js";
import { paymentChain, paymentToken } from "../../../utils/constants.js";

export async function createUserWallet(email) {
  const response = await fetch("https://api.thirdweb.com/v1/wallets/user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-secret-key": THIRDWEB_SECRET_KEY,
    },
    body: JSON.stringify({
      type: "email",
      email,
    }),
  });
  const data = await response.json();
  console.log("User Wallet Data:", data);
  console.log("Profiles: ", data?.result?.profiles);

  const smartWalletAddress = await predictSmartAccountAddress({
    client: serverClient,
    chain: paymentChain,
    adminAddress: data?.result?.address,
  });

  console.log("Smart Wallet Address:", smartWalletAddress);
}

export async function getUserWallet(walletAddress) {
  const user = await getUser({
    client: serverClient,
    walletAddress,
  });
  console.log("User: ", user);
  return user;
}

export async function makeTransfer(to, amount, from) {

 /* const response = await fetch(
    "https://api.thirdweb.com/v1/wallets/user?limit=50&page=1&email=&phone=&address=&externalWalletAddress=&id=&userId=",
    {
      headers: {
        "x-secret-key": THIRDWEB_SECRET_KEY,
      },
    },
  );
  const data = await response.json();
  console.log("User Wallet Data:", data?.result);
  const walletAddress = data?.result?.wallets[0]?.address;*/
  

  /*const responseSend = await fetch("https://api.thirdweb.com/v1/wallets/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-secret-key": THIRDWEB_SECRET_KEY,
    },
    body: JSON.stringify({
      from: walletAddress,
      chainId: paymentChain.id,
      recipients: [
        {
          address: to,
          quantity: amount,
        },
      ],
    }),
  });
  const dataSend = await responseSend.json();
  console.log("Transfer Data ** :", dataSend);

  /* const dataLoad = {
      from,
      chainId: paymentChain.id,
      calls: [
        {
          contractAddress: paymentToken.address,
          method: "function transfer(address to, uint256 amount)",
          params: [to, Number(amount)],
        },
      ],
    };*/

  /*const response = await fetch("https://api.thirdweb.com/v1/contracts/write", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-secret-key": THIRDWEB_SECRET_KEY,
    },
    body: JSON.stringify(dataLoad),
  });

  const data = await response.json();
  console.log("Transfer Data:", data?.error?.issues);
  console.log("Transfer Data ** :", data);

  */
}
