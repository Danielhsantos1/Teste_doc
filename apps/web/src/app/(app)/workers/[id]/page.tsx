"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, StatTile } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";

interface WorkerDetail {
  id: string;
  name: string;
  role: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  company: { id: string; name: string };
  documents: {
    id: string;
    fileName: string | null;
    status: string;
    expiresAt: string | null;
    aiConfidence: number | null;
    documentType: { name: string };
  }[];
}

export default function WorkerDetailPage() {
  const params = useParams<{ id: string }>();
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WorkerDetail>(`/workers/${params.id}`)
      .then(setWorker)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!worker) return <div className="text-muted">Carregando trabalhador...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{worker.name}</h1>
          <p className="text-sm text-muted">
            {worker.role} — {worker.company.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={worker.status} />
          <RiskBadge level={worker.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Risk score"
          value={worker.riskScore}
          tone={worker.riskLevel === "CRITICAL" ? "critical" : undefined}
        />
        <StatTile label="Documentos" value={worker.documents.length} />
      </div>

      <Card>
        <div className="mb-3 text-sm font-medium text-gray-800">Documentos</div>
        <ul className="flex flex-col gap-2">
          {worker.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-800">{d.documentType.name}</span>
              <div className="flex items-center gap-3">
                {d.aiConfidence != null && (
                  <span className="text-xs text-muted">
                    IA: {(d.aiConfidence * 100).toFixed(1)}%
                  </span>
                )}
                <span className="text-xs text-muted">
                  {d.expiresAt ? `vence em ${new Date(d.expiresAt).toLocaleDateString("pt-BR")}` : "sem vencimento"}
                </span>
                <StatusBadge status={d.status} />
              </div>
            </li>
          ))}
          {worker.documents.length === 0 && <li className="text-sm text-muted">Nenhum documento.</li>}
        </ul>
      </Card>
    </div>
  );
}
