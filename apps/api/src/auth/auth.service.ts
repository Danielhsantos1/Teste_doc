import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AuthTokenPayload } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        tenantAccess: {
          include: {
            tenant: true,
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const access = user.tenantAccess[0];
    if (!access) {
      throw new UnauthorizedException("Usuário sem acesso a nenhum tenant");
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      tenantId: access.tenantId,
      tenantSlug: access.tenant.slug,
      roleKey: access.role.key,
      permissions: access.role.permissions.map((rp) => rp.permission.key),
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        tenant: { id: access.tenant.id, name: access.tenant.name, slug: access.tenant.slug },
        role: access.role.key,
        permissions: payload.permissions,
      },
    };
  }
}
