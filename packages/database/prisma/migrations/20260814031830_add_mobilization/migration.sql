-- CreateEnum
CREATE TYPE "MobilizationStatus" AS ENUM ('AGUARDANDO_PRESTADOR', 'CONCLUIDA', 'CANCELADA');

-- AlterTable
ALTER TABLE "roles" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "mobilizations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "status" "MobilizationStatus" NOT NULL DEFAULT 'AGUARDANDO_PRESTADOR',
    "isNewCompany" BOOLEAN NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "pendingContractCode" TEXT,
    "pendingContractStartDate" TIMESTAMP(3),
    "pendingContractEndDate" TIMESTAMP(3),
    "pendingContractModalidade" TEXT,
    "pendingContractObjeto" TEXT,
    "pendingContractEscopo" TEXT,
    "pendingContractTechnicalProposal" TEXT,
    "pendingContractCommercialValue" DOUBLE PRECISION,
    "pendingContractPaymentTerms" TEXT,
    "pendingContractAdditionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobilizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mobilizations_tenantId_idx" ON "mobilizations"("tenantId");

-- AddForeignKey
ALTER TABLE "mobilizations" ADD CONSTRAINT "mobilizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobilizations" ADD CONSTRAINT "mobilizations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobilizations" ADD CONSTRAINT "mobilizations_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mobilizations" ADD CONSTRAINT "mobilizations_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
