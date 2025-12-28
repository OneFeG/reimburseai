"use client";

import { useEffect, useState } from "react";
import { Save, Plus, X, AlertCircle, CheckCircle2, Settings2, Shield } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { policyApi, type Policy, type UpdatePolicyRequest } from "@/lib/api";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
    { value: "travel", label: "Travel" },
    { value: "meals", label: "Meals & Entertainment" },
    { value: "software", label: "Software & Tools" },
    { value: "equipment", label: "Equipment" },
    { value: "office", label: "Office Supplies" },
    { value: "utilities", label: "Utilities" },
    { value: "professional", label: "Professional Services" },
    { value: "other", label: "Other" },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const [policy, setPolicy] = useState<Policy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [formData, setFormData] = useState<UpdatePolicyRequest>({});
    const [newWhitelistVendor, setNewWhitelistVendor] = useState("");
    const [newBlacklistVendor, setNewBlacklistVendor] = useState("");

    useEffect(() => {
        if (user?.company?.id) {
            fetchPolicy();
        }
    }, [user?.company?.id]);

    const fetchPolicy = async () => {
        if (!user?.company?.id) return;

        setIsLoading(true);
        try {
            const response = await policyApi.getActiveForCompany(user.company.id);
            if (response.success && response.data) {
                setPolicy(response.data);
                setFormData({
                    name: response.data.name,
                    amount_cap_usd: response.data.amount_cap_usd,
                    monthly_cap_usd: response.data.monthly_cap_usd,
                    allowed_categories: response.data.allowed_categories,
                    vendor_whitelist: response.data.vendor_whitelist,
                    vendor_blacklist: response.data.vendor_blacklist,
                    max_days_old: response.data.max_days_old,
                    custom_rules: response.data.custom_rules,
                    require_description: response.data.require_description,
                    require_category: response.data.require_category,
                    auto_approve_under: response.data.auto_approve_under,
                });
            }
        } catch (error) {
            // No active policy - create default
            if (user?.company?.id) {
                try {
                    const createResponse = await policyApi.create({
                        company_id: user.company.id,
                        name: "Default Policy",
                    });
                    if (createResponse.success && createResponse.data) {
                        setPolicy(createResponse.data);
                        setFormData({
                            name: createResponse.data.name,
                            amount_cap_usd: createResponse.data.amount_cap_usd,
                            monthly_cap_usd: createResponse.data.monthly_cap_usd,
                            allowed_categories: createResponse.data.allowed_categories,
                            vendor_whitelist: createResponse.data.vendor_whitelist,
                            vendor_blacklist: createResponse.data.vendor_blacklist,
                            max_days_old: createResponse.data.max_days_old,
                            custom_rules: createResponse.data.custom_rules,
                            require_description: createResponse.data.require_description,
                            require_category: createResponse.data.require_category,
                            auto_approve_under: createResponse.data.auto_approve_under,
                        });
                    }
                } catch {
                    toast.error("Failed to create default policy");
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof UpdatePolicyRequest, value: unknown) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleCategoryToggle = (category: string) => {
        const current = formData.allowed_categories || [];
        const updated = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category];
        handleInputChange("allowed_categories", updated);
    };

    const addVendorToWhitelist = () => {
        if (!newWhitelistVendor.trim()) return;
        const current = formData.vendor_whitelist || [];
        if (!current.includes(newWhitelistVendor.trim())) {
            handleInputChange("vendor_whitelist", [...current, newWhitelistVendor.trim()]);
        }
        setNewWhitelistVendor("");
    };

    const removeVendorFromWhitelist = (vendor: string) => {
        const current = formData.vendor_whitelist || [];
        handleInputChange("vendor_whitelist", current.filter(v => v !== vendor));
    };

    const addVendorToBlacklist = () => {
        if (!newBlacklistVendor.trim()) return;
        const current = formData.vendor_blacklist || [];
        if (!current.includes(newBlacklistVendor.trim())) {
            handleInputChange("vendor_blacklist", [...current, newBlacklistVendor.trim()]);
        }
        setNewBlacklistVendor("");
    };

    const removeVendorFromBlacklist = (vendor: string) => {
        const current = formData.vendor_blacklist || [];
        handleInputChange("vendor_blacklist", current.filter(v => v !== vendor));
    };

    const handleSave = async () => {
        if (!policy?.id) return;

        setIsSaving(true);
        try {
            const response = await policyApi.update(policy.id, formData);
            if (response.success && response.data) {
                setPolicy(response.data);
                setHasChanges(false);
                toast.success("Policy saved successfully");
            }
        } catch (error) {
            toast.error("Failed to save policy");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-[#22D3EE] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Policy Settings</h1>
                    <p className="text-gray-400">Configure expense policies for your organization.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        hasChanges
                            ? "bg-[#22D3EE] text-black hover:bg-[#22D3EE]/90"
                            : "bg-[#222] text-gray-500 cursor-not-allowed"
                    }`}
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {/* Spending Limits */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#22D3EE]/10 rounded-lg">
                        <Settings2 className="w-5 h-5 text-[#22D3EE]" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Spending Limits</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Single Expense Cap (USD)
                        </label>
                        <input
                            type="number"
                            value={formData.amount_cap_usd || ""}
                            onChange={(e) => handleInputChange("amount_cap_usd", parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE]"
                            placeholder="1000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum amount per receipt</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Monthly Cap per Employee (USD)
                        </label>
                        <input
                            type="number"
                            value={formData.monthly_cap_usd || ""}
                            onChange={(e) => handleInputChange("monthly_cap_usd", parseFloat(e.target.value) || undefined)}
                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE]"
                            placeholder="Optional"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Auto-Approve Under (USD)
                        </label>
                        <input
                            type="number"
                            value={formData.auto_approve_under || ""}
                            onChange={(e) => handleInputChange("auto_approve_under", parseFloat(e.target.value) || 0)}
                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE]"
                            placeholder="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Auto-approve small expenses</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Max Receipt Age (Days)
                        </label>
                        <input
                            type="number"
                            value={formData.max_days_old || ""}
                            onChange={(e) => handleInputChange("max_days_old", parseInt(e.target.value) || 30)}
                            className="w-full h-10 px-3 rounded-md bg-black border border-[#333] text-white focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE]"
                            min={1}
                            max={365}
                            placeholder="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Reject receipts older than this</p>
                    </div>
                </div>
            </section>

            {/* Allowed Categories */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Allowed Categories</h2>
                <p className="text-sm text-gray-400">Select which expense categories are allowed.</p>
                
                <div className="flex flex-wrap gap-3">
                    {CATEGORY_OPTIONS.map((cat) => {
                        const isSelected = (formData.allowed_categories || []).includes(cat.value);
                        return (
                            <button
                                key={cat.value}
                                onClick={() => handleCategoryToggle(cat.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                    isSelected
                                        ? "bg-[#22D3EE]/10 border-[#22D3EE] text-[#22D3EE]"
                                        : "bg-[#0A0A0A] border-[#333] text-gray-400 hover:border-gray-500"
                                }`}
                            >
                                {isSelected && <CheckCircle2 className="w-3 h-3 inline mr-2" />}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Vendor Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Whitelist */}
                <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <h2 className="text-lg font-semibold text-white">Approved Vendors</h2>
                    </div>
                    <p className="text-sm text-gray-400">
                        {(formData.vendor_whitelist || []).length === 0 
                            ? "All vendors allowed (no whitelist)" 
                            : "Only these vendors are allowed"}
                    </p>
                    
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newWhitelistVendor}
                            onChange={(e) => setNewWhitelistVendor(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addVendorToWhitelist()}
                            className="flex-1 h-9 px-3 rounded-md bg-black border border-[#333] text-sm text-white focus:outline-none focus:border-[#22D3EE]"
                            placeholder="Add vendor name"
                        />
                        <button
                            onClick={addVendorToWhitelist}
                            className="px-3 py-1.5 rounded-md bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {(formData.vendor_whitelist || []).map((vendor) => (
                            <span
                                key={vendor}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-sm border border-green-500/20"
                            >
                                {vendor}
                                <button onClick={() => removeVendorFromWhitelist(vendor)}>
                                    <X className="w-3 h-3 hover:text-white" />
                                </button>
                            </span>
                        ))}
                    </div>
                </section>

                {/* Blacklist */}
                <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <h2 className="text-lg font-semibold text-white">Blocked Vendors</h2>
                    </div>
                    <p className="text-sm text-gray-400">These vendors will always be rejected.</p>
                    
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newBlacklistVendor}
                            onChange={(e) => setNewBlacklistVendor(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addVendorToBlacklist()}
                            className="flex-1 h-9 px-3 rounded-md bg-black border border-[#333] text-sm text-white focus:outline-none focus:border-red-500"
                            placeholder="Add vendor name"
                        />
                        <button
                            onClick={addVendorToBlacklist}
                            className="px-3 py-1.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        {(formData.vendor_blacklist || []).map((vendor) => (
                            <span
                                key={vendor}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-sm border border-red-500/20"
                            >
                                {vendor}
                                <button onClick={() => removeVendorFromBlacklist(vendor)}>
                                    <X className="w-3 h-3 hover:text-white" />
                                </button>
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            {/* Custom AI Rules */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Custom AI Rules</h2>
                        <p className="text-sm text-gray-400">Natural language rules for the AI auditor</p>
                    </div>
                </div>
                
                <textarea
                    value={formData.custom_rules || ""}
                    onChange={(e) => handleInputChange("custom_rules", e.target.value)}
                    className="w-full h-32 px-3 py-2 rounded-md bg-black border border-[#333] text-white text-sm focus:outline-none focus:border-[#22D3EE] focus:ring-1 focus:ring-[#22D3EE] resize-none"
                    placeholder="Examples:&#10;- No alcohol purchases on weekdays&#10;- Flag any purchases over $50 at restaurants&#10;- Require itemized receipts for meals over $30"
                />
                <p className="text-xs text-gray-500">
                    These rules are interpreted by GPT-4o Vision when analyzing receipts.
                </p>
            </section>

            {/* Requirements */}
            <section className="bg-[#111] border border-[#333] rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-white">Submission Requirements</h2>
                
                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.require_description || false}
                            onChange={(e) => handleInputChange("require_description", e.target.checked)}
                            className="w-4 h-4 rounded border-[#333] bg-black text-[#22D3EE] focus:ring-[#22D3EE] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300">Require expense description</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.require_category || false}
                            onChange={(e) => handleInputChange("require_category", e.target.checked)}
                            className="w-4 h-4 rounded border-[#333] bg-black text-[#22D3EE] focus:ring-[#22D3EE] focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300">Require expense category</span>
                    </label>
                </div>
            </section>
        </div>
    );
}
