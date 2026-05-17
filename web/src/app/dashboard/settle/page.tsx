"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  FileText,
  Landmark,
  Loader2,
  ShieldCheck,
  Ship,
  Wallet,
} from "lucide-react";
import { useDashboardBalance } from "@/app/dashboard/dashboard-balance-context";

type AssetType = "invoice" | "payroll" | "bill_of_lading" | "equity";

const assetOptions = {
  invoice: {
    label: "Credit Invoice (Title Value)",
    identifierLabel: "CUDE / CUFE",
    placeholder: "Enter the CUDE or CUFE code",
    helperText: "Use the official alphanumeric code assigned to the invoice.",
    url: "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafkreidbmcvjaoyip6huyoi7yul5upsxyeab5dme5eumghhh5gbealec54",
    icon: FileText,
  },
  payroll: {
    label: "Payroll",
    identifierLabel: "Social Security Number",
    placeholder: "Enter the social security number",
    helperText:
      "Provide the employee social security number associated with the payroll asset.",
    url: "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafybeidn7bchhqtis7yh6frexws23522ehxmngaq5ffeqkfkxmwokdsbey",
    icon: Wallet,
  },
  bill_of_lading: {
    label: "Bill Of Lading",
    identifierLabel: "Shipment Reference",
    placeholder: "Enter the shipment reference",
    helperText:
      "Use the shipment or carrier reference assigned to the bill of lading.",
    url: "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafybeie7dlvysqj6ti5beowozlqccqiztlqqouxprq3vpuadowaztuibsa",
    icon: Ship,
  },
  equity: {
    label: "Equity",
    identifierLabel: "RUT",
    placeholder: "Enter the numeric RUT",
    helperText: "RUT must contain numbers only.",
    url: "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafybeiamtszpva6jxl5ed6ywawycypngqc4asmgnffxsknkmdoj6z32tuq",
    icon: Landmark,
  },
} satisfies Record<
  AssetType,
  {
    label: string;
    identifierLabel: string;
    placeholder: string;
    helperText: string;
    url: string;
    icon: typeof FileText;
  }
>;

const verificationSteps = [
  "Submitting the ownership inquiry to the custody entity...",
  "Checking that the asset belongs to the current user...",
  "Certifying that the asset is eligible for negotiation...",
];

export default function SettlePage() {
  const { setBalance } = useDashboardBalance();
  const [assetType, setAssetType] = useState<AssetType>("invoice");
  const [identifier, setIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(verificationSteps[0]);
  const [validationError, setValidationError] = useState("");
  const [certifiedAsset, setCertifiedAsset] = useState<AssetType | null>(null);

  const selectedAsset = useMemo(() => assetOptions[assetType], [assetType]);
  const SelectedAssetIcon = selectedAsset.icon;

  const handleSubmit = async () => {
    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      setValidationError(`${selectedAsset.identifierLabel} is required.`);
      return;
    }

    if (assetType === "equity" && !/^\d+$/.test(trimmedIdentifier)) {
      setValidationError("RUT must contain numbers only.");
      return;
    }

    setValidationError("");
    setCertifiedAsset(null);
    setIsLoading(true);
    setLoadingMessage(verificationSteps[0]);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setLoadingMessage(verificationSteps[1]);

      await new Promise((resolve) => setTimeout(resolve, 1300));
      setLoadingMessage(verificationSteps[2]);

      await new Promise((resolve) => setTimeout(resolve, 1200));

      setBalance(1000);
      window.open(selectedAsset.url, "_blank", "noopener,noreferrer");
      setCertifiedAsset(assetType);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Settle</h1>
        <p className="text-white/50 mt-2 max-w-2xl">
          Certify a financial asset for negotiation by selecting the asset type,
          providing its identifier, and simulating the custody verification
          flow.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="relative card overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="w-full max-w-md mx-6 rounded-2xl border border-cyan-400/20 bg-navy-900/95 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        Custody Verification In Progress
                      </p>
                      <p className="text-white/50 text-sm">
                        Please wait while we validate ownership and eligibility.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                    <p className="text-cyan-400 text-sm font-medium">
                      {loadingMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Asset Negotiation Request
                </h2>
                <p className="text-white/50 text-sm">
                  Select the financial asset and submit its identifier for
                  custody verification.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  Financial Asset
                </label>
                <select
                  value={assetType}
                  onChange={(e) => {
                    const nextAsset = e.target.value as AssetType;
                    setAssetType(nextAsset);
                    setIdentifier("");
                    setValidationError("");
                    setCertifiedAsset(null);
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option className="bg-slate-900 text-white" value="invoice">
                    Credit Invoice (Title Value)
                  </option>
                  <option className="bg-slate-900 text-white" value="payroll">
                    Payroll
                  </option>
                  <option
                    className="bg-slate-900 text-white"
                    value="bill_of_lading"
                  >
                    Bill Of Lading
                  </option>
                  <option className="bg-slate-900 text-white" value="equity">
                    Equity
                  </option>
                </select>
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-400/10 flex items-center justify-center">
                    <SelectedAssetIcon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">
                      {selectedAsset.label}
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      {selectedAsset.helperText}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">
                  {selectedAsset.identifierLabel}
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (validationError) setValidationError("");
                  }}
                  disabled={isLoading}
                  placeholder={selectedAsset.placeholder}
                  inputMode={assetType === "equity" ? "numeric" : "text"}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="text-white/40 text-xs mt-2">
                  We use this identifier to verify ownership against custody
                  records before enabling negotiation.
                </p>
              </div>

              {validationError && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                  <p className="text-sm font-medium text-red-400">
                    {validationError}
                  </p>
                </div>
              )}

              {certifiedAsset && (
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <BadgeCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-emerald-400 font-medium">
                        Asset certified for negotiation
                      </p>
                      <p className="text-emerald-300/80 text-sm mt-1">
                        The {assetOptions[certifiedAsset].label.toLowerCase()}{" "}
                        was validated and the certification was opened in a new
                        tab.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting Custody Verification...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      Submit for Certification
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">
              Supported Assets
            </h3>
            <div className="space-y-3">
              {Object.entries(assetOptions).map(([key, asset]) => {
                const Icon = asset.icon;
                const isActive = key === assetType;

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 transition-colors ${
                      isActive
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white/70" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{asset.label}</p>
                        <p className="text-white/40 text-xs">
                          {asset.identifierLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Verification Flow
              </h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white font-medium">
                  1. Asset Identification
                </p>
                <p className="text-white/50 text-sm mt-1">
                  The user selects the asset class and submits the required
                  identifier.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white font-medium">2. Ownership Check</p>
                <p className="text-white/50 text-sm mt-1">
                  The system simulates a consultation with the custody entity to
                  confirm ownership.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-white font-medium">
                  3. Negotiation Certification
                </p>
                <p className="text-white/50 text-sm mt-1">
                  Once validated, the certification opens in a new browser tab.
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Custody Requirement
              </h3>
            </div>
            <p className="text-white/50 text-sm">
              Every settlement request must pass a custody validation step to
              prove that the selected asset belongs to the current user before
              it can be negotiated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
