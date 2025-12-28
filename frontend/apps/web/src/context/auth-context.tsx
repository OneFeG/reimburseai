"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { api, employeeApi, companyApi, type Employee, type Company } from "@/lib/api";

interface User {
  employee: Employee | null;
  company: Company | null;
  walletAddress: string | null;
  isAdmin: boolean;
  isManager: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const walletAddress = account?.address || null;
  const isConnected = !!walletAddress;

  // Fetch user data from backend
  const fetchUserData = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Get employee by wallet address
      const employeeResponse = await employeeApi.getByWallet(address);

      if (!employeeResponse.success || !employeeResponse.data) {
        // User not found - might be new user (wallet connected but not registered)
        setUser({
          employee: null,
          company: null,
          walletAddress: address,
          isAdmin: false,
          isManager: false,
        });
        return;
      }

      const employee = employeeResponse.data;

      // Set API context for future requests
      api.setContext(employee.company_id, employee.id);

      // Get company data
      const companyResponse = await companyApi.getById(employee.company_id);
      const company = companyResponse.success ? companyResponse.data : null;

      // Determine role based on employee role field
      const isAdmin = employee.role === "admin";
      const isManager = employee.role === "manager" || isAdmin;

      setUser({
        employee,
        company: company || null,
        walletAddress: address,
        isAdmin,
        isManager,
      });
    } catch (err) {
      // Network error or backend not available - still set wallet as connected
      console.error("Failed to fetch user data:", err);
      setUser({
        employee: null,
        company: null,
        walletAddress: address,
        isAdmin: false,
        isManager: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login - triggered after wallet connection
  const login = useCallback(async () => {
    if (!walletAddress) {
      setError("No wallet connected");
      return;
    }
    await fetchUserData(walletAddress);
  }, [walletAddress, fetchUserData]);

  // Logout
  const logout = useCallback(() => {
    if (wallet) {
      disconnect(wallet);
    }
    setUser(null);
    setError(null);
    api.setContext("", ""); // Clear API context
  }, [wallet, disconnect]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (walletAddress) {
      await fetchUserData(walletAddress);
    }
  }, [walletAddress, fetchUserData]);

  // Auto-fetch user data when wallet connects
  useEffect(() => {
    if (walletAddress) {
      fetchUserData(walletAddress);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [walletAddress, fetchUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConnected,
        error,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
