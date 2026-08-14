import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { AuthTokenPayload } from "./auth.types";

/**
 * Nunca checa papel por string (`role === 'admin'`). Resolve permissões
 * granulares embutidas no token (recurso.ação) contra o que a rota exige.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthTokenPayload | undefined;

    const hasAll = required.every((perm) => user?.permissions?.includes(perm));
    if (!hasAll) {
      throw new ForbiddenException(
        `Permissão insuficiente. Requer: ${required.join(", ")}`
      );
    }

    return true;
  }
}
