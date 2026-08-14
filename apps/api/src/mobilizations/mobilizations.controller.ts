import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { MobilizationsService } from "./mobilizations.service";
import { CreateMobilizationDto } from "./create-mobilization.dto";
import { ConfirmMobilizationDto } from "./confirm-mobilization.dto";

@Controller("mobilizations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MobilizationsController {
  constructor(private readonly mobilizationsService: MobilizationsService) {}

  @Get()
  @RequirePermissions("mobilizations.read")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.mobilizationsService.findAll(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("mobilizations.read")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.mobilizationsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions("mobilizations.create")
  start(@CurrentUser() user: AuthTokenPayload, @Body() dto: CreateMobilizationDto) {
    return this.mobilizationsService.start(user.tenantId, user.sub, dto);
  }

  @Post(":id/confirm-provider")
  @RequirePermissions("mobilizations.create")
  confirmProvider(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() dto: ConfirmMobilizationDto
  ) {
    return this.mobilizationsService.confirmProvider(user.tenantId, id, dto.token);
  }
}
