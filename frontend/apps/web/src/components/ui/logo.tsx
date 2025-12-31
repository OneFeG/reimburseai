"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizes = {
    sm: { logo: 28, text: "text-base" },
    md: { logo: 36, text: "text-lg" },
    lg: { logo: 48, text: "text-xl" },
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo Image */}
      <Image
        src="/logo.png"
        alt="Reimburse.ai Logo"
        width={sizes[size].logo}
        height={sizes[size].logo}
        className="object-contain"
        priority
      />

      {showText && (
        <span className={cn("font-bold text-white tracking-tight", sizes[size].text)}>
          Reimburse
          <span className="text-cyan-400">.ai</span>
        </span>
      )}
    </div>
  );
}
