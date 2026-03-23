import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC3XAuLZkousjfQJ1_v11JXmpbXWxGUN1Q",
  authDomain: "reembolsoaiauth.firebaseapp.com",
  projectId: "reembolsoaiauth",
  storageBucket: "reembolsoaiauth.firebasestorage.app",
  messagingSenderId: "330895162626",
  appId: "1:330895162626:web:363f1c527950de7e65d61b",
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
