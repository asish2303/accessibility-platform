import { NextResponse } from "next/server";
import {
  allowedNeeds,
  allowedSupportTypes,
  classifyQuery,
  difficultyOptions,
  type Need,
  type SupportType,
} from "@/lib/smart-match";

const MAX_QUERY_LENGTH = 500;
const AI_TIMEOUT_MS = 10000;

/*
 * Very small in-memory rate limiter. It is best-effort only
 * (serverless instances do not share memory) but it stops simple
 * abuse of a route that spends API credits.
 */
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;
const rateLimitHits = new Map<
  string,
  { count: number; resetAt: number }
>();

function isRateLimited(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  if (rateLimitHits.size > 1000) {
    for (const [key, value] of rateLimitHits) {
      if (value.resetAt <= now) rateLimitHits.delete(key);
    }
  }

  const entry = rateLimitHits.get(ip);

  if (!entry || entry.resetAt <= now) {
    rateLimitHits.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

/*
 * The raw Responses API does NOT return a top-level `output_text`
 * (that is an SDK convenience). The text lives inside an item of
 * type "message". For reasoning models, output[0] can be a
 * "reasoning" item, so we must search rather than take output[0].
 */
function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text) {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    for (const item of data.output) {
      if (item?.type !== "message" || !Array.isArray(item.content)) continue;

      for (const part of item.content) {
        if (
          (part?.type === "output_text" || part?.type === "text") &&
          typeof part.text === "string" &&
          part.text
        ) {
          return part.text;
        }
      }
    }
  }

  return "";
}

function parseModelJson(raw: string): any | null {
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const query =
      typeof body?.query === "string"
        ? body.query.trim().slice(0, MAX_QUERY_LENGTH)
        : "";

    const language = body?.language === "ml" ? "ml" : "en";

    if (!query) {
      return NextResponse.json(
        { error: "Please provide a support request." },
        { status: 400 }
      );
    }

    /*
     * If no API key exists, use the local fallback so the
     * application still works during development.
     */
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        ...classifyQuery(query),
        source: "fallback",
      });
    }

    // Set OPENAI_MODEL in .env.local. If the model name is wrong the
    // request simply fails and the local fallback is used.
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

    const systemPrompt = `
You are the accessibility support classifier for ACCESS+.

Your job is ONLY to understand a person's accessibility support request.
The request may be written in English or Malayalam.

Return a valid JSON object with exactly these fields:

{
  "need": "vision" | "hearing" | "mobility" | "communication" | "",
  "supportType": "assistive-device" | "government" | "provider" | "repair" | "",
  "difficulty": string[],
  "confidence": number,
  "explanation": string
}

Allowed difficulty labels for each need. Use these exact strings only:
${JSON.stringify(difficultyOptions)}

Rules:

1. Identify the person's accessibility need when the request provides enough information.
2. Never invent a need. Never invent a support type.
3. If the person describes a difficulty but does not specifically request a
   device, government scheme, provider, or repair, leave "supportType" as "".
4. "I have trouble walking outside" => need "mobility", difficulty ["Moving outdoors"], supportType "".
5. "I need a wheelchair" => need "mobility", supportType "assistive-device".
6. "wheelchair" means mobility unless the request clearly says something else.
7. A broken, damaged, stopped-working, or repair request => supportType "repair".
8. A request for a scheme, subsidy, ADIP, benefit, eligibility, or government
   assistance => supportType "government".
9. A request for a device or equipment => supportType "assistive-device".
10. A request for an organization, therapist, professional, or service provider
    => supportType "provider".
11. "difficulty" must only contain labels from the allowed list for the chosen need.
    If none clearly fits, return an empty array.
12. "confidence" must be a number between 0 and 1.
13. If the need is clear but the support type is not, that is NOT a failure.
14. If uncertain about the need, leave "need" empty. If uncertain about the
    support type, leave "supportType" empty.
15. Do not provide medical diagnosis.
16. Do not claim eligibility. Eligibility comes from the verified database.
17. Write "explanation" as one short sentence in ${
      language === "ml" ? "Malayalam" : "English"
    }.
18. Respond with JSON only, no markdown.
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let response: Response;

    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query },
          ],
          text: { format: { type: "json_object" } },
          // Reasoning models spend part of this budget on hidden
          // reasoning tokens, so keep it comfortably large.
          max_output_tokens: 1000,
        }),
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timeout);

      return NextResponse.json({
        ...classifyQuery(query),
        source: "fallback-after-ai-error",
      });
    }

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({
        ...classifyQuery(query),
        source: "fallback-after-ai-error",
      });
    }

    const data = await response.json();
    const parsed = parseModelJson(extractOutputText(data));

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json({
        ...classifyQuery(query),
        source: "fallback-invalid-ai-response",
      });
    }

    const validNeed: Need | "" = allowedNeeds.includes(parsed.need)
      ? parsed.need
      : "";

    // The AI could not identify a need: give the keyword matcher a chance.
    if (!validNeed) {
      return NextResponse.json({
        ...classifyQuery(query),
        source: "fallback-ai-unsure",
      });
    }

    const validSupportType: SupportType | "" = allowedSupportTypes.includes(
      parsed.supportType
    )
      ? parsed.supportType
      : "";

    const validDifficulty: string[] = Array.isArray(parsed.difficulty)
      ? parsed.difficulty
          .filter(
            (item: unknown): item is string =>
              typeof item === "string" &&
              difficultyOptions[validNeed].includes(item)
          )
          .slice(0, 4)
      : [];

    const confidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : validSupportType
          ? 0.72
          : 0.65;

    const explanation =
      validSupportType &&
      typeof parsed.explanation === "string" &&
      parsed.explanation.trim()
        ? parsed.explanation.trim()
        : validSupportType
          ? "The request was matched using the detected need, support type, difficulty, and relevant keywords."
          : "The accessibility need was identified from the request. No specific support type was requested, so relevant verified support options can be shown.";

    return NextResponse.json({
      need: validNeed,
      supportType: validSupportType,
      difficulty: validDifficulty,
      confidence,
      explanation,
      source: "ai",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process the request." },
      { status: 500 }
    );
  }
}