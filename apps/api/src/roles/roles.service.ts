import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRoleDto } from "./create-role.dto";
import { UpdateRoleDto } from "./update-role.dto";

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(DIACRITICS_REGEX, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "perfil"
  );
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: { key: "asc" } });
  }

  async findAll(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { OR: [{ tenantId: null }, { tenantId }] },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { access: true } },
      },
      orderBy: [{ tenantId: "asc" }, { name: "asc" }],
    });

    return roles.map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
      isSystem: r.tenantId === null,
      usersCount: r._count.access,
      permissions: r.permissions.map((rp) => rp.permission.key),
      createdAt: r.createdAt,
    }));
  }

  private async findOwnCustomRole(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!role) {
      const systemRole = await this.prisma.role.findFirst({ where: { id, tenantId: null } });
      if (systemRole) {
        throw new ForbiddenException("Papéis de sistema não podem ser editados ou removidos");
      }
      throw new NotFoundException("Perfil de acesso não encontrado");
    }
    return role;
  }

  private async validatePermissionKeys(keys: string[]) {
    const found = await this.prisma.permission.findMany({ where: { key: { in: keys } } });
    const foundKeys = new Set(found.map((p) => p.key));
    const invalid = keys.filter((k) => !foundKeys.has(k));
    if (invalid.length > 0) {
      throw new BadRequestException(`Permissões inexistentes: ${invalid.join(", ")}`);
    }
    return found;
  }

  async create(tenantId: string, dto: CreateRoleDto) {
    const permissions = await this.validatePermissionKeys(dto.permissionKeys);

    let key = slugify(dto.name);
    let attempt = 1;
    while (await this.prisma.role.findFirst({ where: { tenantId, key } })) {
      attempt += 1;
      key = `${slugify(dto.name)}_${attempt}`;
    }

    const role = await this.prisma.role.create({
      data: {
        tenantId,
        key,
        name: dto.name,
        permissions: {
          create: permissions.map((p) => ({ permissionId: p.id })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      isSystem: false,
      permissions: role.permissions.map((rp) => rp.permission.key),
    };
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto) {
    const role = await this.findOwnCustomRole(tenantId, id);

    if (dto.permissionKeys) {
      const permissions = await this.validatePermissionKeys(dto.permissionKeys);
      await this.prisma.$transaction([
        this.prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
        this.prisma.rolePermission.createMany({
          data: permissions.map((p) => ({ roleId: role.id, permissionId: p.id })),
        }),
      ]);
    }

    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data: dto.name ? { name: dto.name } : {},
      include: { permissions: { include: { permission: true } } },
    });

    return {
      id: updated.id,
      key: updated.key,
      name: updated.name,
      isSystem: false,
      permissions: updated.permissions.map((rp) => rp.permission.key),
    };
  }

  async remove(tenantId: string, id: string) {
    const role = await this.findOwnCustomRole(tenantId, id);

    const usersCount = await this.prisma.userTenantAccess.count({ where: { roleId: role.id } });
    if (usersCount > 0) {
      throw new ConflictException(
        `Este perfil está em uso por ${usersCount} usuário(s) e não pode ser removido`
      );
    }

    await this.prisma.role.delete({ where: { id: role.id } });
    return { id: role.id, removed: true };
  }
}
