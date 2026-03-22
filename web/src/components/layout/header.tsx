"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ChevronRight,
  Sparkles,
  User,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Technology", href: "#technology" },
  { label: "Security", href: "#security" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "#faq" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "py-3 bg-navy-950/80 backdrop-blur-xl border-b border-white/5"
            : "py-5 bg-transparent",
        )}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="relative z-10">
              <Logo />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/docs"
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors duration-200"
              >
                Documentation
              </Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              {loading ? (
                <div className="w-24 h-10 bg-white/5 rounded-full animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-2 text-white/60 hover:text-white transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  <Link
                    href="/dashboard"
                    className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-cyan-400 rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/auth"
                    className="px-4 py-2 text-sm font-medium text-white hover:text-cyan-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth"
                    className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-black bg-cyan-400 rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/25"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-300 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden relative z-10 p-2 text-white"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-navy-900 border-l border-white/5 p-6 pt-24"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    {item.label}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                ))}
                <Link
                  href="/docs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-lg text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  Documentation
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 space-y-3">
                {user ? (
                  <>
                    <div className="px-4 py-2 flex items-center gap-2 text-white/80 text-sm font-medium">
                      <User className="w-4 h-4" />
                      {user.displayName || user.email?.split("@")[0]}
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-black font-semibold bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white font-semibold bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white font-semibold bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-black font-semibold bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
