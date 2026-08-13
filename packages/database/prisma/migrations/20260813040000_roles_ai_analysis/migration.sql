-- Perfis de acesso personalizados por tenant (Role passa a poder ser
-- tenant-scoped; tenantId nulo continua sendo papel de sistema).
ALTER TABLE "roles" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "roles" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "roles" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS "roles_key_key";
CREATE UNIQUE INDEX "roles_tenantId_key_key" ON "roles"("tenantId", "key");

ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conteúdo textual do documento (stand-in de OCR até a Fase 2 real).
ALTER TABLE "documents" ADD COLUMN "content" TEXT;

-- Document Intelligence: registro de cada execução de análise por IA.
CREATE TYPE "AIAnalysisStatus" AS ENUM ('COMPLETED', 'FAILED');

CREATE TABLE "ai_analyses" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "status" "AIAnalysisStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "documentTypeGuess" TEXT,
    "extractedFields" JSONB,
    "anomalies" JSONB,
    "summary" TEXT,
    "errorMessage" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_analyses_tenantId_idx" ON "ai_analyses"("tenantId");
CREATE INDEX "ai_analyses_documentId_idx" ON "ai_analyses"("documentId");

ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_analyses" ADD CONSTRAINT "ai_analyses_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
