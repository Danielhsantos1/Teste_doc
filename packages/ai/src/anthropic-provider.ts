import { AIProviderAdapter, DocumentAnalysisResult } from "./types";
import { AIProviderRequestError, AIResponseParseError } from "./errors";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const AI_PROMPT_VERSION = "v1";

const SYSTEM_PROMPT = `Você é o motor de Document Intelligence do DocDeck, uma plataforma de gestão de terceiros.
Analise o texto de um documento (ASO, NR-35, contrato social, certidão negativa de débitos, etc.)
e responda APENAS com um JSON válido, sem markdown, sem texto antes ou depois, no formato exato:

{
  "documentTypeGuess": string ou null,
  "extractedFields": {
    "personName": string ou null,
    "cpf": string ou null,
    "cnpj": string ou null,
    "issuer": string ou null,
    "issueDate": string (ISO 8601) ou null,
    "expiryDate": string (ISO 8601) ou null
  },
  "confidence": número entre 0 e 1,
  "anomalies": array de strings (vazio se nenhuma),
  "summary": string curta (1-2 frases) explicando a avaliação
}

Regras:
- Nunca invente dado que não esteja no texto. Se um campo não aparecer, use null.
- "confidence" reflete sua certeza sobre a classificação e extração, não sobre a validade do documento.
- "anomalies" deve listar inconsistências reais encontradas no texto (datas conflitantes, campos
  obrigatórios ausentes, formato inválido de CPF/CNPJ), nunca afirmações de fraude.`;

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

export class AnthropicDocumentProvider implements AIProviderAdapter {
  readonly provider = "anthropic";

  constructor(
    private readonly apiKey: string,
    readonly model: string = "claude-sonnet-5"
  ) {}

  async analyzeDocument(content: string): Promise<DocumentAnalysisResult> {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Texto do documento:\n\n${content}` }],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new AIProviderRequestError(
        `Anthropic API respondeu ${response.status}: ${body.slice(0, 500)}`
      );
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new AIProviderRequestError("Resposta da Anthropic API sem conteúdo de texto");
    }

    const jsonText = stripCodeFences(text);
    let parsed: Partial<DocumentAnalysisResult>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      throw new AIResponseParseError("Resposta da IA não é um JSON válido", text);
    }

    return {
      documentTypeGuess: parsed.documentTypeGuess ?? null,
      extractedFields: parsed.extractedFields ?? {},
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      anomalies: Array.isArray(parsed.anomalies) ? parsed.anomalies : [],
      summary: parsed.summary ?? "",
    };
  }
}
