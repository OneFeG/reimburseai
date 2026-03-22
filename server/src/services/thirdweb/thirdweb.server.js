import { createThirdwebClient } from "thirdweb";
import {
  THIRDWEB_CLIENT_ID,
  THIRDWEB_SECRET_KEY,
  THIRDWEB_COMPANY_SERVER_WALLET_ADDRESS,
  THIRDWEB_AGENTA_SERVER_WALLET_ADDRESS,
} from "../../../config.js";

export const serverCompanyWalletAddress = THIRDWEB_COMPANY_SERVER_WALLET_ADDRESS;
export const serverAgentAWalletAddress = THIRDWEB_AGENTA_SERVER_WALLET_ADDRESS;

export const serverClient = createThirdwebClient({
  secretKey: THIRDWEB_SECRET_KEY,
});

export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID,
});
