// DocDeck AI Layer — Document Intelligence (packages/ai)
//
// Contrato estável entre o domínio (apps/api) e o provedor de IA
// concreto (Anthropic, OpenAI, ...). O domínio nunca fala diretamente
// com a API HTTP de um provedor — sempre através deste `AIProviderAdapter`,
// para permitir trocar/combinar provedores sem tocar em regra de negócio
// (ARCHITECTURE.md §9).

export interface DocumentAnalysisResult {
  documentTypeGuess: string | null;
  extractedFields: Record<string, string | null>;
  confidence: number; // 0-1 — nunca ausente: toda saída de IA carrega confiança (SECURITY.md §8)
  anomalies: string[];
  summary: string;
}

export interface AIProviderAdapter {
  readonly provider: string;
  readonly model: string;
  analyzeDocument(content: string): Promise<DocumentAnalysisResult>;
}
