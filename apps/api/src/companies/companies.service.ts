import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { calculateEntityRisk, DocumentSignal } from "@docdeck/risk-engine";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto } from "./create-company.dto";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// Lista fixa de documentos obrigatórios exigidos ao confirmar o cadastro de
// uma contratada (ARCHITECTURE.md §8, a partir da transcrição de áudio do
// briefing: "quando registro cadastro, já abre com a pendência daquelas
// documentações obrigatórias"). Isto é um stand-in deliberadamente simples
// até o Requirement Engine (Fase 3 do ROADMAP.md) existir — quando essa
// fase chegar, esta lista fixa é substituída por RequirementSet real.
const ONBOARDING_REQUIRED_DOCUMENT_TYPE_CODES = ["CONTRATO_SOCIAL", "CND"];

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

  /**
   * Passo 1 do fluxo de onboarding: registra a empresa em
   * PENDING_CONFIRMATION e gera um token de confirmação. Em produção esse
   * token vai por e-mail (Notification Engine, ainda não implementado); aqui
   * ele é devolvido diretamente na resposta, marcado como valor de
   * desenvolvimento — nunca simulamos um envio de e-mail real que não
   * acontece de fato.
   */
  async create(tenantId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findFirst({
      where: { tenantId, cnpj: dto.cnpj },
    });
    if (existing) {
      throw new ConflictException("Já existe uma empresa com este CNPJ neste tenant");
    }

    const confirmationToken = randomBytes(24).toString("hex");

    const company = await this.prisma.company.create({
      data: {
        tenantId,
        name: dto.name,
        cnpj: dto.cnpj,
        contactEmail: dto.contactEmail,
        status: "PENDING_CONFIRMATION",
        confirmationToken,
      },
    });

    return {
      company,
      devConfirmationToken: confirmationToken,
    };
  }

  /**
   * Passo 2: confirmação de e-mail. Só então a empresa vira ACTIVE e as
   * pendências documentais obrigatórias são criadas — nunca antes disso,
   * conforme o fluxo descrito no briefing.
   */
  async confirm(tenantId: string, companyId: string, token: string) {
    const company = await this.prisma.company.findFirst({ where: { id: companyId, tenantId } });
    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }
    if (company.status !== "PENDING_CONFIRMATION") {
      throw new BadRequestException("Este cadastro não está aguardando confirmação");
    }
    if (!company.confirmationToken || company.confirmationToken !== token) {
      throw new BadRequestException("Token de confirmação inválido");
    }

    const requiredTypes = await this.prisma.documentType.findMany({
      where: { code: { in: ONBOARDING_REQUIRED_DOCUMENT_TYPE_CODES } },
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.company.update({
        where: { id: companyId },
        data: { status: "ACTIVE", confirmedAt: new Date(), confirmationToken: null },
      }),
      ...requiredTypes.map((type) =>
        this.prisma.document.create({
          data: {
            tenantId,
            companyId,
            documentTypeId: type.id,
            status: "PENDING",
          },
        })
      ),
    ]);

    return this.findOne(tenantId, updated.id);
  }
}
