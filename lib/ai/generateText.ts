const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const DEFAULT_MODEL = "deepseek/deepseek-v4-pro";

export interface GenerateTextResult {
  text: string;
  tokensUsados: number | null;
  modelo: string;
}

export class OpenRouterError extends Error {
  public readonly statusCode: number;
  public readonly body: unknown;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = "OpenRouterError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

export interface GenerateTextOptions {
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
}

export async function generateText(
  options: GenerateTextOptions
): Promise<GenerateTextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "OPENROUTER_API_KEY no configurada",
      500
    );
  }

  const model = options.model ?? process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

  const messages: Array<{ role: "system" | "user"; content: string }> = [];
  if (options.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: options.prompt });

  const body: Record<string, unknown> = {
    model,
    messages,
  };
  if (typeof options.temperature === "number") {
    body.temperature = options.temperature;
  }

  const siteUrl =
    process.env.OPENROUTER_SITE_URL ??
    (process.env.NEXT_PUBLIC_SITE_URL as string | undefined);
  const appTitle = process.env.OPENROUTER_APP_TITLE ?? "FitBoch";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  if (appTitle) headers["X-OpenRouter-Title"] = appTitle;

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await response.json();
    } catch {
      try {
        errorBody = await response.text();
      } catch {
        errorBody = null;
      }
    }
    console.error("OpenRouter error:", response.status, errorBody);
    throw new OpenRouterError(
      `OpenRouter respondió ${response.status}`,
      response.status,
      errorBody
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };

  const text = data.choices?.[0]?.message?.content ?? "";
  const tokensUsados = data.usage?.total_tokens ?? null;
  const modelo = data.model ?? model;

  return { text, tokensUsados, modelo };
}