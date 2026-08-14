import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(tenantId: string) {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [
      companiesTotal,
      workersTotal,
      documentsTotal,
      documentsExpired,
      documentsExpiringSoon,
      criticalCompanies,
      criticalWorkers,
      criticalContracts,
      warningCompanies,
      warningWorkers,
      warningContracts,
    ] = await this.prisma.$transaction([
      this.prisma.company.count({ where: { tenantId } }),
      this.prisma.worker.count({ where: { tenantId } }),
      this.prisma.document.count({ where: { tenantId } }),
      this.prisma.document.count({
        where: { tenantId, expiresAt: { lt: now } },
      }),
      this.prisma.document.count({
        where: { tenantId, expiresAt: { gte: now, lte: in30Days } },
      }),
      this.prisma.company.count({ where: { tenantId, riskLevel: "CRITICAL" } }),
      this.prisma.worker.count({ where: { tenantId, riskLevel: "CRITICAL" } }),
      this.prisma.contract.count({ where: { tenantId, riskLevel: "CRITICAL" } }),
      this.prisma.company.count({ where: { tenantId, riskLevel: { in: ["MEDIUM", "HIGH"] } } }),
      this.prisma.worker.count({ where: { tenantId, riskLevel: { in: ["MEDIUM", "HIGH"] } } }),
      this.prisma.contract.count({ where: { tenantId, riskLevel: { in: ["MEDIUM", "HIGH"] } } }),
    ]);

    const conformidade =
      documentsTotal === 0 ? 100 : Math.round(((documentsTotal - documentsExpired) / documentsTotal) * 1000) / 10;

    return {
      conformidadeGeral: conformidade,
      riscosCriticos: criticalCompanies + criticalWorkers + criticalContracts,
      riscosEmAtencao: warningCompanies + warningWorkers + warningContracts,
      trabalhadores: workersTotal,
      empresas: companiesTotal,
      documentos: documentsTotal,
      documentosVencendo: documentsExpiringSoon,
      documentosVencidos: documentsExpired,
    };
  }

  async getPriorityActions(tenantId: string) {
    const [criticalCompanies, blockedWorkers, expiringDocs] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where: { tenantId, riskLevel: "CRITICAL" },
        select: { id: true, name: true, riskScore: true },
        orderBy: { riskScore: "desc" },
        take: 5,
      }),
      this.prisma.worker.findMany({
        where: { tenantId, status: "BLOQUEADO" },
        select: { id: true, name: true, company: { select: { name: true } } },
        take: 5,
      }),
      this.prisma.document.findMany({
        where: {
          tenantId,
          expiresAt: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, fileName: true, expiresAt: true, documentType: { select: { name: true } } },
        take: 5,
      }),
    ]);

    return { criticalCompanies, blockedWorkers, expiringDocs };
  }
}
