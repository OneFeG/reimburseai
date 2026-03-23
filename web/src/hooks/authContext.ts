"use client";
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  signOut,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "@/hooks/firebaseAuth";

interface AuthContextType {
  user: User | null;
  newUser: boolean | null;
  markRegistrationComplete: (
    accountType: "employee" | "company",
  ) => Promise<void>;
  loading: boolean;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const NEW_USER_STORAGE_KEY = "reimburseai:newUser";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setUser(null);
      setNewUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setNewUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) return false;

    try {
      const result = await signInWithPopup(auth, googleProvider);

      // Aquí extraemos la metadata adicional
      const details = getAdditionalUserInfo(result);

      const isNew = !!details?.isNewUser;
      setNewUser(isNew);
      return isNew;
    } catch (error) {
      console.error("Error en login:", error);
      return false;
    }
  };

  // LOGIN CLÁSICO
  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) throw new Error("Auth not initialized");
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    setNewUser(false);
    return credential;
  };

  // REGISTRO CLÁSICO
  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!auth) throw new Error("Auth not initialized");
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    // Opcional: Guardar el nombre en el perfil de Firebase
    await updateProfile(userCredential.user, { displayName: name });
    setNewUser(true);
  };

  const markRegistrationComplete = async (
    accountType: "employee" | "company",
  ) => {
    if (!auth) throw new Error("Auth not initialized");
    setLoading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user session found");
    await updateProfile(currentUser, { displayName: accountType });
    setNewUser(false);
    setLoading(false);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
    setNewUser(null);
  };

  if (loading) return null;

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        newUser,
        markRegistrationComplete,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
      },
    },
    children,
  );
};

export const useAuth = () => useContext(AuthContext);
