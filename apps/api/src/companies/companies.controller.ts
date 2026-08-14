import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { CompaniesService } from "./companies.service";
import { CreateCompanyDto } from "./create-company.dto";
import { ConfirmCompanyDto } from "./confirm-company.dto";

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

  @Post()
  @RequirePermissions("companies.create")
  create(@CurrentUser() user: AuthTokenPayload, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user.tenantId, dto);
  }

  @Post(":id/confirm")
  @RequirePermissions("companies.create")
  confirm(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() dto: ConfirmCompanyDto
  ) {
    return this.companiesService.confirm(user.tenantId, id, dto.token);
  }
}
