"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { WizardStepper } from "@/components/wizard-stepper";

const STEP_LABELS = ["Contratada", "Contrato"];

const MODALIDADES = [
  { value: "CENTRALIZADA", label: "Centralizada" },
  { value: "DESCENTRALIZADA", label: "Descentralizada" },
  { value: "EMERGENCIAL", label: "Emergencial" },
];

interface FormState {
  companyName: string;
  companyCnpj: string;
  companyContactEmail: string;
  contractCode: string;
  contractStartDate: string;
  contractEndDate: string;
  contractModalidade: string;
  contractObjeto: string;
  contractEscopo: string;
  contractTechnicalProposal: string;
  contractCommercialValue: string;
  contractPaymentTerms: string;
  contractAdditionalNotes: string;
}

const EMPTY_FORM: FormState = {
  companyName: "",
  companyCnpj: "",
  companyContactEmail: "",
  contractCode: "",
  contractStartDate: "",
  contractEndDate: "",
  contractModalidade: "",
  contractObjeto: "",
  contractEscopo: "",
  contractTechnicalProposal: "",
  contractCommercialValue: "",
  contractPaymentTerms: "",
  contractAdditionalNotes: "",
};

function inputClass() {
  return "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent";
}

function labelClass() {
  return "mb-1 block text-xs font-medium uppercase tracking-wide text-muted";
}

interface StartMobilizationResponse {
  mobilization: { id: string };
}

export default function NewMobilizationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const stepValid = (() => {
    switch (step) {
      case 0:
        return (
          form.companyName.trim().length >= 2 &&
          form.companyCnpj.trim().length >= 14 &&
          form.companyContactEmail.trim().length > 3
        );
      case 1:
        return (
          form.contractCode.trim().length >= 2 &&
          form.contractStartDate.length > 0 &&
          form.contractEndDate.length > 0 &&
          form.contractModalidade.length > 0 &&
          form.contractObjeto.trim().length >= 3 &&
          form.contractEscopo.trim().length >= 3 &&
          form.contractTechnicalProposal.trim().length >= 3 &&
          form.contractCommercialValue.trim().length > 0 &&
          form.contractPaymentTerms.trim().length >= 3
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
      const res = await apiFetch<StartMobilizationResponse>("/mobilizations", {
        method: "POST",
        body: JSON.stringify({
          companyName: form.companyName,
          companyCnpj: form.companyCnpj,
          companyContactEmail: form.companyContactEmail,
          contractCode: form.contractCode,
          contractStartDate: form.contractStartDate,
          contractEndDate: form.contractEndDate,
          contractModalidade: form.contractModalidade,
          contractObjeto: form.contractObjeto,
          contractEscopo: form.contractEscopo,
          contractTechnicalProposal: form.contractTechnicalProposal,
          contractCommercialValue: Number(form.contractCommercialValue),
          contractPaymentTerms: form.contractPaymentTerms,
          contractAdditionalNotes: form.contractAdditionalNotes || undefined,
        }),
      });
      router.push(`/mobilizations/${res.mobilization.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível iniciar a mobilização.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova mobilização</h1>
        <p className="text-sm text-muted">
          Cadastra (ou identifica) a contratada e vincula um novo contrato. Se a contratada
          informada pelo CNPJ já estiver ativa neste tenant, o contrato é vinculado na hora; se
          for nova, é enviada uma solicitação de confirmação de cadastro antes de o contrato ser
          efetivado.
        </p>
      </div>

      <WizardStepper steps={STEP_LABELS} currentStep={step} />

      <Card>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dados da contratada</h2>
              <p className="text-sm text-muted">
                Informe o CNPJ da contratada — se ela já estiver cadastrada e ativa, os demais
                dados são ignorados e o cadastro existente é reaproveitado.
              </p>
            </div>
            <div>
              <label className={labelClass()}>Razão social</label>
              <input
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>CNPJ</label>
              <input
                placeholder="00.000.000/0001-00"
                value={form.companyCnpj}
                onChange={(e) => set("companyCnpj", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>E-mail de contato</label>
              <input
                type="email"
                value={form.companyContactEmail}
                onChange={(e) => set("companyContactEmail", e.target.value)}
                className={inputClass()}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Dados do contrato</h2>
              <p className="text-sm text-muted">
                Se a contratada for nova, estes dados ficam represados até ela confirmar o
                cadastro.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass()}>Código do contrato</label>
                <input
                  value={form.contractCode}
                  onChange={(e) => set("contractCode", e.target.value)}
                  placeholder="CT-2026-001"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>Modalidade</label>
                <select
                  value={form.contractModalidade}
                  onChange={(e) => set("contractModalidade", e.target.value)}
                  className={inputClass()}
                >
                  <option value="">Selecione...</option>
                  {MODALIDADES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass()}>Data de início</label>
                <input
                  type="date"
                  value={form.contractStartDate}
                  onChange={(e) => set("contractStartDate", e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>Data de término</label>
                <input
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => set("contractEndDate", e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            <div>
              <label className={labelClass()}>Objeto da contratação</label>
              <textarea
                rows={2}
                value={form.contractObjeto}
                onChange={(e) => set("contractObjeto", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Escopo</label>
              <textarea
                rows={2}
                value={form.contractEscopo}
                onChange={(e) => set("contractEscopo", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Proposta técnica</label>
              <textarea
                rows={2}
                value={form.contractTechnicalProposal}
                onChange={(e) => set("contractTechnicalProposal", e.target.value)}
                className={inputClass()}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass()}>Valor do contrato (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.contractCommercialValue}
                  onChange={(e) => set("contractCommercialValue", e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className={labelClass()}>Condições de pagamento</label>
                <input
                  value={form.contractPaymentTerms}
                  onChange={(e) => set("contractPaymentTerms", e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>
            <div>
              <label className={labelClass()}>Observações adicionais</label>
              <textarea
                rows={2}
                value={form.contractAdditionalNotes}
                onChange={(e) => set("contractAdditionalNotes", e.target.value)}
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
              {submitting ? "Enviando..." : "Iniciar mobilização"}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
