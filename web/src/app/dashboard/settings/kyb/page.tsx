"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Shield,
  FileText,
  Send,
  RefreshCw,
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

export default function KYBPage() {
  const { employee, company } = useProfile();
  const user = { employee, company };
  const [kybStatus, setKybStatus] = useState<KYBStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<KYBSubmissionRequest>>({});

  useEffect(() => {
    if (user?.company?.id) {
      fetchKYBStatus();
    }
  }, [user?.company?.id]);

  const fetchKYBStatus = async () => {
    if (!user?.company?.id) return;

    setIsLoading(true);
    try {
      const response = await kybApi.getStatus(user.company.id);
      if (response.success && response.data) {
        setKybStatus(response.data);
        // Pre-fill form with existing data
        setFormData({
          company_name: response.data.data.company_name || user.company.name,
          registration_number: response.data.data.registration_number,
          country: response.data.data.country,
          contact_email: response.data.data.contact_email,
          contact_phone: response.data.data.contact_phone,
          address: response.data.data.address,
          business_type: response.data.data.business_type,
          tax_id: response.data.data.tax_id,
        });
      }
    } catch (error) {
      // No KYB status yet
      setFormData({
        company_name: user?.company?.name || "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.company?.id || !formData.company_name) {
      toast.error("Company name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await kybApi.submit({
        company_id: user.company.id,
        company_name: formData.company_name,
        registration_number: formData.registration_number,
        country: formData.country,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        address: formData.address,
        business_type: formData.business_type,
        tax_id: formData.tax_id,
      });

      if (response.success) {
        toast.success("KYB verification submitted successfully");
        fetchKYBStatus();
      }
    } catch (error) {
      toast.error("Failed to submit KYB verification");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            Business Verification
          </h1>
          <p className="text-gray-400">
            KYB (Know Your Business) compliance verification.
          </p>
        </div>
        <button
          onClick={fetchKYBStatus}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#333] text-gray-300 hover:text-white hover:border-[#22D3EE] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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
      <div className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#22D3EE]/10 rounded-lg">
            <Building2 className="w-5 h-5 text-[#22D3EE]" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Business Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Legal Company Name *
            </label>
            <input
              type="text"
              value={formData.company_name || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
              disabled={!canEdit}
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
              value={formData.registration_number || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  registration_number: e.target.value,
                }))
              }
              disabled={!canEdit}
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
              value={formData.tax_id || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tax_id: e.target.value }))
              }
              disabled={!canEdit}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="XX-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Country
            </label>
            <select
              value={formData.country || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, country: e.target.value }))
              }
              disabled={!canEdit}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select country</option>
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
              value={formData.business_type || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  business_type: e.target.value,
                }))
              }
              disabled={!canEdit}
              className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select type</option>
              <option value="corporation">Corporation</option>
              <option value="llc">LLC</option>
              <option value="partnership">Partnership</option>
              <option value="sole_proprietor">Sole Proprietor</option>
              <option value="nonprofit">Non-Profit</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Business Address
            </label>
            <textarea
              value={formData.address || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              disabled={!canEdit}
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
                disabled={!canEdit}
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
                disabled={!canEdit}
                className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="pt-4 border-t border-[#333]">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.company_name}
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
              Why is KYB required?
            </p>
            <p>
              Know Your Business (KYB) verification helps us comply with
              financial regulations and ensure the security of all transactions.
              Verified businesses unlock higher limits and full access to
              Treasury Vault features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
