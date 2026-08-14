"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";

interface CreateCompanyResponse {
  company: { id: string; name: string; status: string };
  devConfirmationToken: string;
}

interface ConfirmedCompany {
  id: string;
  status: string;
  documents: { id: string; status: string; documentType: { name: string } }[];
}

export default function NewCompanyPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Passo 1 concluído: aguardando "confirmação de e-mail".
  const [pending, setPending] = useState<CreateCompanyResponse | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedCompany | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch<CreateCompanyResponse>("/companies", {
        method: "POST",
        body: JSON.stringify({ name, cnpj, contactEmail }),
      });
      setPending(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar a contratada.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!pending) return;
    setError(null);
    setConfirming(true);
    try {
      const res = await apiFetch<ConfirmedCompany>(`/companies/${pending.company.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ token: pending.devConfirmationToken }),
      });
      setConfirmed(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar o cadastro.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Nova contratada</h1>
        <p className="text-sm text-muted">
          Cadastro de contratada — o mesmo fluxo usado a partir da criação de um contrato.
        </p>
      </div>

      {!pending && (
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
                Razão social
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
                CNPJ
              </label>
              <input
                required
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
                E-mail de contato
              </label>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
              />
            </div>

            {error && <div className="text-sm text-critical">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Cadastrar contratada"}
            </button>
          </form>
        </Card>
      )}

      {pending && !confirmed && (
        <Card>
          <div className="mb-2 text-sm font-medium text-gray-800">Confirme o cadastro</div>
          <p className="mb-4 text-sm text-muted">
            Em produção, um e-mail de confirmação seria enviado para{" "}
            <span className="text-gray-200">{contactEmail}</span> (Notification Engine — ainda
            não implementado). Neste ambiente de desenvolvimento, o clique no link do e-mail é
            simulado pelo botão abaixo — as credenciais de acesso só são criadas e a contratada só
            fica ACTIVE depois desta confirmação.
          </p>
          <div className="mb-4 rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-muted">
            token: {pending.devConfirmationToken}
          </div>

          {error && <div className="mb-3 text-sm text-critical">{error}</div>}

          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? "Confirmando..." : "Simular confirmação de e-mail"}
          </button>
        </Card>
      )}

      {confirmed && (
        <Card>
          <div className="mb-2 text-sm font-medium text-low">Cadastro confirmado</div>
          <p className="mb-4 text-sm text-muted">
            A contratada está <span className="text-gray-200">ACTIVE</span> e já abre com as
            pendências documentais obrigatórias:
          </p>
          <ul className="mb-4 flex flex-col gap-2">
            {confirmed.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{d.documentType.name}</span>
                <span className="text-xs text-medium">{d.status}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/companies/${confirmed.id}`}
            className="inline-block rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            onClick={() => router.refresh()}
          >
            Ver contratada
          </Link>
        </Card>
      )}
    </div>
  );
}
