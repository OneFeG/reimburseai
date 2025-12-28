"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThirdwebProvider>
  );
}
