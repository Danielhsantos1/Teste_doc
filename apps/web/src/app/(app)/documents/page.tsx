"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface DocumentRow {
  id: string;
  fileName: string | null;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  aiConfidence: number | null;
  documentType: { name: string };
  company: { id: string; name: string } | null;
  worker: { id: string; name: string } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DocumentRow[]>("/documents")
      .then(setDocuments)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!documents) return <div className="text-muted">Carregando documentos...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Documentos</h1>
        <p className="text-sm text-muted">{documents.length} documentos neste tenant, ordenados por vencimento.</p>
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Relacionado a</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Confiança IA</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-black/5">
                <td className="px-4 py-3 font-medium text-gray-900">{d.documentType.name}</td>
                <td className="px-4 py-3 text-muted">{d.worker?.name ?? d.company?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("pt-BR") : "sem vencimento"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {d.aiConfidence != null ? `${(d.aiConfidence * 100).toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
