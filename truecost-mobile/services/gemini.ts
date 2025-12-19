import { loanScenarios } from "../db/schema";

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export type AiInsights = {
  tips: string[];
  forecast: string;
};

function summarizeScenarios(scenarios: typeof loanScenarios.$inferSelect[]): string {
  if (!scenarios.length) return "No scenarios saved.";
  return scenarios
    .slice(0, 5)
    .map(s => `${s.name}: $${s.principal.toFixed(0)}, ${s.termMonths}mo, ${s.paymentFrequency}, rate=${s.fixedAnnualRate ?? s.spreadOverPolicyRate ?? 0}`)
    .join("; ");
}

function formatFallback(message: string): AiInsights {
  return {
    tips: [
      "AI tips are unavailable until you add a Gemini API key.",
      "Set EXPO_PUBLIC_GEMINI_API_KEY in your app config/env and reload.",
      message,
    ],
    forecast: "Neutral outlook. Provide an API key to fetch live rate guidance.",
  };
}

export async function fetchAiInsights(
  scenarios: typeof loanScenarios.$inferSelect[]
): Promise<AiInsights> {
  const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return formatFallback("Using static copy until the key is set.");
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text:
              "You are a personal finance assistant. Given user loan scenarios, produce 2 short, actionable tips (concise, under 30 words each). " +
              "Also provide a one-sentence interest rate outlook for consumers. Return tips as bullet-like lines separated by newlines; put the outlook prefixed with 'Forecast:' as the last line. " +
              `Scenarios: ${summarizeScenarios(scenarios)}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 200,
    },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn("Gemini request failed", await res.text());
      return formatFallback("Gemini request failed. Check the API key or network.");
    }

    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return formatFallback("Gemini returned no content.");
    }

    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const tips: string[] = [];
    let forecast = "Neutral outlook.";
    lines.forEach(line => {
      if (/^forecast[:\-]/i.test(line)) {
        forecast = line.replace(/^forecast[:\-]\s*/i, "");
      } else {
        tips.push(line.replace(/^[-•]\s*/, ""));
      }
    });

    return {
      tips: tips.length ? tips : ["No tips generated."],
      forecast,
    };
  } catch (error) {
    console.warn("Gemini error", error);
    return formatFallback("Gemini call threw an error.");
  }
}
