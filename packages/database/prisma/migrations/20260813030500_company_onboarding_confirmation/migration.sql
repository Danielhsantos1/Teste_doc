-- Fluxo de cadastro de contratada (ARCHITECTURE.md §8): a empresa nasce em
-- PENDING_CONFIRMATION e só vira ACTIVE após confirmação de e-mail.
ALTER TABLE "companies" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "companies" ADD COLUMN "confirmationToken" TEXT;
ALTER TABLE "companies" ADD COLUMN "confirmedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "companies_confirmationToken_key" ON "companies"("confirmationToken");
