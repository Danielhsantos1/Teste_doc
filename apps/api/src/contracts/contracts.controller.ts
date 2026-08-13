import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { ContractsService } from "./contracts.service";
import { CreateContractDto } from "./create-contract.dto";

@Controller("contracts")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @RequirePermissions("contracts.read")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.contractsService.findAll(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("contracts.read")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.contractsService.findOne(user.tenantId, id);
  }

  @Post()
  @RequirePermissions("contracts.create")
  create(@CurrentUser() user: AuthTokenPayload, @Body() dto: CreateContractDto) {
    return this.contractsService.create(user.tenantId, dto);
  }
}
