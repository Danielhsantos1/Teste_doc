"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { StatTile, Card } from "@/components/ui/card";

interface Summary {
  conformidadeGeral: number;
  riscosCriticos: number;
  riscosEmAtencao: number;
  trabalhadores: number;
  empresas: number;
  documentos: number;
  documentosVencendo: number;
  documentosVencidos: number;
}

interface PriorityActions {
  criticalCompanies: { id: string; name: string; riskScore: number }[];
  blockedWorkers: { id: string; name: string; company: { name: string } }[];
  expiringDocs: { id: string; fileName: string | null; expiresAt: string; documentType: { name: string } }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [actions, setActions] = useState<PriorityActions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Summary>("/dashboard/summary"),
      apiFetch<PriorityActions>("/dashboard/priority-actions"),
    ])
      .then(([s, a]) => {
        setSummary(s);
        setActions(a);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!summary || !actions) return <div className="text-muted">Carregando Command Center...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Command Center</h1>
        <p className="text-sm text-muted">
          Visão consolidada da operação — dados de demonstração (DEMO DATA).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <StatTile label="Conformidade geral" value={`${summary.conformidadeGeral}%`} />
        <StatTile label="Riscos críticos" value={summary.riscosCriticos} tone="critical" />
        <StatTile label="Riscos em atenção" value={summary.riscosEmAtencao} tone="warning" />
        <StatTile label="Trabalhadores" value={summary.trabalhadores} />
        <StatTile label="Empresas" value={summary.empresas} />
        <StatTile label="Documentos" value={summary.documentos} />
        <StatTile label="Doc. vencendo (30d)" value={summary.documentosVencendo} tone="warning" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          O que precisa da minha atenção
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <div className="mb-3 text-sm font-medium text-critical">Empresas em risco crítico</div>
            <ul className="flex flex-col gap-2">
              {actions.criticalCompanies.length === 0 && (
                <li className="text-sm text-muted">Nenhuma empresa em risco crítico.</li>
              )}
              {actions.criticalCompanies.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/companies/${c.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                  >
                    <span className="text-gray-100">{c.name}</span>
                    <span className="tabular-nums text-critical">{c.riskScore}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-3 text-sm font-medium text-critical">Trabalhadores bloqueados</div>
            <ul className="flex flex-col gap-2">
              {actions.blockedWorkers.length === 0 && (
                <li className="text-sm text-muted">Nenhum trabalhador bloqueado.</li>
              )}
              {actions.blockedWorkers.map((w) => (
                <li key={w.id}>
                  <Link
                    href={`/workers/${w.id}`}
                    className="flex flex-col rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
                  >
                    <span className="text-gray-100">{w.name}</span>
                    <span className="text-xs text-muted">{w.company.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-3 text-sm font-medium text-medium">Documentos vencendo (30 dias)</div>
            <ul className="flex flex-col gap-2">
              {actions.expiringDocs.length === 0 && (
                <li className="text-sm text-muted">Nenhum documento vencendo.</li>
              )}
              {actions.expiringDocs.map((d) => (
                <li key={d.id} className="flex flex-col rounded-lg px-2 py-1.5 text-sm">
                  <span className="text-gray-100">{d.documentType.name}</span>
                  <span className="text-xs text-muted">
                    vence em {new Date(d.expiresAt).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
