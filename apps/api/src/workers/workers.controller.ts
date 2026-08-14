import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { WorkersService } from "./workers.service";

@Controller("workers")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @RequirePermissions("workers.read")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.workersService.findAll(user.tenantId);
  }

  @Get(":id")
  @RequirePermissions("workers.read")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.workersService.findOne(user.tenantId, id);
  }
}
