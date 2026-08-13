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
    fileName: string | null;
    status: string;
    expiresAt: string | null;
    documentType: { name: string };
  }[];
  computedRisk: {
    score: number;
    level: string;
    factors: { code: string; label: string; points: number }[];
  };
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
  if (!company) return <div className="text-muted">Carregando contratada...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{company.name}</h1>
          <p className="text-sm text-muted">{company.cnpj}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={company.status} />
          <RiskBadge level={company.riskLevel} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile
          label="Risk score (calculado)"
          value={company.computedRisk.score}
          tone={company.computedRisk.level === "CRITICAL" ? "critical" : undefined}
        />
        <StatTile label="Colaboradores" value={company.workers.length} />
        <StatTile label="Contratos" value={company.contracts.length} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-gray-800">Por que este risco?</div>
          <RiskBadge level={company.computedRisk.level} />
        </div>
        {company.computedRisk.factors.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhum fator de risco identificado nos sinais disponíveis hoje (documentos e
            colaboradores bloqueados). Requisitos contratuais pendentes ainda não entram
            no cálculo — o Requirement Engine é uma fase futura do ROADMAP.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {company.computedRisk.factors.map((f) => (
              <li key={f.code} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{f.label}</span>
                <span className="tabular-nums text-medium">+{f.points}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 text-sm font-medium text-gray-800">Colaboradores</div>
          <ul className="flex flex-col gap-2">
            {company.workers.map((w) => (
              <li key={w.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{w.name}</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={w.status} />
                  <RiskBadge level={w.riskLevel} />
                </div>
              </li>
            ))}
            {company.workers.length === 0 && <li className="text-sm text-muted">Nenhum colaborador.</li>}
          </ul>
        </Card>

        <Card>
          <div className="mb-3 text-sm font-medium text-gray-800">Contratos</div>
          <ul className="flex flex-col gap-2">
            {company.contracts.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{c.code}</span>
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
          <div className="mb-3 text-sm font-medium text-gray-800">Documentos</div>
          <ul className="flex flex-col gap-2">
            {company.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{d.documentType.name}</span>
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
