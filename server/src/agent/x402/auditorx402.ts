import {
  settlePayment,
  facilitator,
  verifyPayment,
  type PaymentArgs,
  type SettlePaymentResult,
} from "thirdweb/x402";
import {
  serverClient,
  serverAgentAWalletAddress,
} from "../../services/thirdweb/thirdweb.server.js";
import {
  MAX_INFERENCE_TOKENS_PER_CALL,
  paymentToken,
  PRICE_PER_INFERENCE_TOKEN_WEI,
  paymentChain,
  API_BASE_URL,
} from "../../utils/constants.js";
import { auditImage } from "../agents/agent.auditor.ts";

const twFacilitator = facilitator({
  client: serverClient,
  serverWalletAddress: serverAgentAWalletAddress,
});

const asset = {
  address: paymentToken.address as `0x${string}`,
};


export async function x402Getter(req: any, res: any, next?: any) {
  try {
    const paymentData =
      getHeaderValue(req, "x-payment") ??
      getHeaderValue(req, "payment-signature");

    /*const settle = await settlePayment({
      resourceUrl: `${API_BASE_URL}/api/auditor`,
      method: "POST",
      paymentData,
      network: paymentChain,
      scheme: "exact",
      payTo: serverAgentAWalletAddress,
      price: {
        amount: "1000", //(PRICE_PER_INFERENCE_TOKEN_WEI * MAX_INFERENCE_TOKENS_PER_CALL).toString(),
        asset,
      },
      facilitator: twFacilitator,
      //waitUntil: "confirmed",
    });

    console.log("***SETTLE***: ", settle);

    if (settle.status !== 200) {
      setResponseHeaders(res, settle.responseHeaders);
      return res.status(settle.status).json(settle.responseBody);
    }*/

    const paymentArgs: PaymentArgs = {
      resourceUrl: `${API_BASE_URL}/api/auditor`,
      method: "POST",
      paymentData,
      network: paymentChain,
      scheme: "exact",
      payTo: serverAgentAWalletAddress,
      price: {
        amount: "1000", //(PRICE_PER_INFERENCE_TOKEN_WEI * MAX_INFERENCE_TOKENS_PER_CALL).toString(),
        asset,
      },
      facilitator: twFacilitator,
    };

    // verify the signed payment data with maximum payment amount before doing any work
    const verification = await verifyPayment(paymentArgs);

    //console.log("***VERIFICATION***: ", verification);

    if (verification.status !== 200) {
      setResponseHeaders(res, verification.responseHeaders);
      return res.status(verification.status).json(verification.responseBody);
    }

    const body: any = req?.body ?? {};

    //let policies: any | undefined;
    let policies = parseMaybeJson(body?.policies);
    //const policiesJson = parseMaybeJson(body?.policies);
    /*if (bodyPolicies && typeof bodyPolicies === "object") {
      policies = Array.isArray(bodyPolicies)
        ? { policies: bodyPolicies }
        : bodyPolicies;
    }*/
    if (!policies) {
      policies = {
        require_merchant: true,
        requiere_total: true,
        is_active: true
      };
    }

    //IMAGE PRE-PROCESSING
    // Enforce image input: accept multipart/form-data (field: "file") or JSON (fields: "imageUrl" | "imageData")
    let imagePart: Blob | URL | string | undefined;
    const contentType = getHeaderValue(req, "content-type") ?? "";
    if (req?.file?.buffer && req.file.buffer.length > 0) {
      imagePart = new Blob([req.file.buffer], {
        type: req.file.mimetype || "application/octet-stream",
      });
    } else if (contentType.includes("multipart/form-data")) {
      const imageUrl = body?.imageUrl;
      const imageData = body?.imageData;
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        imagePart = new URL(imageUrl);
      } else if (typeof imageData === "string" && imageData.length > 0) {
        imagePart = imageData;
      }
    } else {
      const imageUrl = body?.imageUrl;
      const imageData = body?.imageData;
      if (typeof imageUrl === "string" && imageUrl.length > 0) {
        imagePart = new URL(imageUrl);
      } else if (typeof imageData === "string" && imageData.length > 0) {
        imagePart = imageData;
      }
    }

    if (!imagePart) {
      return res.status(400).json({
        error: "image_required",
        errorMessage:
          "Provide an image via multipart 'file' or JSON 'imageUrl'/'imageData'.",
      });
    }

    const { signedResponse: json, totalTokens } = await auditImage(
      imagePart,
      policies
    );

    //PAYMENT
    let settle: SettlePaymentResult | null | undefined = null;
    if (!totalTokens) {
      console.error("Token usage data not available");
    } else {
      const finalPrice = PRICE_PER_INFERENCE_TOKEN_WEI * totalTokens;
      //console.log("TotalTokens: ", totalTokens, "  FinalPrice:", finalPrice);
      try {
        settle = await settlePayment({
          ...paymentArgs,
          price: {
            amount: "1000",
            asset,
          },
          waitUntil: "confirmed",
        });

        //console.log("***SETTLE***: ", settle);
        //console.log(`Payment result: ${settle?.status}`);
      } catch (error) {
        console.error("Payment settlement failed:", error);
      }
    }

    if (json && settle?.status === 200) {
      // Consultar txHash de la transactionId  settle?.paymentReceipt?.transaction
      const sendData = {...json, audit_fee_paid: "1000", audit_fee_tx_hash: settle?.paymentReceipt?.transaction || ""}
      return res.status(200).json(sendData);
    }
    return res
      .status(400)
      .json({ message: "Payment settlement failed", settle });
  } catch (err) {
    if (typeof next === "function") return next(err);
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

function getHeaderValue(req: any, headerName: string): string | undefined {
  const direct =
    typeof req?.get === "function" ? req.get(headerName) : undefined;
  if (typeof direct === "string" && direct.length > 0) return direct;

  const headers = req?.headers ?? {};
  const candidates = [
    headerName,
    headerName.toLowerCase(),
    headerName.toUpperCase(),
  ];
  for (const key of candidates) {
    const value = headers?.[key];
    if (typeof value === "string" && value.length > 0) return value;
    if (
      Array.isArray(value) &&
      typeof value[0] === "string" &&
      value[0].length > 0
    )
      return value[0];
  }
  return undefined;
}

function setResponseHeaders(res: any, headers: any) {
  if (!headers) return;
  if (typeof headers.forEach === "function") {
    headers.forEach((value: any, key: any) => {
      if (typeof key === "string" && typeof value !== "undefined") {
        res.setHeader(
          key,
          Array.isArray(value) ? value.map(String) : String(value),
        );
      }
    });
    return;
  }
  if (typeof headers === "object") {
    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "undefined") continue;
      res.setHeader(
        key,
        Array.isArray(value) ? value.map(String) : String(value),
      );
    }
  }
}

function parseMaybeJson(value: any): any {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}
