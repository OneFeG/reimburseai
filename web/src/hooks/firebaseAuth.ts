// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_FIREBASE,
  authDomain: "reembolsoaiauth.firebaseapp.com",
  projectId: "reembolsoaiauth",
  storageBucket: "reembolsoaiauth.firebasestorage.app",
  messagingSenderId: "330895162626",
  appId: process.env.NEXT_PUBLIC_API_FIREBASE_APP_ID,
};

// Singleton para evitar errores de inicialización múltiple
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
