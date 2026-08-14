import { BadRequestException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import {
  createAIProvider,
  AI_PROMPT_VERSION,
  AIProviderNotConfiguredError,
  AIProviderRequestError,
  AIResponseParseError,
} from "@docdeck/ai";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateDocumentContentDto } from "./update-document-content.dto";

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

  async findOne(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, tenantId },
      include: {
        documentType: { select: { name: true, isCritical: true } },
        company: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true } },
        analyses: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!document) {
      throw new NotFoundException("Documento não encontrado");
    }
    return document;
  }

  async updateContent(tenantId: string, id: string, dto: UpdateDocumentContentDto) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) {
      throw new NotFoundException("Documento não encontrado");
    }
    return this.prisma.document.update({ where: { id }, data: { content: dto.content } });
  }

  async analyze(tenantId: string, id: string) {
    const document = await this.prisma.document.findFirst({ where: { id, tenantId } });
    if (!document) {
      throw new NotFoundException("Documento não encontrado");
    }
    if (!document.content || document.content.trim().length === 0) {
      throw new BadRequestException(
        "Documento sem conteúdo para analisar. Adicione o texto do documento antes de analisar."
      );
    }

    let provider: ReturnType<typeof createAIProvider>;
    try {
      provider = createAIProvider();
    } catch (err) {
      if (err instanceof AIProviderNotConfiguredError) {
        throw new ServiceUnavailableException(err.message);
      }
      throw err;
    }

    try {
      const result = await provider.analyzeDocument(document.content);

      const analysis = await this.prisma.aIAnalysis.create({
        data: {
          tenantId,
          documentId: id,
          provider: provider.provider,
          model: provider.model,
          promptVersion: AI_PROMPT_VERSION,
          status: "COMPLETED",
          confidence: result.confidence,
          documentTypeGuess: result.documentTypeGuess,
          extractedFields: result.extractedFields,
          anomalies: result.anomalies,
          summary: result.summary,
        },
      });

      // Human-in-the-loop (SECURITY.md §8): confiança alta com documento
      // ainda pendente vira aprovação automática; abaixo do threshold,
      // vai para revisão humana. Documentos já vencidos/rejeitados não são
      // sobrescritos por uma análise de IA.
      if (document.status === "PENDING") {
        const newStatus = result.confidence >= 0.9 ? "APPROVED" : "UNDER_REVIEW";
        await this.prisma.document.update({
          where: { id },
          data: { aiConfidence: result.confidence, status: newStatus },
        });
      } else {
        await this.prisma.document.update({ where: { id }, data: { aiConfidence: result.confidence } });
      }

      return analysis;
    } catch (err) {
      const errorMessage =
        err instanceof AIProviderRequestError || err instanceof AIResponseParseError
          ? err.message
          : "Falha inesperada ao chamar o provedor de IA";

      return this.prisma.aIAnalysis.create({
        data: {
          tenantId,
          documentId: id,
          provider: provider.provider,
          model: provider.model,
          promptVersion: AI_PROMPT_VERSION,
          status: "FAILED",
          errorMessage,
        },
      });
    }
  }
}
