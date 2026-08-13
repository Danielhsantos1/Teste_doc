"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface CompanyRow {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  _count: { workers: number; contracts: number; documents: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CompanyRow[]>("/companies")
      .then(setCompanies)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!companies) return <div className="text-muted">Carregando empresas...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Empresas</h1>
          <p className="text-sm text-muted">{companies.length} empresas cadastradas neste tenant.</p>
        </div>
        <Link
          href="/companies/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Nova empresa
        </Link>
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Risco</th>
              <th className="px-4 py-3 font-medium">Trabalhadores</th>
              <th className="px-4 py-3 font-medium">Contratos</th>
              <th className="px-4 py-3 font-medium">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-black/5">
                <td className="px-4 py-3">
                  <Link href={`/companies/${c.id}`} className="font-medium text-gray-900 hover:text-accent">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{c.cnpj}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={c.riskLevel} />
                    <span className="tabular-nums text-muted">{c.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">{c._count.workers}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{c._count.contracts}</td>
                <td className="px-4 py-3 tabular-nums text-muted">{c._count.documents}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
