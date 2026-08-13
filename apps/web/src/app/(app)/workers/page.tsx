"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface WorkerRow {
  id: string;
  name: string;
  role: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  company: { id: string; name: string };
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<WorkerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<WorkerRow[]>("/workers")
      .then(setWorkers)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!workers) return <div className="text-muted">Carregando trabalhadores...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-50">Trabalhadores</h1>
        <p className="text-sm text-muted">{workers.length} trabalhadores neste tenant.</p>
      </div>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Risco</th>
            </tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-white/5">
                <td className="px-4 py-3">
                  <Link href={`/workers/${w.id}`} className="font-medium text-gray-50 hover:text-accent">
                    {w.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{w.company.name}</td>
                <td className="px-4 py-3 text-muted">{w.role}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={w.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RiskBadge level={w.riskLevel} />
                    <span className="tabular-nums text-muted">{w.riskScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
