import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/permissions.guard";
import { RequirePermissions } from "../auth/permissions.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthTokenPayload } from "../auth/auth.types";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @RequirePermissions("dashboard.read")
  getSummary(@CurrentUser() user: AuthTokenPayload) {
    return this.dashboardService.getSummary(user.tenantId);
  }

  @Get("priority-actions")
  @RequirePermissions("dashboard.read")
  getPriorityActions(@CurrentUser() user: AuthTokenPayload) {
    return this.dashboardService.getPriorityActions(user.tenantId);
  }
}
