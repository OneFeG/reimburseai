import { google } from "@ai-sdk/google";
import { customProvider } from "ai";

export const myProvider = customProvider({
  languageModels: {
    "gemini-2.5-flash": google('gemini-2.5-flash'),
  },
});

export type modelID = Parameters<(typeof myProvider)["languageModel"]>["0"];

export const models: Record<modelID, string> = {
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};
