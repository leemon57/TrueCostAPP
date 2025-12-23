type AiInsights = {
  tips: string[];
  forecast: string;
};

const OPENAI_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_SCENARIOS = 5;

const jsonResponse = (body: any, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const formatFallback = (message: string): AiInsights => ({
  tips: ["AI tips are currently unavailable.", message],
  forecast: "Neutral outlook. Check your API key and network.",
});

const summarizeScenarios = (scenarios: any[]): string => {
  if (!Array.isArray(scenarios) || scenarios.length === 0) return "No scenarios provided.";

  return scenarios
    .slice(0, MAX_SCENARIOS)
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
};

const coerceAiInsights = (value: any): AiInsights | null => {
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
};

const extractOutputText = (resJson: any): string | null => {
  if (typeof resJson?.output_text === "string" && resJson.output_text.trim()) {
    return resJson.output_text.trim();
  }

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
};

export async function POST(request: Request) {
  if (!OPENAI_API_KEY) {
    return jsonResponse(formatFallback("Set OPENAI_API_KEY in your server environment."), 500);
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (e) {
    return jsonResponse(formatFallback("Invalid JSON payload."), 400);
  }

  const trimmedScenarios = Array.isArray(payload?.scenarios)
    ? payload.scenarios.slice(0, MAX_SCENARIOS)
    : [];

  const scenarioSummary =
    typeof payload?.summary === "string" && payload.summary.trim()
      ? payload.summary
      : summarizeScenarios(trimmedScenarios);

  const model =
    typeof payload?.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : OPENAI_MODEL;

  const openAiPayload = {
    model,
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

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(openAiPayload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn("OpenAI request failed:", res.status, errText);
      return jsonResponse(formatFallback(`OpenAI API Error: ${res.status}`), 502);
    }

    const resJson = await res.json();
    const directInsights = coerceAiInsights(resJson);
    if (directInsights) return jsonResponse(directInsights);

    const outText = extractOutputText(resJson);
    if (!outText) {
      return jsonResponse(formatFallback("OpenAI returned no structured output."), 500);
    }

    try {
      const parsed = JSON.parse(outText);
      const insights = coerceAiInsights(parsed);
      if (!insights) return jsonResponse(formatFallback("OpenAI returned unexpected JSON structure."), 500);
      return jsonResponse(insights);
    } catch (e) {
      console.warn("Failed to parse AI proxy JSON:", e);
      return jsonResponse(formatFallback("AI output was not valid JSON."), 500);
    }
  } catch (error: any) {
    console.warn("AI proxy request exception:", error?.message ?? error);
    return jsonResponse(formatFallback("Could not connect to AI service."), 500);
  }
}
