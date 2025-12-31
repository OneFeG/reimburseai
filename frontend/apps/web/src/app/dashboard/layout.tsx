"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Home,
} from "lucide-react";
import { useActiveAccount, useDisconnect } from "thirdweb/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/context/auth-context";
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
  const account = useActiveAccount();
  const { disconnect } = useDisconnect();
  const { user, isDemo, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.employee?.role === "admin";

  const handleLogout = () => {
    // Attempt to disconnect wallet if present
    try {
      if (account) {
        disconnect(account as any);
      }
    } catch (err) {
      // ignore disconnect errors
    }

    // Clear auth state and redirect to homepage
    logout();
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

            {isAdmin && (
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

          {/* Company label */}
          <div className="hidden md:flex items-center gap-4 ml-4">
            <div className="text-sm text-white/40">Company</div>
            <div className="text-white font-medium text-sm">{user?.company?.name || (isDemo ? "Demo Corporation" : "No company")}</div>
          </div>

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
                    {isDemo ? "D" : user?.employee?.name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-medium">
                    {isDemo ? "Demo User" : user?.employee?.name || truncateAddress(user?.employee?.wallet_address || "")}
                  </p>
                  <p className="text-white/40 text-xs">
                    {isAdmin ? "Admin" : "Employee"}
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
                    className="absolute right-0 mt-2 w-56 py-3 rounded-xl bg-navy-800 border border-white/10 shadow-xl"
                  >
                    {/* User header */}
                    <div className="px-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-400 flex items-center justify-center text-white font-medium">
                          {isDemo ? "D" : user?.employee?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium text-white">{isDemo ? "Demo User" : user?.employee?.name || truncateAddress(user?.employee?.wallet_address || "")}</div>
                          <div className="text-xs text-white/40">{isDemo ? "demo@reimburseai.app" : user?.employee?.email || user?.company?.name || ""}</div>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Profile & Settings
                      </Link>

                      <Link
                        href="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/dashboard/company"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          Company
                        </Link>
                      )}
                    </div>

                    <div className="px-3 pt-2 border-t border-white/5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
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
