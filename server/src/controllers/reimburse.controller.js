import { Reimburse } from "../services/thirdweb/reimburses.js";
import { PoliciesService } from "../database/policies/index.js";
import { EmployeesService } from "../database/employees/index.js";
import { CompaniesService } from "../database/companies/index.js";
import { AuditsService } from "../database/audits/index.js";

import {
  paymentToken,
  paymentChain,
  API_BASE_URL,
} from "../utils/constants.js";
import { THIRDWEB_SECRET_KEY } from "../../config.js";

export const PlatformReimburseFlow = async (req, res) => {
  try {
    const file = req.file; // Received from upload.single('file') middleware
    const employeeUID = req.user.uid;

    if (!file) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid or missing file" });
    }
    // Check mime type from multer file object
    const type = file.mimetype || "";
    if (!type.startsWith("image/")) {
      return res
        .status(400)
        .json({ ok: false, error: "File must be an image" });
    }

    const employee = await EmployeesService.getById(employeeUID);
    if (!employee) {
      return res.status(400).json({ ok: false, error: "Employee not found" });
    }
    if (!employee.company_id) {
      return res
        .status(400)
        .json({ ok: false, error: "Employee not assigned to a company" });
    }

    const companyID = employee.company_id;
    const company = await CompaniesService.getById(companyID);
    if (!company) {
      return res.status(400).json({ ok: false, error: "Company not found" });
    }

    const employeeSmartWalletAddress = employee.smart_wallet_address;
    const companySmartWalletAddress = company.smart_wallet_address;

    const policiesDB = await PoliciesService.getByCompanyId(companyID);
    const policy = Array.isArray(policiesDB) ? policiesDB[0] : policiesDB;
    if (!policy) {
      return res
        .status(400)
        .json({ ok: false, error: "No policies found for this company" });
    }

    const policies = {
      currencies: policy.currencies,
      max_total_value: policy.amount_cap,
      allowed_categories: policy.allowed_categories,
      vendor_whitelist: policy.vendor_whitelist,
      vendor_blacklist: policy.vendor_blacklist,
      max_days_old: policy.max_days_old,
      require_description: policy.require_description,
      require_category: policy.require_category,
      auto_approve_under: policy.auto_approve_under,
      is_active: policy.is_active,
      custom_rules: policy.custom_rules,
    };

    let status = "pending";
    let response;
    try {
      // req.file.buffer contains the file data when using multer.memoryStorage()
      const buf = file.buffer;
      const mime = file.mimetype || "application/octet-stream";
      const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

      const body = { imageData: dataUrl, policies };

      const url = `${API_BASE_URL}/api/auditor`;

      status = "processing";
      response = await fetch(
        `https://api.thirdweb.com/v1/payments/x402/fetch?from=${companySmartWalletAddress}&url=${encodeURIComponent(
          url,
        )}&method=POST&maxValue=1000&asset=${
          paymentToken.address
        }&chainId=eip155:${paymentChain.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-secret-key": THIRDWEB_SECRET_KEY,
          },
          body: JSON.stringify(body),
        },
      );
    } catch (e) {
      const error = onError(e);
      return res.status(502).json({ ok: false, ...error });
    }

    const data = await response.json();

    const reimbursementValid = Boolean(data?.reimbursementValid);
    const totalAmount = Number(data?.total || 0);

    //console.log("Data Receipt:", data);
    //console.log("Reimbursement Valid:", reimbursementValid);
    //console.log("Total Amount:", totalAmount);

    let reimburseData = { ok: false, error: "" };

    if (data && response.status === 200) {
      if (!reimbursementValid) {
        reimburseData = { ok: false, error: "Reimbursement not valid" };
      } else if (totalAmount <= 0) {
        //|| totalAmount > policies.amount_cap
        reimburseData = { ok: false, error: "Total amount is 0 or invalid" };
      } else {
        try {
          reimburseData = await Reimburse(
            employeeSmartWalletAddress,
            totalAmount,
            companySmartWalletAddress,
          );
        } catch (e) {
          const error = onError(e);
          return res
            .status(502)
            .json({ ok: false, reimbursementValid, ...error });
        }
      }
    }
    //console.log("Reimburse Data:", reimburseData);

    status = reimbursementValid ? "approved" : "rejected";

    const auditDataDB = {
      company_id: companyID,
      employee_id: employeeUID,

      //File
      file_path: "file/directory",
      file_name: file.originalname,
      file_size: file.size,
      mime_type: file.mimetype,

      //Rceipt Information
      merchant: data?.merchant || "",
      merchant_category: data?.merchant_category || "",
      receipt_date: data?.date || "",
      amount: totalAmount,
      currency: data?.currency || "",

      status: status,

      //AI Decision
      ai_confidence: data?.confidence || 0,
      ai_decision_reason: data?.decisionReason || "",
      ai_anomalies: data?.anomalies || [],
      signature: data?.signature || "",

      //Audit payments
      audit_fee_paid: data?.audit_fee_paid ? true : false,
      audit_fee_tx_hash: data?.audit_fee_tx_hash || "",
      audit_fee_amount: data?.audit_fee_paid || "0",

      //Reimbursement
      payout_amount: reimburseData?.ok ? totalAmount : 0,
      payout_tx_hash: reimburseData?.ok ? reimburseData?.transactionHash : "",
      payout_wallet: employeeSmartWalletAddress,
      paid_at: new Date().toISOString(),
    };

    //console.log("Audit Data:", auditDataDB);

    const auditData = await AuditsService.create(auditDataDB);

    return res.status(201).json({ ok: true, auditData });
  } catch (error) {
    console.error("Audit receipt error:", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
};

function isEvmAddress(s) {
  return typeof s === "string" && /^0x[0-9a-fA-F]{40}$/.test(s);
}

function validateIncomingForm(wallet) {
  if (!isEvmAddress(employee)) {
    throw new Error("Invalid employee address");
  }

  return { employee };
}

function onError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return { error: message };
}
