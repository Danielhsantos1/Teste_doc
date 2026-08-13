import { AIProviderAdapter } from "./types";
import { AnthropicDocumentProvider, AI_PROMPT_VERSION } from "./anthropic-provider";
import { AIProviderNotConfiguredError } from "./errors";

export * from "./types";
export * from "./errors";
export { AI_PROMPT_VERSION };

/**
 * Fábrica do provedor de IA configurado no ambiente. Lê `AI_PROVIDER`
 * (padrão: "anthropic") e `AI_API_KEY`. Sem chave configurada, lança
 * `AIProviderNotConfiguredError` — nunca retorna um provedor "fake" que
 * finge analisar documentos.
 */
export function createAIProvider(): AIProviderAdapter {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new AIProviderNotConfiguredError();
  }

  const provider = process.env.AI_PROVIDER ?? "anthropic";
  const model = process.env.AI_MODEL ?? "claude-sonnet-5";

  switch (provider) {
    case "anthropic":
      return new AnthropicDocumentProvider(apiKey, model);
    default:
      throw new AIProviderNotConfiguredError(`Provedor de IA desconhecido: ${provider}`);
  }
}
