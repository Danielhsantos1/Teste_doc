"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, StatTile } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";

interface CompanyDetail {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  workers: { id: string; name: string; status: string; riskLevel: string }[];
  contracts: { id: string; code: string; status: string; riskLevel: string; riskScore: number }[];
  documents: {
    id: string;
    fileName: string;
    status: string;
    expiresAt: string | null;
    documentType: { name: string };
  }[];
}

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CompanyDetail>(`/companies/${params.id}`)
      .then(setCompany)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!company) return <div className="text-muted">Carregando empresa...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-50">{company.name}</h1>
          <p className="text-sm text-muted">{company.cnpj}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={company.status} />
          <RiskBadge level={company.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Risk score" value={company.riskScore} tone={company.riskLevel === "CRITICAL" ? "critical" : undefined} />
        <StatTile label="Trabalhadores" value={company.workers.length} />
        <StatTile label="Contratos" value={company.contracts.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-medium text-gray-100">Trabalhadores</div>
          <ul className="flex flex-col gap-2">
            {company.workers.map((w) => (
              <li key={w.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-100">{w.name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={w.status} />
                  <RiskBadge level={w.riskLevel} />
                </div>
              </li>
            ))}
            {company.workers.length === 0 && <li className="text-sm text-muted">Nenhum trabalhador.</li>}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 text-sm font-medium text-gray-100">Contratos</div>
          <ul className="flex flex-col gap-2">
            {company.contracts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-100">{c.code}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted">{c.riskScore}</span>
                  <RiskBadge level={c.riskLevel} />
                </div>
              </li>
            ))}
            {company.contracts.length === 0 && <li className="text-sm text-muted">Nenhum contrato.</li>}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 text-sm font-medium text-gray-100">Documentos</div>
          <ul className="flex flex-col gap-2">
            {company.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-100">{d.documentType.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">
                    {d.expiresAt ? `vence em ${new Date(d.expiresAt).toLocaleDateString("pt-BR")}` : "sem vencimento"}
                  </span>
                  <StatusBadge status={d.status} />
                </div>
              </li>
            ))}
            {company.documents.length === 0 && <li className="text-sm text-muted">Nenhum documento.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
