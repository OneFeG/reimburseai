import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_FIREBASE,
  authDomain: "reembolsoaiauth.firebaseapp.com",
  projectId: "reembolsoaiauth",
  storageBucket: "reembolsoaiauth.firebasestorage.app",
  messagingSenderId: "330895162626",
  appId: process.env.NEXT_PUBLIC_API_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
if (typeof window !== "undefined" || firebaseConfig.apiKey) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch {
    app = null;
  }
}

export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
