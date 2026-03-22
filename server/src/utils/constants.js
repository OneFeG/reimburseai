import { avalancheFuji, celoSepoliaTestnet } from "thirdweb/chains";
import { HOST } from "../../config.js";

export const PRICE_PER_INFERENCE_TOKEN_WEI = 1;
export const MAX_INFERENCE_TOKENS_PER_CALL = 10000;

export const paymentChain = celoSepoliaTestnet;

// USDC Token on Celo Sepolia Testnet
export const paymentToken = {
  address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",
  decimals: 6,
  symbol: "USDC",
  name: "Token USDC",
};
/*export const paymentToken = {
  address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E",//0xEd9A3541f06E45E3d92E937AA74eD878127318E0
  decimals: 18,
  symbol: "CCOP",
  name: "Token Celo Colombian Peso",
};*/


// USDR Token on Celo Sepolia Testnet
/*export const paymentToken = {
  address: "0xd801516bdad87e223a4819289B32F975caa72771",
  decimals: 18,
  symbol: "USDR",
  name: "USDR Token",
};*/
// Avalanche Fuji Testnet
/*export const paymentToken = {
  address: "0xaf82969ecf299c1f1bb5e1d12ddacc9027431160",
  decimals: 6,
  symbol: "USDC",
  name: "USD Coin",
};*/
export const API_BASE_URL = HOST;
