"use client";

import { useState, useCallback } from "react";
import { UploadCloud, File, X, Loader2, CheckCircle2, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { receiptApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type UploadStatus = "idle" | "uploading" | "analyzing" | "complete" | "error";

interface UploadResult {
    receiptId: string;
    filePath: string;
}

export default function UploadPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const { user } = useAuth();
    const router = useRouter();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileSelect = (selectedFile: File) => {
        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error("Invalid file type. Please upload JPG, PNG, WebP or PDF.");
            return;
        }

        // Validate file size (10MB max)
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 10MB.");
            return;
        }

        setFile(selectedFile);
        setError(null);
    };

    const uploadFile = useCallback(async () => {
        if (!file || !user?.employee?.id || !user?.company?.id) {
            toast.error("Please connect your wallet first");
            return;
        }

        setStatus("uploading");
        setError(null);

        try {
            const response = await receiptApi.upload(file, description, category);

            if (response.success && response.data) {
                setStatus("analyzing");
                
                // Simulate AI analysis time (in production this happens in backend)
                setTimeout(() => {
                    setStatus("complete");
                    setUploadResult({
                        receiptId: response.data!.receipt_id,
                        filePath: response.data!.file_path,
                    });
                    toast.success("Receipt uploaded successfully!");
                }, 2000);
            } else {
                throw new Error(response.error?.message || "Upload failed");
            }
        } catch (err) {
            setStatus("error");
            const message = err instanceof Error ? err.message : "Upload failed";
            setError(message);
            toast.error(message);
        }
    }, [file, description, category, user]);

    const resetUpload = () => {
        setFile(null);
        setStatus("idle");
        setUploadResult(null);
        setError(null);
        setDescription("");
        setCategory("");
    };

    const viewReceipt = () => {
        if (uploadResult?.receiptId) {
            router.push(`/expenses?receipt=${uploadResult.receiptId}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Upload Receipt</h1>
                <p className="text-gray-400">Upload a receipt photo to submit an expense for reimbursement.</p>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200
                    ${isDragging ? "border-[#22D3EE] bg-[#22D3EE]/5" : "border-[#333] bg-[#111] hover:border-gray-500"}
                    ${status !== "idle" && status !== "error" ? "pointer-events-none opacity-50" : ""}
                `}
            >
                <input
                    type="file"
                    accept="image/*,.pdf"
                    capture="environment"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    disabled={status !== "idle" && status !== "error"}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center border border-[#333]">
                        <UploadCloud className={`w-8 h-8 ${isDragging ? "text-[#22D3EE]" : "text-gray-400"}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white">
                            {isDragging ? "Drop to upload" : "Click or drag receipt here"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WebP, PDF up to 10MB</p>
                    </div>
                    
                    {/* Mobile camera button */}
                    <button className="md:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                        <Camera className="w-4 h-4" />
                        Take Photo
                    </button>
                </div>
            </div>

            {/* File Selected - Show details form */}
            {file && status === "idle" && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-[#222] flex items-center justify-center">
                            <File className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">{file.name}</h4>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={resetUpload} className="text-gray-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#333]">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Description (optional)
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Team lunch meeting"
                                className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all placeholder:text-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Category (optional)
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] transition-all"
                            >
                                <option value="">Select category</option>
                                <option value="meals">Meals & Entertainment</option>
                                <option value="travel">Travel</option>
                                <option value="supplies">Office Supplies</option>
                                <option value="software">Software & Tools</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <button
                            onClick={uploadFile}
                            className="w-full h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors"
                        >
                            Upload Receipt
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Upload Progress */}
            {(status === "uploading" || status === "analyzing" || status === "complete") && file && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#111] border border-[#333] rounded-xl p-6"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#222] flex items-center justify-center">
                            <File className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">{file.name}</h4>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        {status === "complete" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <Loader2 className="w-5 h-5 text-[#22D3EE] animate-spin" />
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-400 uppercase tracking-wider font-medium">
                            <span>Status</span>
                            <span className={status === "complete" ? "text-green-500" : "text-[#22D3EE]"}>
                                {status === "uploading" && "Uploading..."}
                                {status === "analyzing" && "AI Analyzing..."}
                                {status === "complete" && "Complete"}
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-[#222] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#22D3EE]"
                                initial={{ width: "0%" }}
                                animate={{
                                    width: status === "uploading" ? "40%" : status === "analyzing" ? "80%" : "100%"
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    {status === "complete" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 pt-4 border-t border-[#333] space-y-4"
                        >
                            <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Receipt uploaded successfully
                            </div>
                            <p className="text-sm text-gray-400">
                                Your receipt is being processed by our AI. You&apos;ll receive a notification once it&apos;s ready for reimbursement.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={viewReceipt}
                                    className="flex-1 h-10 rounded-md bg-[#22D3EE] text-black font-medium hover:bg-[#22D3EE]/90 transition-colors"
                                >
                                    View Receipt
                                </button>
                                <button
                                    onClick={resetUpload}
                                    className="flex-1 h-10 rounded-md bg-[#222] text-white font-medium hover:bg-[#333] transition-colors border border-[#333]"
                                >
                                    Upload Another
                                </button>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Error State */}
            {status === "error" && error && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-6"
                >
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                        onClick={resetUpload}
                        className="mt-4 px-4 py-2 rounded-md bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                    >
                        Try Again
                    </button>
                </motion.div>
            )}
        </div>
    );
}
