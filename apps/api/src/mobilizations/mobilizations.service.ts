import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CompaniesService } from "../companies/companies.service";
import { ContractsService } from "../contracts/contracts.service";
import { CreateMobilizationDto } from "./create-mobilization.dto";

const MOBILIZATION_INCLUDE = {
  company: true,
  contract: { select: { id: true, code: true, status: true } },
} as const;

@Injectable()
export class MobilizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService,
    private readonly contractsService: ContractsService
  ) {}

  findAll(tenantId: string) {
    return this.prisma.mobilization.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { id: true, name: true, cnpj: true, status: true } },
        contract: { select: { id: true, code: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const mobilization = await this.prisma.mobilization.findFirst({
      where: { id, tenantId },
      include: MOBILIZATION_INCLUDE,
    });
    if (!mobilization) {
      throw new NotFoundException("Mobilização não encontrada");
    }
    return mobilization;
  }

  /**
   * "Novo contrato" (Tomador) + gateway "Contratada cadastrada?": se a
   * contratada já existe e está ACTIVE, o contrato é efetivado na hora
   * (etapa "DocDeck" automática). Se não existe, cria a contratada em
   * PENDING_CONFIRMATION e represa os dados do contrato até a confirmação.
   */
  async start(tenantId: string, userId: string, dto: CreateMobilizationDto) {
    const existingCompany = await this.prisma.company.findFirst({
      where: { tenantId, cnpj: dto.companyCnpj },
    });

    if (existingCompany) {
      if (existingCompany.status !== "ACTIVE") {
        throw new ConflictException(
          "Já existe um cadastro para esta contratada aguardando confirmação"
        );
      }

      const contract = await this.contractsService.create(tenantId, {
        companyId: existingCompany.id,
        code: dto.contractCode,
        startDate: dto.contractStartDate,
        endDate: dto.contractEndDate,
        modalidade: dto.contractModalidade,
        objeto: dto.contractObjeto,
        escopo: dto.contractEscopo,
        technicalProposal: dto.contractTechnicalProposal,
        commercialValue: dto.contractCommercialValue,
        paymentTerms: dto.contractPaymentTerms,
        additionalNotes: dto.contractAdditionalNotes,
      });

      const mobilization = await this.prisma.mobilization.create({
        data: {
          tenantId,
          companyId: existingCompany.id,
          contractId: contract.id,
          status: "CONCLUIDA",
          isNewCompany: false,
          requestedByUserId: userId,
        },
        include: MOBILIZATION_INCLUDE,
      });

      return { mobilization };
    }

    const startDate = new Date(dto.contractStartDate);
    const endDate = new Date(dto.contractEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Datas de vigência inválidas");
    }
    if (endDate <= startDate) {
      throw new BadRequestException("A data de término deve ser posterior à data de início");
    }

    const { company, devConfirmationToken } = await this.companiesService.create(tenantId, {
      name: dto.companyName,
      cnpj: dto.companyCnpj,
      contactEmail: dto.companyContactEmail,
    });

    const mobilization = await this.prisma.mobilization.create({
      data: {
        tenantId,
        companyId: company.id,
        isNewCompany: true,
        status: "AGUARDANDO_PRESTADOR",
        requestedByUserId: userId,
        pendingContractCode: dto.contractCode,
        pendingContractStartDate: startDate,
        pendingContractEndDate: endDate,
        pendingContractModalidade: dto.contractModalidade,
        pendingContractObjeto: dto.contractObjeto,
        pendingContractEscopo: dto.contractEscopo,
        pendingContractTechnicalProposal: dto.contractTechnicalProposal,
        pendingContractCommercialValue: dto.contractCommercialValue,
        pendingContractPaymentTerms: dto.contractPaymentTerms,
        pendingContractAdditionalNotes: dto.contractAdditionalNotes,
      },
      include: MOBILIZATION_INCLUDE,
    });

    return { mobilization, devConfirmationToken };
  }

  /**
   * "Confirmar dados cadastrais" (Prestador) → "Registrar cadastro da
   * empresa" + "Cadastrar contrato" (DocDeck, automático nesta fase): a
   * contratada confirma o cadastro (mesmo mecanismo de
   * CompaniesService.confirm) e o contrato represado é efetivado.
   */
  async confirmProvider(tenantId: string, mobilizationId: string, token: string) {
    const mobilization = await this.prisma.mobilization.findFirst({
      where: { id: mobilizationId, tenantId },
    });
    if (!mobilization) {
      throw new NotFoundException("Mobilização não encontrada");
    }
    if (mobilization.status !== "AGUARDANDO_PRESTADOR") {
      throw new BadRequestException("Esta mobilização não está aguardando confirmação da contratada");
    }
    if (
      !mobilization.pendingContractCode ||
      !mobilization.pendingContractStartDate ||
      !mobilization.pendingContractEndDate ||
      !mobilization.pendingContractModalidade ||
      !mobilization.pendingContractObjeto ||
      !mobilization.pendingContractEscopo ||
      !mobilization.pendingContractTechnicalProposal ||
      mobilization.pendingContractCommercialValue === null ||
      !mobilization.pendingContractPaymentTerms
    ) {
      throw new BadRequestException("Dados do contrato represado incompletos");
    }

    await this.companiesService.confirm(tenantId, mobilization.companyId, token);

    const contract = await this.contractsService.create(tenantId, {
      companyId: mobilization.companyId,
      code: mobilization.pendingContractCode,
      startDate: mobilization.pendingContractStartDate.toISOString(),
      endDate: mobilization.pendingContractEndDate.toISOString(),
      modalidade: mobilization.pendingContractModalidade as "CENTRALIZADA" | "DESCENTRALIZADA" | "EMERGENCIAL",
      objeto: mobilization.pendingContractObjeto,
      escopo: mobilization.pendingContractEscopo,
      technicalProposal: mobilization.pendingContractTechnicalProposal,
      commercialValue: mobilization.pendingContractCommercialValue,
      paymentTerms: mobilization.pendingContractPaymentTerms,
      additionalNotes: mobilization.pendingContractAdditionalNotes ?? undefined,
    });

    return this.prisma.mobilization.update({
      where: { id: mobilization.id },
      data: { status: "CONCLUIDA", contractId: contract.id },
      include: MOBILIZATION_INCLUDE,
    });
  }
}
