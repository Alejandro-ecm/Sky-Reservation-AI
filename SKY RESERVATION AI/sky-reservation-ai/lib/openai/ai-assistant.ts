import OpenAI from "openai";
import { openai } from "./client";
import { CRM_LEAD_SCORER_PROMPT } from "./prompts";

// ============================================================
// TYPES
// ============================================================

export interface LeadScoreResult {
  score: number;
  reasoning: string;
}

// ============================================================
// GENERATE RESPONSE — with retry logic
// ============================================================

export async function generateResponse(
  messages: OpenAI.ChatCompletionMessageParam[],
  systemPrompt: string,
  retries = 3
): Promise<string> {
  const allMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: allMessages,
        temperature: 0.7,
        max_tokens: 1024,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }
      return content;
    } catch (error) {
      console.error(`OpenAI attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw new Error(
          `Failed to generate response after ${retries} attempts: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((res) => setTimeout(res, Math.pow(2, attempt - 1) * 1000));
    }
  }

  throw new Error("Unexpected error in generateResponse");
}

// ============================================================
// SCORE LEAD WITH AI
// ============================================================

export async function scoreLeadWithAI(
  customerData: object
): Promise<LeadScoreResult> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: "user",
      content: `Analiza los siguientes datos del cliente y devuelve el JSON de scoring:\n\n${JSON.stringify(
        customerData,
        null,
        2
      )}`,
    },
  ];

  const rawResponse = await generateResponse(messages, CRM_LEAD_SCORER_PROMPT);

  try {
    // Extract JSON even if there's surrounding text
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0]) as { score: number; reasoning: string };

    if (
      typeof parsed.score !== "number" ||
      parsed.score < 0 ||
      parsed.score > 100
    ) {
      throw new Error("Invalid score value");
    }

    return {
      score: Math.round(parsed.score),
      reasoning: parsed.reasoning || "No reasoning provided",
    };
  } catch (parseError) {
    console.error("Failed to parse lead score response:", rawResponse, parseError);
    // Fallback: return a neutral score
    return {
      score: 50,
      reasoning: "No se pudo calcular el puntaje automáticamente. Se asignó puntaje neutro.",
    };
  }
}
