"use client";
import { useAuth, useProfile } from "@/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, newUser, loading } = useAuth();
  const { loading: profileLoading } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || profileLoading ) return;

    if (!user) {
      if (pathname !== "/") router.push("/");
      return;
    }

    if (newUser) {
      if (pathname !== "/registration") router.push("/registration");
      return;
    }

    if (pathname === "/registration" || pathname === "/auth") {
      router.push("/dashboard");
    }
  }, [loading, profileLoading, user, newUser, pathname, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : null;
};
