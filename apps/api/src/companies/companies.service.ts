import { Injectable, NotFoundException } from "@nestjs/common";
import { calculateEntityRisk, DocumentSignal } from "@docdeck/risk-engine";
import { PrismaService } from "../prisma/prisma.service";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.company.findMany({
      where: { tenantId },
      orderBy: { riskScore: "desc" },
      select: {
        id: true,
        name: true,
        cnpj: true,
        status: true,
        riskScore: true,
        riskLevel: true,
        _count: { select: { workers: true, contracts: true, documents: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, tenantId },
      include: {
        workers: {
          select: {
            id: true,
            name: true,
            status: true,
            riskLevel: true,
            documents: {
              select: {
                status: true,
                expiresAt: true,
                documentType: { select: { isCritical: true } },
              },
            },
          },
        },
        contracts: { select: { id: true, code: true, status: true, riskLevel: true, riskScore: true } },
        documents: {
          select: {
            id: true,
            fileName: true,
            status: true,
            expiresAt: true,
            documentType: { select: { name: true, isCritical: true } },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    // Risco calculado ao vivo pelo Risk Engine (packages/risk-engine), a
    // partir dos documentos da empresa + de todos os seus trabalhadores.
    // `pendingRequirements` fica em 0 até o Requirement Engine (Fase 3)
    // existir — nunca inventamos um número para preencher o fator.
    const companyDocSignals: DocumentSignal[] = company.documents.map((d) => ({
      isCriticalType: d.documentType.isCritical,
      status: d.status,
      expiringWithinDays: daysUntil(d.expiresAt),
    }));
    const workerDocSignals: DocumentSignal[] = company.workers.flatMap((w) =>
      w.documents.map((d) => ({
        isCriticalType: d.documentType.isCritical,
        status: d.status,
        expiringWithinDays: daysUntil(d.expiresAt),
      }))
    );
    const blockedWorkersCount = company.workers.filter((w) => w.status === "BLOQUEADO").length;

    const computedRisk = calculateEntityRisk({
      documents: [...companyDocSignals, ...workerDocSignals],
      blockedWorkersCount,
      pendingRequirements: 0,
    });

    const { workers, ...rest } = company;

    return {
      ...rest,
      workers: workers.map(({ documents: _documents, ...w }) => w),
      computedRisk,
    };
  }
}
