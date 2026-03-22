import { THIRDWEB_SECRET_KEY } from "../../../../config.js";
import { paymentChain } from "../../../utils/constants.js";

//https://portal.thirdweb.com/reference#tag/wallets/post/v1/wallets/sign-message
export async function signMessage(message, from) {
  const response = await fetch(
    "https://api.thirdweb.com/v1/wallets/sign-message",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": THIRDWEB_SECRET_KEY,
      },
      body: JSON.stringify({
        from,
        chainId: paymentChain.id,
        message,
      }),
    },
  );
  const data = await response.json();
  //console.log("Signature data: ", data)
  const signature = data?.result?.signature;
  if (!signature || typeof signature !== "string" || signature.length === 0) {
    throw new Error("thirdweb sign-message returned no signature");
  }
  return signature;
}

//https://portal.thirdweb.com/wallets/adapters
/*import { getAccount } from "thirdweb/wallets";

// Ejemplo: obtener el account de una dirección específica
const account = await getAccount({
  client,
  address: "0xTU_DIRECCION_DE_WALLET",
});*/
