"use client";

import { BarChart3 } from "lucide-react";
import { useProfile } from "@/hooks";

export default function AnalyticsPage() {
  const { employee } = useProfile();
  const canView =
    employee?.employee_role === "admin" ||
    employee?.employee_role === "manager";

  if (!canView) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card">
          <p className="text-white/60">Access denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-white/50 mt-1">Coming soon.</p>
      </div>
      <div className="card flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-white/60">
          This dashboard will show spend trends and policy performance.
        </p>
      </div>
    </div>
  );
}
