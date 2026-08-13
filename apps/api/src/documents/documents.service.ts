import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.document.findMany({
      where: { tenantId },
      orderBy: { expiresAt: "asc" },
      select: {
        id: true,
        fileName: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        aiConfidence: true,
        documentType: { select: { name: true } },
        company: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true } },
      },
    });
  }
}
