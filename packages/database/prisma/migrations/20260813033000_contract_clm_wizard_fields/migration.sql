-- Campos do wizard "Cadastrar Novo Contrato" (módulo CLM).
ALTER TABLE "contracts" ADD COLUMN "modalidade" TEXT;
ALTER TABLE "contracts" ADD COLUMN "objeto" TEXT;
ALTER TABLE "contracts" ADD COLUMN "escopo" TEXT;
ALTER TABLE "contracts" ADD COLUMN "technicalProposal" TEXT;
ALTER TABLE "contracts" ADD COLUMN "commercialValue" DOUBLE PRECISION;
ALTER TABLE "contracts" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "contracts" ADD COLUMN "additionalNotes" TEXT;
