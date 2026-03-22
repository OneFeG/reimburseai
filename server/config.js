import dotenv from "dotenv";
dotenv.config();

let firebaseConfig = null;
if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
  } catch (e) {
    console.warn("Invalid FIREBASE_CONFIG JSON");
  }
}

// Server Config
const portFromEnv = Number(process.env.PORT);
export const PORT = Number.isFinite(portFromEnv) && portFromEnv > 0 ? portFromEnv : 8080;
export const HOST = process.env.API_BASE_URL;

export const FIREBASE_CONFIG = firebaseConfig;
// Supabase Config
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;
// AI Config
export const GOOGLE_GENERATIVE_AI_API_KEY =
  process.env.GOOGLE_GENERATIVE_AI_API_KEY;
export const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
// Thirdweb Config
export const THIRDWEB_CLIENT_ID = process.env.THIRDWEB_CLIENT_ID;
export const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
export const THIRDWEB_COMPANY_SERVER_WALLET_ADDRESS =
  process.env.THIRDWEB_COMPANY_SERVER_WALLET_ADDRESS;
export const THIRDWEB_AGENTA_SERVER_WALLET_ADDRESS =
  process.env.THIRDWEB_AGENTA_SERVER_WALLET_ADDRESS;
