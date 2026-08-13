-- Documentos criados como pendência (ex.: onboarding de contratada) ainda
-- não têm arquivo — fileName passa a ser opcional.
ALTER TABLE "documents" ALTER COLUMN "fileName" DROP NOT NULL;
