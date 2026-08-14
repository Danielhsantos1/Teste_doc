"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { WizardStepper } from "@/components/wizard-stepper";

const STEP_LABELS = [
  "Modalidade de Contratação",
  "Objeto da Contratação",
  "Escopo",
  "Proposta Técnica",
  "Proposta Comercial",
  "Informações Adicionais",
];

const MODALIDADES = [
  { value: "CENTRALIZADA", label: "Centralizada" },
  { value: "DESCENTRALIZADA", label: "Descentralizada" },
  { value: "EMERGENCIAL", label: "Emergencial" },
];

interface CompanyOption {
  id: string;
  name: string;
  status: string;
}

interface FormState {
  modalidade: string;
  objeto: string;
  escopo: string;
  technicalProposal: string;
  commercialValue: string;
  paymentTerms: string;
  companyId: string;
  code: string;
  startDate: string;
  endDate: string;
  additionalNotes: string;
}

const EMPTY_FORM: FormState = {
  modalidade: "",
  objeto: "",
  escopo: "",
  technicalProposal: "",
  commercialValue: "",
  paymentTerms: "",
  companyId: "",
  code: "",
  startDate: "",
  endDate: "",
  additionalNotes: "",
};

function inputClass() {
  return "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent";
}

function labelClass() {
  return "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";
}

export default function NewContractPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [companies, setCompanies] = useState<CompanyOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<CompanyOption[]>("/companies")
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stepValid = (() => {
    switch (step) {
      case 0:
        return form.modalidade.length > 0;
      case 1:
        return form.objeto.trim().length >= 3;
      case 2:
        return form.escopo.trim().length >= 3;
      case 3:
        return form.technicalProposal.trim().length >= 3;
      case 4:
        return form.commercialValue.trim().length > 0 && form.paymentTerms.trim().length >= 3;
      case 5:
        return (
          form.companyId.length > 0 &&
          form.code.trim().length >= 2 &&
          form.startDate.length > 0 &&
          form.endDate.length > 0
        );
      default:
        return false;
    }
  })();

  function goNext() {
    if (!stepValid) return;
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    if (!stepValid) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiFetch<{ id: string }>("/contracts", {
        method: "POST",
        body: JSON.stringify({
          companyId: form.companyId,
          code: form.code,
          startDate: form.startDate,
          endDate: form.endDate,
          modalidade: form.modalidade,
          objeto: form.objeto,
          escopo: form.escopo,
          technicalProposal: form.technicalProposal,
          commercialValue: Number(form.commercialValue),
          paymentTerms: form.paymentTerms,
          additionalNotes: form.additionalNotes || undefined,
        }),
      });
      router.push(`/contracts/${created.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o contrato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cadastrar Novo Contrato</h1>
        <p className="text-sm text-muted">
          Preencha as informações necessárias para cadastrar um novo contrato
        </p>
      </div>

      <WizardStepper steps={STEP_LABELS} currentStep={step} />

      <Card>
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Modalidade de Contratação</h2>
            <p className="mb-4 text-sm text-muted">Informe como será realizada a contratação</p>

            <div className="text-sm font-medium text-gray-900">
              Selecione a modalidade de contratação
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {MODALIDADES.map((m) => (
                <label key={m.value} className="flex items-center gap-2 text-sm text-gray-900">
                  <input
                    type="radio"
                    name="modalidade"
                    value={m.value}
                    checked={form.modalidade === m.value}
                    onChange={(e) => set("modalidade", e.target.value)}
                    className="h-4 w-4 accent-accent"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Objeto da Contratação</h2>
            <p className="mb-4 text-sm text-muted">Descreva o objeto desta contratação</p>
            <textarea
              rows={5}
              value={form.objeto}
              onChange={(e) => set("objeto", e.target.value)}
              placeholder="Ex.: Prestação de serviços de manutenção elétrica industrial"
              className={inputClass()}
            />
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Escopo</h2>
            <p className="mb-4 text-sm text-muted">
              Detalhe o escopo dos serviços/atividades contratadas
            </p>
            <textarea
              rows={5}
              value={form.escopo}
              onChange={(e) => set("escopo", e.target.value)}
              placeholder="Ex.: Manutenção preventiva e corretiva em painéis elétricos, turnos 24h"
              className={inputClass()}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Proposta Técnica</h2>
            <p className="mb-4 text-sm text-muted">Descreva a proposta técnica apresentada</p>
            <textarea
              rows={5}
              value={form.technicalProposal}
              onChange={(e) => set("technicalProposal", e.target.value)}
              placeholder="Ex.: Equipe de 4 técnicos certificados NR-10, plantão 24h, SLA de atendimento em 2h"
              className={inputClass()}
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Proposta Comercial</h2>
              <p className="text-sm text-muted">Informe os valores e condições comerciais</p>
            </div>
            <div>
              <label className={labelClass()}>Valor do contrato (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.commercialValue}
                onChange={(e) => set("commercialValue", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Condições de pagamento</label>
              <textarea
                rows={3}
                value={form.paymentTerms}
                onChange={(e) => set("paymentTerms", e.target.value)}
                placeholder="Ex.: Faturamento mensal, pagamento em 28 dias"
                className={inputClass()}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Informações Adicionais</h2>
              <p className="text-sm text-muted">
                Finalize com os dados administrativos do contrato
              </p>
            </div>

            <div>
              <label className={labelClass()}>Empresa contratada</label>
              <select
                value={form.companyId}
                onChange={(e) => set("companyId", e.target.value)}
                className={inputClass()}
              >
                <option value="">Selecione...</option>
                {(companies ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {companies?.length === 0 && (
                <p className="mt-1 text-xs text-medium">
                  Nenhuma empresa cadastrada ainda —{" "}
                  <a href="/companies/new" className="text-accent underline">
                    cadastre uma empresa
                  </a>{" "}
                  antes de criar o contrato.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass()}>Código do contrato</label>
                <input
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="CT-2026-001"
                  className={inputClass()}
                />
              </div>
              <div />
              <div>
                <label className={labelClass()}>Data de início</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>Data de término</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            <div>
              <label className={labelClass()}>Observações adicionais</label>
              <textarea
                rows={3}
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>
        )}

        {error && <div className="mt-4 text-sm text-critical">{error}</div>}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-black/5 disabled:opacity-40"
          >
            ‹ Voltar
          </button>

          {step < STEP_LABELS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!stepValid}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Avançar ›
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!stepValid || submitting}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? "Salvando..." : "Salvar contrato"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
