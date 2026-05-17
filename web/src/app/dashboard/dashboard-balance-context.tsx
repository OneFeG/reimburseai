"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardBalanceContextValue = {
  balance: number;
  setBalance: (value: number) => void;
};

const DashboardBalanceContext =
  createContext<DashboardBalanceContextValue | null>(null);

export function DashboardBalanceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [balance, setBalance] = useState(200);

  const value = useMemo(
    () => ({
      balance,
      setBalance,
    }),
    [balance],
  );

  return (
    <DashboardBalanceContext.Provider value={value}>
      {children}
    </DashboardBalanceContext.Provider>
  );
}

export function useDashboardBalance() {
  const context = useContext(DashboardBalanceContext);

  if (!context) {
    throw new Error(
      "useDashboardBalance must be used within DashboardBalanceProvider",
    );
  }

  return context;
}
