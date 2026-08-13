"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ContractRow {
  id: string;
  code: string;
  status: string;
  modalidade: string | null;
  startDate: string;
  endDate: string;
  riskScore: number;
  riskLevel: string;
  company: { id: string; name: string };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ContractRow[]>("/contracts")
      .then(setContracts)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!contracts) return <div className="text-muted">Carregando contratos...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">CLM — Contratos</h1>
          <p className="text-sm text-muted">{contracts.length} contratos neste tenant.</p>
        </div>
        <Link
          href="/contracts/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Novo contrato
        </Link>
      </div>

      <Card className="p-0">
        {contracts.length === 0 ? (
          <div className="p-6 text-sm text-muted">
            Nenhum contrato cadastrado ainda. Clique em &quot;+ Novo contrato&quot; para iniciar o
            fluxo de cadastro.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Modalidade</th>
                <th className="px-4 py-3 font-medium">Vigência</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risco</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-black/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/contracts/${c.id}`}
                      className="font-medium text-gray-900 hover:text-accent"
                    >
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.company.name}</td>
                  <td className="px-4 py-3 text-muted">{c.modalidade ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(c.startDate).toLocaleDateString("pt-BR")} –{" "}
                    {new Date(c.endDate).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RiskBadge level={c.riskLevel} />
                      <span className="tabular-nums text-muted">{c.riskScore}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
