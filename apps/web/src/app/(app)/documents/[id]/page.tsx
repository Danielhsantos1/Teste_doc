"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

interface AIAnalysisRow {
  id: string;
  status: "COMPLETED" | "FAILED";
  provider: string;
  model: string;
  confidence: number | null;
  documentTypeGuess: string | null;
  extractedFields: Record<string, string | null> | null;
  anomalies: string[] | null;
  summary: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface DocumentDetail {
  id: string;
  fileName: string | null;
  content: string | null;
  status: string;
  expiresAt: string | null;
  aiConfidence: number | null;
  documentType: { name: string; isCritical: boolean };
  company: { id: string; name: string } | null;
  worker: { id: string; name: string } | null;
  analyses: AIAnalysisRow[];
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  function load() {
    apiFetch<DocumentDetail>(`/documents/${params.id}`)
      .then((d) => {
        setDoc(d);
        setContent(d.content ?? "");
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, [params.id]);

  async function handleSaveContent() {
    setSavingContent(true);
    setError(null);
    try {
      await apiFetch(`/documents/${params.id}/content`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o conteúdo.");
    } finally {
      setSavingContent(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      await apiFetch(`/documents/${params.id}/analyze`, { method: "POST" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível analisar o documento.");
    } finally {
      setAnalyzing(false);
    }
  }

  if (error && !doc) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!doc) return <div className="text-muted">Carregando documento...</div>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{doc.documentType.name}</h1>
          <p className="text-sm text-muted">
            {doc.worker?.name ?? doc.company?.name ?? "—"}
            {doc.documentType.isCritical && (
              <span className="ml-2 text-xs font-medium uppercase text-critical">Crítico</span>
            )}
          </p>
        </div>
        <StatusBadge status={doc.status} />
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-900">Conteúdo do documento</div>
          {doc.aiConfidence != null && (
            <span className="text-xs text-muted">Confiança IA: {(doc.aiConfidence * 100).toFixed(1)}%</span>
          )}
        </div>
        <p className="mb-3 text-xs text-muted">
          Texto do documento disponível para análise por IA — stand-in para o pipeline de OCR real
          (ainda não implementado). Cole aqui o texto do documento para permitir a análise.
        </p>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Cole o texto do documento aqui..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-gray-900 outline-none focus:border-accent"
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleSaveContent}
            disabled={savingContent}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-black/5 disabled:opacity-50"
          >
            {savingContent ? "Salvando..." : "Salvar conteúdo"}
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !doc.content}
            title={!doc.content ? "Salve o conteúdo antes de analisar" : undefined}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {analyzing ? "Analisando..." : "Analisar com IA"}
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-critical">{error}</div>}
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Histórico de análises
        </h2>
        {doc.analyses.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Nenhuma análise executada ainda.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {doc.analyses.map((a) => (
              <Card key={a.id}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-muted">
                    {a.provider}/{a.model} — {new Date(a.createdAt).toLocaleString("pt-BR")}
                  </span>
                  <StatusBadge status={a.status} />
                </div>

                {a.status === "FAILED" ? (
                  <p className="text-sm text-critical">{a.errorMessage}</p>
                ) : (
                  <div className="flex flex-col gap-2 text-sm">
                    <div>
                      <span className="text-xs font-medium uppercase text-muted">Confiança: </span>
                      <span className="text-gray-900">{((a.confidence ?? 0) * 100).toFixed(1)}%</span>
                    </div>
                    {a.documentTypeGuess && (
                      <div>
                        <span className="text-xs font-medium uppercase text-muted">Tipo identificado: </span>
                        <span className="text-gray-900">{a.documentTypeGuess}</span>
                      </div>
                    )}
                    {a.extractedFields && Object.keys(a.extractedFields).length > 0 && (
                      <div>
                        <span className="text-xs font-medium uppercase text-muted">Campos extraídos</span>
                        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(a.extractedFields)
                            .filter(([, v]) => v)
                            .map(([k, v]) => (
                              <li key={k} className="text-xs text-gray-700">
                                <span className="text-muted">{k}:</span> {v}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                    {a.anomalies && a.anomalies.length > 0 && (
                      <div>
                        <span className="text-xs font-medium uppercase text-medium">Anomalias</span>
                        <ul className="mt-1 list-disc pl-4">
                          {a.anomalies.map((an, i) => (
                            <li key={i} className="text-xs text-medium">
                              {an}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {a.summary && <p className="text-sm text-gray-700">{a.summary}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
