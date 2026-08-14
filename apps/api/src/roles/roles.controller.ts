import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./create-role.dto";
import { UpdateRoleDto } from "./update-role.dto";

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("permissions")
  @RequirePermissions("roles.manage")
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get("roles")
  @RequirePermissions("roles.manage")
  findAll(@CurrentUser() user: AuthTokenPayload) {
    return this.rolesService.findAll(user.tenantId);
  }

  @Post("roles")
  @RequirePermissions("roles.manage")
  create(@CurrentUser() user: AuthTokenPayload, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user.tenantId, dto);
  }

  @Patch("roles/:id")
  @RequirePermissions("roles.manage")
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto
  ) {
    return this.rolesService.update(user.tenantId, id, dto);
  }

  @Delete("roles/:id")
  @RequirePermissions("roles.manage")
  remove(@CurrentUser() user: AuthTokenPayload, @Param("id") id: string) {
    return this.rolesService.remove(user.tenantId, id);
  }
}
