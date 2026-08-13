import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { CompaniesService } from "./companies.service";

@Controller("companies")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions("companies.read")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.companiesService.findAll(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("companies.read")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.companiesService.findOne(user.tenantId, id);
  }
}
