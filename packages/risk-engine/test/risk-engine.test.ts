import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEntityRisk, levelFromScore } from "../src/index";

test("sem sinais de risco -> score 0, nível LOW, sem fatores", () => {
  const result = calculateEntityRisk({ documents: [] });
  assert.equal(result.score, 0);
  assert.equal(result.level, "LOW");
  assert.deepEqual(result.factors, []);
});

test("documentos críticos vencidos elevam o score e aparecem como fator explicável", () => {
  const result = calculateEntityRisk({
    documents: [
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
    ],
  });

  assert.equal(result.score, 30);
  assert.equal(result.level, "MEDIUM");
  assert.equal(result.factors.length, 1);
  assert.equal(result.factors[0].code, "EXPIRED_CRITICAL_DOCUMENT");
  assert.equal(result.factors[0].points, 30);
});

test("combinação de fatores soma corretamente e não ultrapassa 100", () => {
  const result = calculateEntityRisk({
    documents: [
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
      { isCriticalType: true, status: "EXPIRED" },
    ],
    blockedWorkersCount: 4,
    pendingRequirements: 2,
  });

  // 6*15 (critical) + 4*10 (blocked) + 2*12 (pending) = 90 + 40 + 24 = 154 -> capped em 100
  assert.equal(result.score, 100);
  assert.equal(result.level, "CRITICAL");
  assert.ok(result.factors.length >= 3);
});

test("documentos vencendo em 30 dias contam como fator de atenção, não crítico isoladamente", () => {
  const result = calculateEntityRisk({
    documents: [
      { isCriticalType: false, status: "APPROVED", expiringWithinDays: 10 },
      { isCriticalType: false, status: "APPROVED", expiringWithinDays: 45 },
    ],
  });

  // só o documento vencendo em <=30 dias conta
  assert.equal(result.score, 3);
  assert.equal(result.level, "LOW");
  assert.equal(result.factors[0].code, "DOCUMENT_EXPIRING_SOON");
});

test("levelFromScore respeita os limiares 30/60/80 definidos no briefing", () => {
  assert.equal(levelFromScore(0), "LOW");
  assert.equal(levelFromScore(29), "LOW");
  assert.equal(levelFromScore(30), "MEDIUM");
  assert.equal(levelFromScore(59), "MEDIUM");
  assert.equal(levelFromScore(60), "HIGH");
  assert.equal(levelFromScore(79), "HIGH");
  assert.equal(levelFromScore(80), "CRITICAL");
  assert.equal(levelFromScore(100), "CRITICAL");
});

test("trabalhadores bloqueados sem documentos vencidos ainda geram fator próprio", () => {
  const result = calculateEntityRisk({ documents: [], blockedWorkersCount: 1 });
  assert.equal(result.score, 10);
  assert.equal(result.factors[0].code, "BLOCKED_WORKERS");
});
