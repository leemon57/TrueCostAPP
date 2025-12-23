// fetchAiInsights.ts
// Expo client-side call to an AI proxy. Secrets (OpenAI key) must live on the backend/edge.
// The proxy should call OpenAI Responses API with structured outputs. Avoid embedding secrets in the app bundle.

export type AiInsights = {
  tips: string[];
  forecast: string;
};

const MAX_SCENARIOS = 5;
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || "gpt-4o-mini";
const AI_PROXY_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

function summarizeScenarios(scenarios: any[]): string {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return "No scenarios saved.";

  return scenarios
    .slice(0, 5)
    .map((s) => {
      const name = String(s?.name ?? "Scenario");
      const principal = Number(s?.principal ?? 0);
      const termMonths = Number(s?.termMonths ?? 0);
      const paymentFrequency = String(s?.paymentFrequency ?? "unknown");
      const rate = Number(s?.fixedAnnualRate ?? s?.spreadOverPolicyRate ?? 0);

      const principalStr = Number.isFinite(principal) ? `$${principal.toFixed(0)}` : "$0";
      const termStr = Number.isFinite(termMonths) ? `${termMonths}mo` : "0mo";
      const rateStr = Number.isFinite(rate) ? String(rate) : "0";

      return `${name}: ${principalStr}, ${termStr}, ${paymentFrequency}, rate=${rateStr}`;
    })
    .join("; ");
}

function formatFallback(message: string): AiInsights {
  return {
    tips: ["AI tips are currently unavailable.", message],
    forecast: "Neutral outlook. Check your API key and network.",
  };
}

function coerceAiInsights(value: any): AiInsights | null {
  if (!value || typeof value !== "object") return null;

  const tips = Array.isArray(value.tips)
    ? value.tips.filter((t: any) => typeof t === "string").slice(0, 2)
    : [];

  const forecast = typeof value.forecast === "string" ? value.forecast : "";

  if (tips.length === 0 && !forecast) return null;

  return {
    tips: tips.length ? tips : ["Compare total interest paid across terms and rates."],
    forecast: forecast || "Neutral outlook.",
  };
}

function extractOutputText(resJson: any): string | null {
  // Common in Responses API: output_text may exist
  if (typeof resJson?.output_text === "string" && resJson.output_text.trim()) {
    return resJson.output_text.trim();
  }

  // Otherwise, scan output[].content[] for output_text items
  const output = Array.isArray(resJson?.output) ? resJson.output : [];
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const c of content) {
      if (c?.type === "output_text" && typeof c?.text === "string" && c.text.trim()) {
        return c.text.trim();
      }
    }
  }

  return null;
}

export async function fetchAiInsights(scenarios: any[]): Promise<AiInsights> {
  // Enforce proxy usage so secrets stay server-side.
  if (!AI_PROXY_BASE_URL) {
    return formatFallback("Set EXPO_PUBLIC_API_BASE_URL to your AI proxy.");
  }

  const trimmedScenarios = Array.isArray(scenarios) ? scenarios.slice(0, MAX_SCENARIOS) : [];
  const scenarioSummary = summarizeScenarios(trimmedScenarios);

  const body = {
    model: OPENAI_MODEL,
    scenarios: trimmedScenarios,
    summary: scenarioSummary,
  };

  try {
    const res = await fetch(`${AI_PROXY_BASE_URL}/ai/insights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("AI proxy request failed:", res.status, errText);
      return formatFallback(`AI proxy error: ${res.status}`);
    }

    const resJson = await res.json();
    const directInsights = coerceAiInsights(resJson);
    if (directInsights) return directInsights;

    // If the proxy forwards raw OpenAI Responses payload, attempt to parse it.
    const outText = extractOutputText(resJson);
    if (!outText) {
      return formatFallback("AI proxy returned no structured output.");
    }

    try {
      const parsed = JSON.parse(outText);
      const insights = coerceAiInsights(parsed);
      if (!insights) return formatFallback("AI proxy returned unexpected JSON structure.");
      return insights;
    } catch (e) {
      console.warn("Failed to parse AI proxy JSON:", e, outText);
      return formatFallback("AI output was not valid JSON.");
    }
  } catch (error: any) {
    console.warn("AI proxy request exception:", error?.message ?? error);
    return formatFallback("Could not connect to AI service.");
  }
}

/* Legacy body shape reference for the backend proxy:
   The proxy should POST this to OpenAI Responses API with the provided model and a secret API key.
   Keeping here for server implementation reference.
const openAiPayload = {
  model: OPENAI_MODEL,
  input: [
    {
      role: "system",
      content: [
        {
          type: "input_text",
          text:
            "You are a personal finance assistant. Provide concise, consumer-focused advice. " +
            "Do not include disclaimers. Use plain language. Keep it short.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text:
            "Analyze these loan scenarios.\n\n" +
            "Return ONLY valid JSON that matches the required schema.\n\n" +
            `Scenarios: ${scenarioSummary}`,
        },
      ],
    },
  ],

  text: {
    format: {
      type: "json_schema",
      name: "ai_insights",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          tips: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "string" },
            description: "Two short actionable tips (<= 30 words each).",
          },
          forecast: {
            type: "string",
            description: "One short sentence about near-term consumer interest-rate outlook.",
          },
        },
        required: ["tips", "forecast"],
      },
    },
  },
};
*/
