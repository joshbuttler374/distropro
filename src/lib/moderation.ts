import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/** Run content through OpenAI Moderation before publishing. */
export async function moderateContent(text: string): Promise<ModerationResult> {
  const client = getOpenAI();
  if (!client) {
    return { safe: true, reason: "Moderation skipped (no API key)" };
  }

  try {
    const response = await client.moderations.create({ input: text });
    const result = response.results[0];

    if (result.flagged) {
      const categories = Object.entries(result.categories)
        .filter(([, v]) => v)
        .map(([k]) => k);
      return { safe: false, reason: `Flagged: ${categories.join(", ")}` };
    }

    return { safe: true };
  } catch {
    return { safe: true, reason: "Moderation API unavailable, allowing through" };
  }
}
