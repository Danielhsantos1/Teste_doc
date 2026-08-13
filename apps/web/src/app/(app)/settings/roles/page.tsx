"use client";

import { useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { Card } from "@/components/ui/card";

interface Permission {
  id: string;
  key: string;
}

interface RoleRow {
  id: string;
  key: string;
  name: string;
  isSystem: boolean;
  usersCount?: number;
  permissions: string[];
}

interface FormState {
  name: string;
  permissionKeys: Set<string>;
}

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  for (const p of permissions) {
    const resource = p.key.split(".")[0];
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(p);
  }
  return groups;
}

export default function AccessProfilesPage() {
  const [roles, setRoles] = useState<RoleRow[] | null>(null);
  const [permissions, setPermissions] = useState<Permission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<"new" | RoleRow | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", permissionKeys: new Set() });
  const [saving, setSaving] = useState(false);

  function load() {
    Promise.all([apiFetch<RoleRow[]>("/roles"), apiFetch<Permission[]>("/permissions")])
      .then(([r, p]) => {
        setRoles(r);
        setPermissions(p);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, []);

  function startCreate() {
    setForm({ name: "", permissionKeys: new Set() });
    setEditing("new");
    setError(null);
  }

  function startEdit(role: RoleRow) {
    setForm({ name: role.name, permissionKeys: new Set(role.permissions) });
    setEditing(role);
    setError(null);
  }

  function togglePermission(key: string) {
    setForm((f) => {
      const next = new Set(f.permissionKeys);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return { ...f, permissionKeys: next };
    });
  }

  async function handleSave() {
    if (form.name.trim().length < 2 || form.permissionKeys.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { name: form.name, permissionKeys: Array.from(form.permissionKeys) };
      if (editing === "new") {
        await apiFetch("/roles", { method: "POST", body: JSON.stringify(payload) });
      } else if (editing) {
        await apiFetch(`/roles/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: RoleRow) {
    if (!confirm(`Remover o perfil "${role.name}"?`)) return;
    setError(null);
    try {
      await apiFetch(`/roles/${role.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o perfil.");
    }
  }

  if (error && !roles) return <div className="text-critical">Erro ao carregar: {error}</div>;
  if (!roles || !permissions) return <div className="text-muted">Carregando perfis de acesso...</div>;

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);
  const permissionGroups = groupPermissions(permissions);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Perfis de acesso</h1>
          <p className="text-sm text-muted">
            Papéis de sistema são fixos; crie perfis personalizados combinando as permissões
            granulares do tenant.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          + Novo perfil
        </button>
      </div>

      {error && <div className="text-sm text-critical">{error}</div>}

      {editing && (
        <Card>
          <div className="mb-4 text-sm font-medium text-gray-900">
            {editing === "new" ? "Novo perfil de acesso" : `Editando: ${editing.name}`}
          </div>

          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
            Nome do perfil
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex.: Gerente Regional Norte"
            className="mb-4 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
          />

          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Permissões
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border p-4 md:grid-cols-3">
            {Object.entries(permissionGroups).map(([resource, perms]) => (
              <div key={resource}>
                <div className="mb-1 text-xs font-semibold uppercase text-gray-700">{resource}</div>
                <div className="flex flex-col gap-1">
                  {perms.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        checked={form.permissionKeys.has(p.key)}
                        onChange={() => togglePermission(p.key)}
                        className="h-4 w-4 accent-accent"
                      />
                      {p.key}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || form.name.trim().length < 2 || form.permissionKeys.size === 0}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-black/5"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Perfis personalizados
        </h2>
        {customRoles.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Nenhum perfil personalizado criado ainda.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {customRoles.map((r) => (
              <Card key={r.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-muted">
                    {r.permissions.length} permissões · {r.usersCount ?? 0} usuário(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(r)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-gray-700 hover:bg-black/5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-critical hover:bg-critical/5"
                  >
                    Remover
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Perfis de sistema
        </h2>
        <div className="flex flex-col gap-3">
          {systemRoles.map((r) => (
            <Card key={r.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">{r.name}</div>
                <div className="text-xs text-muted">
                  {r.permissions.length} permissões · {r.usersCount ?? 0} usuário(s)
                </div>
              </div>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                Sistema
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
