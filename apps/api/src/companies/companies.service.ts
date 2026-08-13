import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
        workers: { select: { id: true, name: true, status: true, riskLevel: true } },
        contracts: { select: { id: true, code: true, status: true, riskLevel: true, riskScore: true } },
        documents: {
          select: {
            id: true,
            fileName: true,
            status: true,
            expiresAt: true,
            documentType: { select: { name: true } },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException("Empresa não encontrada");
    }

    return company;
  }
}
