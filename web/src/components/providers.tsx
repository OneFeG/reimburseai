"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SmoothScroll } from "./smooth-scroll";
import { useState } from "react";
import { AuthProvider as FirebaseAuthProvider, ProfileProvider } from "@/hooks";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThirdwebProvider>
        <FirebaseAuthProvider>
          <ProfileProvider>
            <SmoothScroll>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "rgba(17, 17, 22, 0.95)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "#fff",
                    backdropFilter: "blur(12px)",
                  },
                }}
              />
            </SmoothScroll>
          </ProfileProvider>
        </FirebaseAuthProvider>
      </ThirdwebProvider>
    </QueryClientProvider>
  );
}
