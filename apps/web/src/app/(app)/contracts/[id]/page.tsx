"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { RiskBadge, StatusBadge } from "@/components/ui/badge";

interface ContractDetail {
  id: string;
  code: string;
  status: string;
  modalidade: string | null;
  objeto: string | null;
  escopo: string | null;
  technicalProposal: string | null;
  commercialValue: number | null;
  paymentTerms: string | null;
  additionalNotes: string | null;
  startDate: string;
  endDate: string;
  riskScore: number;
  riskLevel: string;
  company: { id: string; name: string; cnpj: string };
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<ContractDetail>(`/contracts/${params.id}`)
      .then(setContract)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!contract) return <div className="text-muted">Carregando contrato...</div>;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{contract.code}</h1>
          <Link href={`/companies/${contract.company.id}`} className="text-sm text-accent hover:underline">
            {contract.company.name}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract.status} />
          <RiskBadge level={contract.riskLevel} />
        </div>
      </div>

      <Card className="grid grid-cols-2 gap-4">
        <Field label="Modalidade" value={contract.modalidade} />
        <Field
          label="Vigência"
          value={`${new Date(contract.startDate).toLocaleDateString("pt-BR")} – ${new Date(contract.endDate).toLocaleDateString("pt-BR")}`}
        />
        <Field
          label="Valor comercial"
          value={
            contract.commercialValue != null
              ? contract.commercialValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : null
          }
        />
        <Field label="Condições de pagamento" value={contract.paymentTerms} />
      </Card>

      <Card>
        <Field label="Objeto da contratação" value={contract.objeto} />
      </Card>
      <Card>
        <Field label="Escopo" value={contract.escopo} />
      </Card>
      <Card>
        <Field label="Proposta técnica" value={contract.technicalProposal} />
      </Card>
      {contract.additionalNotes && (
        <Card>
          <Field label="Observações adicionais" value={contract.additionalNotes} />
        </Card>
      )}
    </div>
  );
}
