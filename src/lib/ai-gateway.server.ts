import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServerFn } from "@tanstack/react-start";

export function getAiModel() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (lovableKey) {
    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    return gateway("google/gemini-3-flash-preview");
  } else if (geminiKey) {
    const google = createGoogleGenerativeAI({
      apiKey: geminiKey,
    });
    // Fall back to gemini-1.5-flash which is widely compatible and fast
    return google("gemini-1.5-flash");
  }

  throw new Error(
    "No API key configured. Please set LOVABLE_API_KEY or GEMINI_API_KEY in your .env file.",
  );
}

export const checkAiConfig = createServerFn({ method: "GET" })
  .handler(async () => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return {
      hasKey: !!(lovableKey || geminiKey),
      keyType: lovableKey ? "lovable" : geminiKey ? "gemini" : null,
    };
  });
