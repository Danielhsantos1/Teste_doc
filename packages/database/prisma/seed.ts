// DEMO DATA — dados fictícios para demonstração local do DocDeck.
// Nunca misturar com dados reais de tenant. Ver ROADMAP.md §5.

import { PrismaClient, RiskLevel, WorkerStatus, DocumentStatus } from "../generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
  "dashboard.read",
  "companies.read",
  "companies.create",
  "companies.update",
  "workers.read",
  "workers.create",
  "documents.read",
  "documents.upload",
  "documents.approve",
  "risk.read",
  "contracts.read",
  "audits.read",
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding DEMO DATA...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Indústria Demo LTDA", slug: "demo" },
  });

  const permissions = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({ where: { key }, update: {}, create: { key } })
    )
  );

  const tenantAdminRole = await prisma.role.upsert({
    where: { key: "tenant_admin" },
    update: {},
    create: { key: "tenant_admin", name: "Admin do Tenant" },
  });

  await Promise.all(
    permissions.map((p) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: tenantAdminRole.id, permissionId: p.id } },
        update: {},
        create: { roleId: tenantAdminRole.id, permissionId: p.id },
      })
    )
  );

  const passwordHash = await bcrypt.hash("docdeck123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@docdeck.demo" },
    update: {},
    create: { name: "Ana Gestora (Demo)", email: "admin@docdeck.demo", passwordHash },
  });

  await prisma.userTenantAccess.upsert({
    where: { userId_tenantId: { userId: adminUser.id, tenantId: tenant.id } },
    update: {},
    create: { userId: adminUser.id, tenantId: tenant.id, roleId: tenantAdminRole.id },
  });

  const docTypeDefs = [
    { code: "ASO", name: "Atestado de Saúde Ocupacional" },
    { code: "NR35", name: "Treinamento NR-35 — Trabalho em Altura" },
    { code: "CONTRATO_SOCIAL", name: "Contrato Social" },
    { code: "CND", name: "Certidão Negativa de Débitos" },
  ];
  const docTypes = await Promise.all(
    docTypeDefs.map((d) =>
      prisma.documentType.upsert({ where: { code: d.code }, update: {}, create: d })
    )
  );
  const [aso, nr35, contratoSocial, cnd] = docTypes;

  const companyDefs = [
    { name: "Metalúrgica XPTO", cnpj: "11.111.111/0001-01", riskScore: 87, riskLevel: RiskLevel.CRITICAL },
    { name: "Construtora Alfa", cnpj: "22.222.222/0001-02", riskScore: 64, riskLevel: RiskLevel.HIGH },
    { name: "Elétrica Beta", cnpj: "33.333.333/0001-03", riskScore: 38, riskLevel: RiskLevel.MEDIUM },
    { name: "Manutenção Gama", cnpj: "44.444.444/0001-04", riskScore: 12, riskLevel: RiskLevel.LOW },
    { name: "Facilities Delta", cnpj: "55.555.555/0001-05", riskScore: 5, riskLevel: RiskLevel.LOW },
  ];
  const companies = [];
  for (const c of companyDefs) {
    companies.push(
      await prisma.company.upsert({
        where: { tenantId_cnpj: { tenantId: tenant.id, cnpj: c.cnpj } },
        update: {},
        create: { ...c, tenantId: tenant.id },
      })
    );
  }
  const [xpto, alfa, beta, gama, delta] = companies;

  const contractDefs = [
    { code: "CT-2026-481", companyId: xpto.id, riskScore: 82, riskLevel: RiskLevel.CRITICAL },
    { code: "CT-2026-220", companyId: alfa.id, riskScore: 55, riskLevel: RiskLevel.MEDIUM },
    { code: "CT-2026-101", companyId: gama.id, riskScore: 10, riskLevel: RiskLevel.LOW },
  ];
  for (const c of contractDefs) {
    await prisma.contract.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: c.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        companyId: c.companyId,
        code: c.code,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        startDate: daysFromNow(-200),
        endDate: daysFromNow(165),
      },
    });
  }

  const workerNames = [
    ["João da Silva", xpto.id, WorkerStatus.BLOQUEADO, 90],
    ["Maria Souza", xpto.id, WorkerStatus.BLOQUEADO, 85],
    ["Carlos Pereira", xpto.id, WorkerStatus.PENDENTE, 55],
    ["Fernanda Lima", alfa.id, WorkerStatus.APTO_COM_RESTRICAO, 45],
    ["Roberto Alves", alfa.id, WorkerStatus.PENDENTE, 50],
    ["Juliana Costa", beta.id, WorkerStatus.APTO, 20],
    ["Marcos Rocha", beta.id, WorkerStatus.APTO, 15],
    ["Patrícia Gomes", gama.id, WorkerStatus.APTO, 8],
    ["Eduardo Martins", gama.id, WorkerStatus.APTO, 5],
    ["Camila Ferreira", delta.id, WorkerStatus.APTO, 3],
  ] as const;

  const workers = [];
  let cpfSeq = 100;
  for (const [name, companyId, status, riskScore] of workerNames) {
    cpfSeq += 1;
    const riskLevel =
      riskScore >= 80 ? RiskLevel.CRITICAL : riskScore >= 60 ? RiskLevel.HIGH : riskScore >= 30 ? RiskLevel.MEDIUM : RiskLevel.LOW;
    workers.push(
      await prisma.worker.upsert({
        where: { tenantId_cpf: { tenantId: tenant.id, cpf: `000.000.${cpfSeq}-00` } },
        update: {},
        create: {
          tenantId: tenant.id,
          companyId,
          name,
          cpf: `000.000.${cpfSeq}-00`,
          role: "Técnico de Manutenção",
          status,
          riskScore,
          riskLevel,
        },
      })
    );
  }

  // Documentos: mistura de vencidos, vencendo em breve e válidos, ligados a
  // trabalhadores e empresas, para popular o Command Center com números reais.
  const documentPlan: Array<{
    workerId?: string;
    companyId?: string;
    documentTypeId: string;
    status: DocumentStatus;
    issuedOffsetDays: number;
    expiresOffsetDays: number | null;
    confidence: number | null;
  }> = [];

  workers.forEach((w, idx) => {
    documentPlan.push({
      workerId: w.id,
      documentTypeId: aso.id,
      status: idx < 2 ? DocumentStatus.EXPIRED : DocumentStatus.APPROVED,
      issuedOffsetDays: -300,
      expiresOffsetDays: idx < 2 ? -10 : idx < 4 ? 12 : 200,
      confidence: 0.94 + (idx % 5) * 0.01,
    });
    documentPlan.push({
      workerId: w.id,
      documentTypeId: nr35.id,
      status: idx === 0 ? DocumentStatus.EXPIRED : idx === 4 ? DocumentStatus.PENDING : DocumentStatus.APPROVED,
      issuedOffsetDays: -180,
      expiresOffsetDays: idx === 0 ? -5 : idx === 4 ? null : 25 + idx * 10,
      confidence: idx === 4 ? null : 0.9 + (idx % 3) * 0.02,
    });
  });

  companies.forEach((c, idx) => {
    documentPlan.push({
      companyId: c.id,
      documentTypeId: contratoSocial.id,
      status: DocumentStatus.APPROVED,
      issuedOffsetDays: -400,
      expiresOffsetDays: null,
      confidence: 0.99,
    });
    documentPlan.push({
      companyId: c.id,
      documentTypeId: cnd.id,
      status: idx === 0 ? DocumentStatus.EXPIRED : DocumentStatus.APPROVED,
      issuedOffsetDays: -60,
      expiresOffsetDays: idx === 0 ? -3 : 20 + idx * 15,
      confidence: 0.97,
    });
  });

  for (const d of documentPlan) {
    await prisma.document.create({
      data: {
        tenantId: tenant.id,
        companyId: d.companyId,
        workerId: d.workerId,
        documentTypeId: d.documentTypeId,
        fileName: `${d.documentTypeId === aso.id ? "aso" : d.documentTypeId === nr35.id ? "nr35" : d.documentTypeId === contratoSocial.id ? "contrato-social" : "cnd"}.pdf`,
        status: d.status,
        issuedAt: daysFromNow(d.issuedOffsetDays),
        expiresAt: d.expiresOffsetDays === null ? null : daysFromNow(d.expiresOffsetDays),
        aiConfidence: d.confidence ?? undefined,
      },
    });
  }

  console.log("Seed concluído.");
  console.log(`Tenant: ${tenant.slug}`);
  console.log("Login demo: admin@docdeck.demo / docdeck123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
