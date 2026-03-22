import { myProvider } from "../models.ts";
import { generateText } from "ai";
import { ethers } from "ethers";
//import { AGENT_PRIVATE_KEY } from "@/config.js";
import { generatePrompt } from "./prompt.ts";
import {signMessage} from "../../services/thirdweb/playground/signMessages.js";
import {serverAgentAWalletAddress} from "../../services/thirdweb/thirdweb.server.js"

export async function auditImage(imagePart: Blob | URL | string | undefined, policies: any) {
  // Build content parts compatible with AI SDK 5
  const contentParts: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: URL | string }
    | { type: "file"; data: Uint8Array; mediaType: string }
  > = [{ type: "text", text: "Audit this receipt and report findings." }];

  if (imagePart instanceof URL || typeof imagePart === "string") {
    contentParts.push({ type: "image", image: imagePart });
  } else if (imagePart instanceof Blob) {
    const buffer = await imagePart.arrayBuffer();
    contentParts.push({
      type: "file",
      data: new Uint8Array(buffer),
      mediaType: imagePart.type,
    });
  }


  const prompt = generatePrompt(policies);


  const result = await generateText({
    system: prompt,
    model: myProvider.languageModel("gemini-2.5-flash"),
    messages: [
      {
        role: "user",
        content: contentParts,
      },
    ],
  });

  const raw = result.text ?? "";
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const blob =
    fence?.[1] ??
    (() => {
      const s = raw.indexOf("{");
      const e = raw.lastIndexOf("}");
      return s !== -1 && e !== -1 && e > s ? raw.slice(s, e + 1) : "";
    })();

  let json: any = null;
  try {
    json = blob ? JSON.parse(blob) : null;
  } catch {
    console.error("Failed to parse JSON from model output");
  }
  const totalTokens = result.usage?.totalTokens;
  //console.log("TotalTokens:", totalTokens);
  //console.log("AI RESULT: ", json);
  
  if(!json?.decisionReason) throw new Error("Invalid Receipt Analysis");
  const signedResponse = await signVerdict(json);
  return {signedResponse, totalTokens};
}

// La wallet del agente (generada una vez y guardada en .env)
//const agentWallet = new ethers.Wallet(AGENT_PRIVATE_KEY);

async function signVerdict(verdict) {
  // Creamos un hash de los datos aprobados
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "uint256", "string", "bool"],
    [verdict.merchant, ethers.parseUnits(verdict.total.toString(), 6), verdict.decisionReason, verdict.reimbursementValid.toString()]
  );

  const signature = await signMessage(messageHash, serverAgentAWalletAddress);

  return {
    ...verdict,
    signature
  };
}

