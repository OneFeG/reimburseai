"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone, type DropzoneOptions } from "react-dropzone";
import {
  Upload,
  Image,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  Tag,
} from "lucide-react";
import { useProfile } from "@/hooks";
import { apiClient } from "@/lib/api/client";
import type { Audit } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type UploadState = "idle" | "uploading" | "analyzing" | "complete" | "error";

export default function SubmitExpensePage() {
  const { employee, company } = useProfile();
  const user = { employee, company };
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setState("idle");
      setAudit(null);
      setError(null);
    }
  }, []);

  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneOptions);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setState("idle");
    setAudit(null);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) return;

    setState("uploading");
    setError(null);

    try {
      const employeeAddress = user?.employee?.smart_wallet_address || "";

      if (!employeeAddress) {
        throw new Error("Connect your wallet before submitting a receipt");
      }

      setState("analyzing");

      type BackendAuditResponse = {
        ok: boolean;
        auditData?: Audit;
        error?: string;
      };

      const response = await apiClient.uploadFile<BackendAuditResponse>(
        "/auditup",
        file,
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || "Upload failed");
      }
      if (!response.data.ok) {
        throw new Error(response.data.error || "Audit failed");
      }
      console.log("Audit Result: ", response.data);
      const audit = response.data.auditData;
      if (!audit) {
        throw new Error("Audit failed");
      }

      setAudit(audit);
      setState("complete");
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : "Failed to process receipt";
      toast.error(message);
      setError(message);
      setState("error");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Submit Expense
        </h1>
        <p className="text-white/50 mt-1">
          Upload your receipt and our AI will analyze it instantly.
        </p>
      </div>

      {/* Upload area */}
      <div className="card">
        {!file ? (
          <div
            {...getRootProps()}
            className={`relative p-8 lg:p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              isDragActive
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-white/20 hover:border-white/40"
            }`}
          >
            <input {...getInputProps()} />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Upload className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white font-medium mb-2">
                {isDragActive
                  ? "Drop your receipt here"
                  : "Drag & drop your receipt"}
              </p>
              <p className="text-white/40 text-sm mb-4">
                or click to browse files
              </p>
              <div className="flex items-center justify-center gap-4 text-white/30 text-xs">
                <span className="flex items-center gap-1">
                  <Image className="w-4 h-4" />
                  JPG, PNG, WebP
                </span>
                <span>Max 10MB</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview */}
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-white/5">
                {preview && (
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="w-full h-full object-contain"
                  />
                )}
                {state === "uploading" && (
                  <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                      <p className="text-white">Uploading...</p>
                    </div>
                  </div>
                )}
                {state === "analyzing" && (
                  <div className="absolute inset-0 bg-navy-900/80 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
                      <p className="text-white">
                        AI is analyzing your receipt...
                      </p>
                      <p className="text-white/50 text-sm">
                        This usually takes a few seconds
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {state === "idle" && (
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 p-2 rounded-full bg-navy-900/80 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* File info */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-white/30" />
                <div>
                  <p className="text-white text-sm font-medium">{file.name}</p>
                  <p className="text-white/40 text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              {state === "idle" && (
                <button
                  onClick={clearFile}
                  className="text-white/40 hover:text-white text-sm"
                >
                  Change
                </button>
              )}
            </div>

            {/* Submit button */}
            {state === "idle" && (
              <button
                onClick={handleSubmit}
                className="w-full btn-primary py-4"
              >
                Submit for Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {state === "error" && error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-400/10 border border-red-400/20"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-medium">Processing failed</p>
              <p className="text-red-400/70 text-sm">{error}</p>
              <button
                onClick={() => setState("idle")}
                className="text-red-400 text-sm underline mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Audit result */}
      {state === "complete" && audit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-3 mb-6">
            {audit.status === "approved" ? (
              <>
                <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Expense Approved
                  </h3>
                  <p className="text-emerald-400 text-sm">
                    {audit.ai_decision_reason || "Approved"}
                  </p>
                </div>
              </>
            ) : audit.status === "rejected" ? (
              <>
                <div className="w-12 h-12 rounded-full bg-red-400/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Expense Rejected
                  </h3>
                  <p className="text-red-400 text-sm">
                    {audit.ai_decision_reason || "Rejected"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Expense Submitted
                  </h3>
                  <p className="text-amber-400 text-sm">
                    {audit.status === "processing"
                      ? "Processing"
                      : "Pending review"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Extracted data */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <DataItem
              icon={Building2}
              label="Vendor"
              value={audit.merchant || "Unknown"}
            />
            <DataItem
              icon={DollarSign}
              label="Amount"
              value={formatCurrency(Number(audit.amount || 0))}
            />
            <DataItem
              icon={Calendar}
              label="Date"
              value={formatDate(audit.receipt_date || audit.created_at)}
            />
            <DataItem
              icon={Tag}
              label="Category"
              value={
                audit.category || audit.merchant_category || "Uncategorized"
              }
            />
          </div>

          {/* Confidence score */}
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/50 text-sm">AI Confidence</span>
              <span className="text-cyan-400 text-sm font-medium">
                {(
                  Math.max(0, Math.min(1, Number(audit.ai_confidence || 0))) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{
                  width: `${Math.max(0, Math.min(1, Number(audit.ai_confidence || 0))) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-6">
            <button onClick={clearFile} className="flex-1 btn-secondary">
              Submit Another
            </button>
            <a
              href="/dashboard/expenses"
              className="flex-1 btn-primary text-center"
            >
              View All Expenses
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DataItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <div className="flex items-center gap-2 text-white/40 text-sm mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <p className="text-white font-medium">{value}</p>
    </div>
  );
}
