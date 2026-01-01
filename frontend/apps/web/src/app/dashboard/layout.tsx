"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Receipt,
  Upload,
  History,
  Settings,
  Building2,
  Users,
  Wallet,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  HelpCircle,
  Shield,
  Loader2,
} from "lucide-react";
import { useActiveAccount, useDisconnect } from "thirdweb/react";
import { Logo } from "@/components/ui/logo";
import { useAuth, isAdminWallet } from "@/context/auth-context";
import { CompanySwitcher } from "@/components/dashboard/company-switcher";
import { truncateAddress } from "@/lib/utils";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Submit Expense",
    href: "/dashboard/submit",
    icon: Upload,
  },
  {
    name: "My Expenses",
    href: "/dashboard/expenses",
    icon: Receipt,
  },
  {
    name: "Transaction History",
    href: "/dashboard/history",
    icon: History,
  },
];

const adminNavigation = [
  {
    name: "Company",
    href: "/dashboard/company",
    icon: Building2,
  },
  {
    name: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    name: "Treasury",
    href: "/dashboard/treasury",
    icon: Wallet,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { user, isDemo, isAdmin, is2FAVerified, isLoading, isConnected, logout, disableDemoMode } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const isUserAdmin = user?.employee?.role === "admin";

  // Route protection: Allow access for admin wallet OR demo mode OR 2FA-verified users
  useEffect(() => {
    if (isLoading) return;

    // Admin wallet = full real access (bypasses 2FA for testing)
    if (isAdmin && account?.address) {
      setIsAuthorized(true);
      return;
    }

    // Demo mode = testing access (simulated data)
    if (isDemo) {
      setIsAuthorized(true);
      return;
    }

    // Regular user must have completed 2FA
    if (isConnected && user && is2FAVerified) {
      setIsAuthorized(true);
      return;
    }

    // Connected but not 2FA verified - redirect to verify
    if (isConnected && account?.address && !is2FAVerified) {
      router.push("/verify");
      return;
    }

    // Not authorized - redirect to home
    setIsAuthorized(false);
    router.push("/");
  }, [isDemo, isAdmin, isConnected, user, is2FAVerified, isLoading, router, account?.address]);

  // Show loading state while checking authorization
  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          {isLoading ? (
            <>
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-white/50">Loading...</p>
            </>
          ) : (
            <>
              <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Access Restricted</p>
              <p className="text-white/50 text-sm">Redirecting to home...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    setUserMenuOpen(false);
    
    // Disconnect wallet if connected
    if (account) {
      try {
        disconnect(account as any);
      } catch (e) {
        console.error("Failed to disconnect wallet:", e);
      }
    }
    
    // Disable demo mode if active
    if (isDemo) {
      disableDemoMode();
    } else {
      logout();
    }
    
    // Redirect to homepage
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-navy-800/50 border-r border-white/5 backdrop-blur-xl transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <Link href="/">
              <Logo className="h-8" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Demo badge */}
          {isDemo && (
            <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
              <p className="text-amber-400 text-xs font-medium">Demo Mode</p>
              <p className="text-amber-400/60 text-xs">Using simulated data</p>
            </div>
          )}

          {/* Company Switcher */}
          <div className="px-4 mt-4">
            <CompanySwitcher />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <div className="mb-2">
              <p className="px-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                Main
              </p>
            </div>
            {navigation.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                onClick={() => setSidebarOpen(false)}
              />
            ))}

            {/* Show admin menu only if: isAdmin (admin wallet) OR user is admin for CURRENT company */}
            {(isAdmin || isUserAdmin) && (
              <>
                <div className="mt-6 mb-2 pt-4 border-t border-white/5">
                  <p className="px-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                    Admin
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={pathname === item.href}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </>
            )}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-white/5">
            <NavItem
              item={{ name: "Settings", href: "/dashboard/settings", icon: Settings }}
              isActive={pathname === "/dashboard/settings"}
              onClick={() => setSidebarOpen(false)}
            />
            <NavItem
              item={{ name: "Help", href: "/docs", icon: HelpCircle }}
              isActive={false}
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-navy-900/80 backdrop-blur-xl border-b border-white/5">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white/50 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-white/50 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {isDemo ? "D" : isAdmin ? "A" : user?.employee?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-medium">
                    {isDemo ? "Demo User" : isAdmin ? "Admin" : user?.employee?.name || truncateAddress(user?.employee?.wallet_address || "")}
                  </p>
                  <p className="text-white/40 text-xs">
                    {(isUserAdmin || isAdmin) ? "Admin" : "Employee"}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 py-2 rounded-xl bg-navy-800 border border-white/10 shadow-xl"
                  >
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: { name: string; href: string; icon: any };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive
          ? "bg-cyan-400/10 text-cyan-400"
          : "text-white/50 hover:text-white hover:bg-white/5"
      }`}
    >
      <item.icon className="w-5 h-5" />
      <span className="text-sm font-medium">{item.name}</span>
    </Link>
  );
}
