"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Shield,
  FileText,
  Send,
} from "lucide-react";
import {
  kybApi,
  type KYBStatusResponse,
  type KYBSubmissionRequest,
} from "@/lib/api";
import { toast } from "sonner";
import { useProfile } from "@/hooks";

const statusConfig = {
  unsubmitted: {
    icon: FileText,
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
    label: "Not Submitted",
    description:
      "Submit your business verification to unlock full platform features.",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    label: "Under Review",
    description:
      "Your submission is being reviewed. This typically takes 1-2 business days.",
  },
  under_review: {
    icon: Clock,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    label: "Under Review",
    description: "Our compliance team is reviewing your documents.",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    label: "Verified",
    description:
      "Your business has been verified. All platform features are unlocked.",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "Rejected",
    description:
      "Your submission was rejected. Please review the notes and resubmit.",
  },
};

const getDefaultFormData = (
  isCompany: boolean,
): Partial<KYBSubmissionRequest> => ({
  company_name: isCompany ? "Acme Corporation" : "John Doe",
  registration_number: "REG-123456",
  country: "US",
  contact_email: isCompany ? "reembolsoai@gmail.com" : "aijuenfe2030@gmail.com",
  contact_phone: "+1 (555) 123-4567",
  address: isCompany
    ? "123 Business St, Suite 100\nNew York, NY 10001"
    : "123 Main St\nNew York, NY 10001",
  business_type: "corporation",
  tax_id: "12-3456789",
});

export default function KYBPage() {
  const { employee, company, isCompany } = useProfile();
  const user = { employee, company };
  const defaultFormData = getDefaultFormData(isCompany);
  const redirectUrl = isCompany
    ? "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafybeif2ttfhqzghidvyoiv3t2rdz2cmlpdiixwck7c2zbgfm7kb5acg2u"
    : "https://blush-familiar-hawk-753.mypinata.cloud/ipfs/bafybeiccyqj5ofs26uf2sslfqjqr2ttr4hgqljxakftwdewrxqrtgzono4";
  const [kybStatus, setKybStatus] = useState<KYBStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  // Form state
  const [formData, setFormData] =
    useState<Partial<KYBSubmissionRequest>>(defaultFormData);

  /*useEffect(() => {
    if (user?.company?.id) {
      fetchKYBStatus();
    }
  }, [user?.company?.id]);
  */

  const handleSubmit = async () => {
    if (!user?.company?.id || !formData.company_name) {
      toast.error("Company name is required");
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2200));

      window.open(redirectUrl, "_blank", "noopener,noreferrer");

      toast.success(
        `${isCompany ? "KYB" : "KYC"} verification submitted successfully`,
      );
    } catch (error) {
      toast.error("Failed to submit KYB verification");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const status = kybStatus?.status || "unsubmitted";
  const config =
    statusConfig[status as keyof typeof statusConfig] ||
    statusConfig.unsubmitted;
  const StatusIcon = config.icon;
  const canEdit = status === "unsubmitted" || status === "rejected";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isCompany ? "Business Verification" : "Personal Verification"}
          </h1>
          <p className="text-gray-400">
            {isCompany
              ? "KYB (Know Your Business)"
              : "KYC (Know Your Customer)"}{" "}
            compliance verification.
          </p>
        </div>
        {/*<button
          onClick={fetchKYBStatus}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:border-[#22D3EE] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>*/}
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-xl p-6 border ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.bgColor}`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className={`text-lg font-semibold ${config.color}`}>
                {config.label}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}
              >
                {status.toUpperCase().replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-400">{config.description}</p>

            {kybStatus?.reviewer_notes && status === "rejected" && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">
                  <strong>Reviewer Notes:</strong> {kybStatus.reviewer_notes}
                </p>
              </div>
            )}

            {kybStatus?.reviewed_at && (
              <p className="text-xs text-gray-500 mt-2">
                Reviewed: {new Date(kybStatus.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Verification Form */}
      <div className="relative bg-[#111] border border-[#333] rounded-xl p-6 space-y-6 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-xl border border-[#333] bg-[#111] px-6 py-5">
              <div className="w-10 h-10 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-white">
                  {isCompany
                    ? "Processing KYB submission"
                    : "Processing KYC submission"}
                </p>
                <p className="text-xs text-gray-400">
                  Uploading your information and preparing verification.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#22D3EE]/10 rounded-lg">
            <Building2 className="w-5 h-5 text-[#22D3EE]" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            {isCompany ? "Business Information" : "Personal Information"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {isCompany ? "Legal Company Name" : "Full Name"}
            </label>
            <input
              type="text"
              value={
                formData.company_name ?? defaultFormData.company_name ?? ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Registration Number
            </label>
            <input
              type="text"
              value={
                formData.registration_number ??
                defaultFormData.registration_number ??
                ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registration_number: e.target.value,
                }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Business registration #"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Tax ID / EIN
            </label>
            <input
              type="text"
              value={formData.tax_id ?? defaultFormData.tax_id ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tax_id: e.target.value }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="XX-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Country
            </label>
            <select
              value={formData.country ?? defaultFormData.country ?? "US"}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country: e.target.value }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="AU">Australia</option>
              <option value="SG">Singapore</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Business Type
            </label>
            <select
              value={
                formData.business_type ??
                defaultFormData.business_type ??
                "corporation"
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  business_type: e.target.value,
                }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="corporation">Corporation</option>
              <option value="llc">LLC</option>
              <option value="partnership">Partnership</option>
              <option value="sole_proprietor">Sole Proprietor</option>
              <option value="nonprofit">Non-Profit</option>
              <option value="employee">Employee</option>
              <option value="self-employed">Self-Employed</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {isCompany ? "Business Address" : "Home Address"}
            </label>
            <textarea
              value={formData.address ?? defaultFormData.address ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              disabled={!canEdit || isLoading}
              className="w-full h-20 px-3 py-2 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              placeholder="123 Business St, Suite 100&#10;City, State 12345"
            />
          </div>
        </div>

        <div className="border-t border-[#333] pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contact_email: e.target.value,
                  }))
                }
                disabled={!canEdit || isLoading}
                className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="compliance@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact_phone || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contact_phone: e.target.value,
                  }))
                }
                disabled={!canEdit || isLoading}
                className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#333] pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Supporting Document
            </h2>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400">
              Upload verification file
            </label>

            <label
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#333] bg-black/40 px-6 py-8 text-center transition-colors ${
                canEdit
                  ? "cursor-pointer hover:border-[#22D3EE] hover:bg-[#22D3EE]/5"
                  : "cursor-not-allowed opacity-50"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                disabled={!canEdit || isLoading}
                className="hidden"
                onChange={(e) =>
                  setSelectedFileName(e.target.files?.[0]?.name || "")
                }
              />
              <FileText className="w-8 h-8 text-gray-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">
                  {selectedFileName || "Click here to upload a file"}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, PNG or JPG. Max 10MB.
                </p>
              </div>
            </label>
          </div>
        </div>

        {canEdit && (
          <div className="pt-4 border-t border-[#333]">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isLoading || !formData.company_name}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {status === "rejected"
                    ? "Resubmit Verification"
                    : "Submit for Verification"}
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              By submitting, you confirm all information is accurate and
              complete.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-[#0A0A0A] border border-[#333] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-1">
              Why is {isCompany ? "KYB" : "KYC"} required?
            </p>
            <p>
              {isCompany
                ? "KYB (Know Your Business)"
                : "KYC (Know Your Customer)"}{" "}
              verification helps us comply with financial regulations and ensure
              the security of all transactions. Verified businesses unlock
              higher limits and full access to Treasury Vault features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
