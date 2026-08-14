"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MobilizationRow {
  id: string;
  status: string;
  isNewCompany: boolean;
  createdAt: string;
  company: { id: string; name: string; cnpj: string };
  contract: { id: string; code: string } | null;
}

export default function MobilizationsPage() {
  const [mobilizations, setMobilizations] = useState<MobilizationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MobilizationRow[]>("/mobilizations")
      .then(setMobilizations)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!mobilizations) return <div className="text-muted">Carregando mobilizações...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">MOB — Mobilizações</h1>
          <p className="text-sm text-muted">
            Cadastro e vinculação de contratadas a novos contratos. {mobilizations.length}{" "}
            mobilizações neste tenant.
          </p>
        </div>
        <Link
          href="/mobilizations/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Nova mobilização
        </Link>
      </div>

      <Card className="p-0">
        {mobilizations.length === 0 ? (
          <div className="p-6 text-sm text-muted">
            Nenhuma mobilização iniciada ainda. Clique em &quot;+ Nova mobilização&quot; para
            cadastrar uma contratada e vincular um contrato.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Contratada</th>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="px-4 py-3 font-medium">Contrato</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Iniciada em</th>
              </tr>
            </thead>
            <tbody>
              {mobilizations.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-black/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/mobilizations/${m.id}`}
                      className="font-medium text-gray-900 hover:text-accent"
                    >
                      {m.company.name}
                    </Link>
                    <div className="text-xs text-muted">{m.company.cnpj}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {m.isNewCompany ? "Contratada nova" : "Contratada já cadastrada"}
                  </td>
                  <td className="px-4 py-3 text-muted">{m.contract?.code ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(m.createdAt).toLocaleDateString("pt-BR")}
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
