// DocDeck Risk Engine — pacote puro, sem I/O (sem Prisma, sem HTTP).
// Recebe sinais já extraídos pelo chamador e devolve um score explicável:
// nunca apenas o número, sempre os fatores que o compõem (ver briefing §20-21).
//
// Este é o motor rule-based inicial (Fase 4 do ROADMAP). Fatores hoje
// cobertos: documentos vencidos (crítico vs. não crítico), documentos
// vencendo em até 30 dias, trabalhadores bloqueados e requisitos
// contratuais pendentes. Fatores descritos no briefing e ainda NÃO
// implementados (histórico de reincidência, anomalia documental via AI
// Auditor) ficam para quando os módulos que os alimentam existirem.

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  code: string;
  label: string;
  points: number;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface DocumentSignal {
  isCriticalType: boolean;
  status: "EXPIRED" | "PENDING" | "APPROVED" | "UNDER_REVIEW" | "REJECTED";
  expiringWithinDays?: number | null;
}

export interface EntityRiskInput {
  documents: DocumentSignal[];
  blockedWorkersCount?: number;
  pendingRequirements?: number;
}

export const RISK_WEIGHTS = {
  EXPIRED_CRITICAL_DOCUMENT: 15,
  EXPIRED_DOCUMENT: 8,
  DOCUMENT_EXPIRING_SOON: 3,
  BLOCKED_WORKER: 10,
  PENDING_REQUIREMENT: 12,
} as const;

const MAX_SCORE = 100;

export function levelFromScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export function calculateEntityRisk(input: EntityRiskInput): RiskResult {
  const documents = input.documents ?? [];

  const expiredCritical = documents.filter((d) => d.status === "EXPIRED" && d.isCriticalType).length;
  const expiredOther = documents.filter((d) => d.status === "EXPIRED" && !d.isCriticalType).length;
  const expiringSoon = documents.filter(
    (d) => d.status !== "EXPIRED" && d.expiringWithinDays != null && d.expiringWithinDays <= 30
  ).length;
  const blockedWorkers = input.blockedWorkersCount ?? 0;
  const pendingRequirements = input.pendingRequirements ?? 0;

  const factors: RiskFactor[] = [];
  let score = 0;

  const addFactor = (code: string, label: string, count: number, weight: number) => {
    if (count <= 0) return;
    const points = count * weight;
    factors.push({ code, label, points });
    score += points;
  };

  addFactor(
    "EXPIRED_CRITICAL_DOCUMENT",
    `${expiredCritical} documento(s) crítico(s) vencido(s)`,
    expiredCritical,
    RISK_WEIGHTS.EXPIRED_CRITICAL_DOCUMENT
  );
  addFactor(
    "EXPIRED_DOCUMENT",
    `${expiredOther} documento(s) vencido(s)`,
    expiredOther,
    RISK_WEIGHTS.EXPIRED_DOCUMENT
  );
  addFactor(
    "BLOCKED_WORKERS",
    `${blockedWorkers} trabalhador(es) bloqueado(s)`,
    blockedWorkers,
    RISK_WEIGHTS.BLOCKED_WORKER
  );
  addFactor(
    "PENDING_REQUIREMENT",
    `${pendingRequirements} requisito(s) contratual(is) pendente(s)`,
    pendingRequirements,
    RISK_WEIGHTS.PENDING_REQUIREMENT
  );
  addFactor(
    "DOCUMENT_EXPIRING_SOON",
    `${expiringSoon} documento(s) vencendo em até 30 dias`,
    expiringSoon,
    RISK_WEIGHTS.DOCUMENT_EXPIRING_SOON
  );

  const cappedScore = Math.min(MAX_SCORE, score);

  return {
    score: cappedScore,
    level: levelFromScore(cappedScore),
    factors: factors.sort((a, b) => b.points - a.points),
  };
}
