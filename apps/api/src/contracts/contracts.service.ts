import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateContractDto } from "./create-contract.dto";

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.contract.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        modalidade: true,
        startDate: true,
        endDate: true,
        riskScore: true,
        riskLevel: true,
        company: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: { company: { select: { id: true, name: true, cnpj: true } } },
    });
    if (!contract) {
      throw new NotFoundException("Contrato não encontrado");
    }
    return contract;
  }

  async create(tenantId: string, dto: CreateContractDto) {
    const company = await this.prisma.company.findFirst({ where: { id: dto.companyId, tenantId } });
    if (!company) {
      throw new BadRequestException("Empresa informada não pertence a este tenant");
    }

    const existingCode = await this.prisma.contract.findFirst({
      where: { tenantId, code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException("Já existe um contrato com este código neste tenant");
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException("Datas de vigência inválidas");
    }
    if (endDate <= startDate) {
      throw new BadRequestException("A data de término deve ser posterior à data de início");
    }

    return this.prisma.contract.create({
      data: {
        tenantId,
        companyId: dto.companyId,
        code: dto.code,
        startDate,
        endDate,
        modalidade: dto.modalidade,
        objeto: dto.objeto,
        escopo: dto.escopo,
        technicalProposal: dto.technicalProposal,
        commercialValue: dto.commercialValue,
        paymentTerms: dto.paymentTerms,
        additionalNotes: dto.additionalNotes,
      },
      include: { company: { select: { id: true, name: true } } },
    });
  }
}
