import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { DocumentsService } from "./documents.service";
import { UpdateDocumentContentDto } from "./update-document-content.dto";

@Controller("documents")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @RequirePermissions("documents.read")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.documentsService.findAll(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("documents.read")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.documentsService.findOne(user.tenantId, id);
  }

  @Patch(":id/content")
  @RequirePermissions("documents.upload")
  updateContent(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() dto: UpdateDocumentContentDto
  ) {
    return this.documentsService.updateContent(user.tenantId, id, dto);
  }

  @Post(":id/analyze")
  @RequirePermissions("ai.analyze")
  analyze(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.documentsService.analyze(user.tenantId, id);
  }
}
