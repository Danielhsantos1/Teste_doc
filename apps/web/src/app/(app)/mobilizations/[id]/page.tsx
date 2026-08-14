"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

interface MobilizationDetail {
  id: string;
  status: "AGUARDANDO_PRESTADOR" | "CONCLUIDA" | "CANCELADA";
  isNewCompany: boolean;
  createdAt: string;
  company: {
    id: string;
    name: string;
    cnpj: string;
    status: string;
    contactEmail: string | null;
    confirmationToken: string | null;
  };
  contract: { id: string; code: string; status: string } | null;
  pendingContractCode: string | null;
}

export default function MobilizationDetailPage() {
  const params = useParams<{ id: string }>();
  const [mobilization, setMobilization] = useState<MobilizationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function load() {
    apiFetch<MobilizationDetail>(`/mobilizations/${params.id}`)
      .then(setMobilization)
      .catch((e) => setError(e.message));
  }

  useEffect(load, [params.id]);

  async function handleConfirm() {
    if (!mobilization?.company.confirmationToken) return;
    setError(null);
    setConfirming(true);
    try {
      await apiFetch(`/mobilizations/${mobilization.id}/confirm-provider`, {
        method: "POST",
        body: JSON.stringify({ token: mobilization.company.confirmationToken }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar o cadastro.");
    } finally {
      setConfirming(false);
    }
  }

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!mobilization) return <div className="text-muted">Carregando mobilização...</div>;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{mobilization.company.name}</h1>
          <p className="text-sm text-muted">{mobilization.company.cnpj}</p>
        </div>
        <StatusBadge status={mobilization.status} />
      </div>

      <Card>
        <div className="mb-2 text-sm font-medium text-gray-800">
          {mobilization.isNewCompany ? "Contratada nova" : "Contratada já cadastrada"}
        </div>
        <p className="text-sm text-muted">
          {mobilization.isNewCompany
            ? "O contrato só é efetivado depois que a contratada confirma o cadastro."
            : "Contratada já ativa neste tenant — o contrato foi vinculado imediatamente."}
        </p>
      </Card>

      {mobilization.status === "AGUARDANDO_PRESTADOR" && (
        <Card>
          <div className="mb-2 text-sm font-medium text-gray-800">Aguardando confirmação da contratada</div>
          <p className="mb-4 text-sm text-muted">
            Em produção, um e-mail de confirmação seria enviado para{" "}
            <span className="text-gray-200">{mobilization.company.contactEmail}</span>{" "}
            (Notification Engine — ainda não implementado). Neste ambiente de desenvolvimento, o
            clique no link é simulado pelo botão abaixo — o contrato só é criado e a contratada só
            fica ACTIVE depois desta confirmação (etapa &quot;DocDeck / Analista&quot; do
            processo, automática nesta fase).
          </p>
          <div className="mb-4 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-muted">
            token: {mobilization.company.confirmationToken}
          </div>

          {error && <div className="mb-3 text-sm text-critical">{error}</div>}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "Confirmando..." : "Simular confirmação da contratada"}
          </button>
        </Card>
      )}

      {mobilization.status === "CONCLUIDA" && mobilization.contract && (
        <Card>
          <div className="mb-2 text-sm font-medium text-low">Mobilização concluída</div>
          <p className="mb-4 text-sm text-muted">
            Contratada ativa e contrato vinculado.
          </p>
          <div className="flex gap-3">
            <Link
              href={`/contracts/${mobilization.contract.id}`}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Ver contrato {mobilization.contract.code}
            </Link>
            <Link
              href={`/companies/${mobilization.company.id}`}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-black/5"
            >
              Ver contratada
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
