"use client";

import Link from "next/link";
import {
  FileSignature,
  ShieldCheck,
  Landmark,
  FileCheck2,
  Database,
  Sparkles,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#beneficios", label: "Benefícios" },
  { href: "#contato", label: "Contato" },
];

const STATS = [
  { value: "99.9%", label: "Precisão da IA" },
  { value: "-70%", label: "Tempo de análise" },
  { value: "100%", label: "Auditável" },
];

const FEATURES = [
  {
    icon: FileSignature,
    title: "CLM — Gestão do Ciclo de Vida de Contratos",
    description:
      "Controle completo desde a criação até o encerramento, com alertas automáticos e rastreamento de prazos.",
  },
  {
    icon: ShieldCheck,
    title: "Análise de Documentos de SST",
    description:
      "Validação inteligente de documentação de Segurança e Saúde no Trabalho, garantindo conformidade com normas regulamentadoras.",
  },
  {
    icon: Landmark,
    title: "Compliance Fiscal e Trabalhista",
    description:
      "Verificação automatizada de regularidade fiscal e trabalhista, identificando pendências antes que se tornem problemas.",
  },
  {
    icon: FileCheck2,
    title: "Geração Automática de Minutas",
    description:
      "Criação inteligente de documentos para regularização de pendências, economizando tempo e reduzindo erros.",
  },
  {
    icon: Database,
    title: "Repositório Auditável",
    description:
      "Armazenamento seguro com histórico completo de alterações, garantindo rastreabilidade e conformidade com auditorias.",
  },
];

const WHY_CHOOSE = [
  {
    title: "Confiabilidade",
    description: "Toda decisão automatizada mostra os fatores por trás dela — nunca uma caixa-preta.",
  },
  {
    title: "Agilidade",
    description: "Do documento à decisão em minutos, não em dias — SLA pensado para reduzir o tempo de análise.",
  },
  {
    title: "Simplicidade",
    description: "Uma central de comando que mostra o que precisa da sua atenção agora, sem poluição visual.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Logo markSize={30} />
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-700 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </a>
            ))}
          </nav>
          <Link
            href="/login"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              Gestão inteligente de contratadas{" "}
              <span className="text-accent">assistida por IA</span>
            </h1>
            <p className="mt-5 text-lg text-muted">
              Simplifique o gerenciamento de contratos e documentos de contratadas com
              tecnologia de ponta e conformidade garantida.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Começar agora
                <ArrowRight size={16} />
              </Link>
              <a
                href="#contato"
                className="rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-black/5"
              >
                Agendar demonstração
              </a>
            </div>

            <div className="mt-10 flex gap-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-accent">
              <Sparkles size={18} />
              <span className="text-sm font-semibold">Document Intelligence</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "ASO — João da Silva", status: "Aprovado", confidence: "98,7%" },
                { label: "Contrato Social — Metalúrgica XPTO", status: "Aprovado", confidence: "99,0%" },
                { label: "NR-35 — Maria Souza", status: "Em revisão", confidence: "84,2%" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-800">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">{row.confidence}</span>
                    <span className="rounded-full bg-low/10 px-2.5 py-0.5 text-xs font-medium text-low">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900">Funcionalidades que transformam</h2>
            <p className="mt-3 text-muted">
              Uma plataforma completa para gerenciar toda a documentação de suas contratadas
              com eficiência e segurança
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-border bg-surface p-6">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white">
                    <Icon size={20} />
                  </span>
                  <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-gray-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold">Por que escolher DocDeck?</h2>
          <p className="mt-3 text-gray-400">Tecnologia de IA aliada à expertise em gestão documental</p>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {WHY_CHOOSE.map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contato" className="border-t border-border bg-card py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-center">
          <Logo markSize={30} />
          <p className="max-w-md text-sm text-muted">
            Quer conhecer o DocDeck de perto? Fale com a gente.
          </p>
          <a
            href="mailto:contato@docdeck.com"
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Mail size={16} />
            contato@docdeck.com
          </a>
          <p className="mt-6 text-xs text-muted">Confiabilidade · Agilidade · Simplicidade</p>
        </div>
      </footer>
    </div>
  );
}
