import { test } from "node:test";
import assert from "node:assert/strict";
import { AnthropicDocumentProvider } from "../src/anthropic-provider";
import { AIProviderRequestError, AIResponseParseError } from "../src/errors";
import { createAIProvider } from "../src/index";
import { AIProviderNotConfiguredError } from "../src/errors";

function mockFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  const original = global.fetch;
  global.fetch = (async () =>
    ({
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
    }) as Response) as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

test("createAIProvider lança AIProviderNotConfiguredError sem AI_API_KEY", () => {
  const original = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  assert.throws(() => createAIProvider(), AIProviderNotConfiguredError);
  if (original) process.env.AI_API_KEY = original;
});

test("AnthropicDocumentProvider faz parse de uma resposta JSON válida", async () => {
  const restore = mockFetchOnce({
    ok: true,
    body: {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            documentTypeGuess: "ASO",
            extractedFields: { personName: "João da Silva", cpf: "000.000.000-00" },
            confidence: 0.97,
            anomalies: [],
            summary: "Documento consistente e dentro da validade.",
          }),
        },
      ],
    },
  });

  const provider = new AnthropicDocumentProvider("fake-key");
  const result = await provider.analyzeDocument("ASO de João da Silva...");

  assert.equal(result.documentTypeGuess, "ASO");
  assert.equal(result.confidence, 0.97);
  assert.equal(result.extractedFields.personName, "João da Silva");
  assert.deepEqual(result.anomalies, []);

  restore();
});

test("AnthropicDocumentProvider tolera resposta cercada por ```json fences", async () => {
  const restore = mockFetchOnce({
    ok: true,
    body: {
      content: [
        {
          type: "text",
          text: "```json\n" + JSON.stringify({ confidence: 0.5, extractedFields: {}, anomalies: [], summary: "x" }) + "\n```",
        },
      ],
    },
  });

  const provider = new AnthropicDocumentProvider("fake-key");
  const result = await provider.analyzeDocument("texto qualquer");
  assert.equal(result.confidence, 0.5);

  restore();
});

test("AnthropicDocumentProvider lança AIResponseParseError se o texto não for JSON", async () => {
  const restore = mockFetchOnce({
    ok: true,
    body: { content: [{ type: "text", text: "não é json" }] },
  });

  const provider = new AnthropicDocumentProvider("fake-key");
  await assert.rejects(() => provider.analyzeDocument("texto"), AIResponseParseError);

  restore();
});

test("AnthropicDocumentProvider lança AIProviderRequestError em resposta HTTP não-ok", async () => {
  const restore = mockFetchOnce({ ok: false, status: 401, body: { error: "unauthorized" } });

  const provider = new AnthropicDocumentProvider("fake-key");
  await assert.rejects(() => provider.analyzeDocument("texto"), AIProviderRequestError);

  restore();
});
