import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WorkersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.worker.findMany({
      where: { tenantId },
      orderBy: { riskScore: "desc" },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        riskScore: true,
        riskLevel: true,
        company: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const worker = await this.prisma.worker.findFirst({
      where: { id, tenantId },
      include: {
        company: { select: { id: true, name: true } },
        documents: {
          select: {
            id: true,
            fileName: true,
            status: true,
            expiresAt: true,
            aiConfidence: true,
            documentType: { select: { name: true } },
          },
        },
      },
    });

    if (!worker) {
      throw new NotFoundException("Trabalhador não encontrado");
    }

    return worker;
  }
}
