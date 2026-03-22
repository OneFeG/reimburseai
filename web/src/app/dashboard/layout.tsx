"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Logo } from "@/components/ui/logo";
import { useAuth, useProfile } from "@/hooks";
import { CompanySwitcher } from "@/components/dashboard/company-switcher";
import { truncateAddress } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protectedRoute";

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
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
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
  const { loading: authLoading, logout } = useAuth();
  const { employee, company, isCompany, policy, loading: profileLoading } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const loading = authLoading || profileLoading;

  const role = employee?.employee_role || "employee";
  const hasCompanyId = isCompany || !!employee?.company_id;
  const canInviteEmployees = isCompany || role === "manager" || role === "admin";
  const canManageEmployees = isCompany || role === "manager" || role === "admin";
  const hasPolicyId = Boolean(policy?.id);

  const mainNavigation = useMemo(() => {
    if (isCompany) {
      return navigation.filter(
        (item) =>
          item.href === "/dashboard" || item.href === "/dashboard/settings",
      );
    }

    if (!hasCompanyId) {
      return navigation.filter(
        (item) =>
          item.href === "/dashboard" || item.href === "/dashboard/settings",
      );
    }

    if (!hasPolicyId) {
      return navigation.filter((item) => item.href !== "/dashboard/submit");
    }

    return navigation;
  }, [hasCompanyId, hasPolicyId, isCompany]);

  const adminNav = useMemo(() => {
    if (isCompany) return adminNavigation;
    return adminNavigation.filter((item) => {
      if (item.href === "/dashboard/company") return canInviteEmployees;
      if (item.href === "/dashboard/employees") return canManageEmployees;
      if (item.href === "/dashboard/treasury") return canManageEmployees;
      if (item.href === "/dashboard/analytics") return canManageEmployees;
      return false;
    });
  }, [canInviteEmployees, canManageEmployees, isCompany]);

  const isUserAdmin = adminNav.length > 0;

  useEffect(() => {
    if (loading) return;
    if (pathname.startsWith("/dashboard/settings")) return;

    if (pathname === "/dashboard") return;

    if (isCompany) {
      const allowedCompanyRoute = adminNavigation.some(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      );
      if (!allowedCompanyRoute) router.replace("/dashboard");
      return;
    }

    if (!employee) return;

    if (!employee.company_id) {
      router.replace("/dashboard");
      return;
    }

    if (!hasPolicyId && pathname === "/dashboard/submit") {
      router.replace("/dashboard");
      return;
    }
  }, [employee, hasPolicyId, isCompany, loading, pathname, router]);

  // Show loading state while checking authorization
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          {loading ? (
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

    try {
      await logout();
    } catch (e) {
      console.error("Failed to disconnect wallet:", e);
    }

    // Redirect to homepage
    router.push("/");
  };

  return (
    <ProtectedRoute>
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


            {/* Company Switcher */}
            {!isCompany && (
              <div className="px-4 mt-4">
                <CompanySwitcher />
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <div className="mb-2">
                <p className="px-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                  Main
                </p>
              </div>
              {mainNavigation.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onClick={() => setSidebarOpen(false)}
                />
              ))}

              {/* Show admin menu only if: isAdmin (admin wallet) OR user is admin for CURRENT company */}
              {isUserAdmin && (
                <>
                  <div className="mt-6 mb-2 pt-4 border-t border-white/5">
                    <p className="px-3 text-xs font-medium text-white/30 uppercase tracking-wider">
                      Admin
                    </p>
                  </div>
                  {adminNav.map((item) => (
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
                      {isCompany ? company?.name : employee?.name || "User"}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-sm font-medium">
                      {isCompany ? company?.name : employee?.name || "User"}
                    </p>
                    <p className="text-white/40 text-xs">
                      {isCompany ? company?.email : employee?.email || "user@example.com"}
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
    </ProtectedRoute>
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
