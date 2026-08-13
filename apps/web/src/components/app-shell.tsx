"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  Bell,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  FileSignature,
  DoorClosed,
  Truck,
  CheckCircle2,
  History,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "./logo";

const MODULES = [
  { key: "clm", label: "CLM", href: "/contracts", enabled: true },
  { key: "mob", label: "MOB", href: null, enabled: false },
  { key: "med", label: "MED", href: null, enabled: false },
  { key: "enc", label: "ENC", href: null, enabled: false },
];

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies", label: "Contratadas", icon: Building2 },
  { href: "/workers", label: "Colaboradores", icon: Users },
  { href: "/documents", label: "Documentos", icon: FileText },
  { href: "/contracts", label: "Contratos", icon: FileSignature },
  { href: "/settings/roles", label: "Perfis de Acesso", icon: ShieldCheck },
];

const SIDEBAR_UPCOMING = [
  { label: "Controle de Acesso", icon: DoorClosed },
  { label: "Mobilizações", icon: Truck },
  { label: "Validações", icon: CheckCircle2 },
  { label: "Auditoria", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  function handleLogout() {
    // Um flag em sessionStorage (em vez de query param) evita a corrida com
    // o próprio redirect de useRequireAuth: quando `logout()` zera o user,
    // o layout autenticado também tenta navegar para /login (sem query),
    // e o replace() dele pode vencer a nossa navegação e apagar o parâmetro.
    window.sessionStorage.setItem("docdeck_show_logout_toast", "1");
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard">
            <Logo markSize={30} />
          </Link>

          <nav className="flex items-center gap-1">
            {MODULES.map((m) => {
              const active = m.enabled && pathname?.startsWith(m.href!);
              const content = (
                <span
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    !m.enabled && "cursor-not-allowed text-gray-300",
                    m.enabled && active && "bg-accent text-white",
                    m.enabled && !active && "text-muted hover:bg-black/5 hover:text-gray-900"
                  )}
                >
                  {m.label}
                </span>
              );
              return m.enabled ? (
                <Link key={m.key} href={m.href!}>
                  {content}
                </Link>
              ) : (
                <span key={m.key} title="Em breve — módulo ainda não implementado">
                  {content}
                </span>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setBellOpen((v) => !v);
                setMenuOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-black/5 hover:text-gray-900"
              aria-label="Notificações"
            >
              <Bell size={18} />
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-lg">
                  <div className="mb-1 text-sm font-medium text-gray-900">Notificações</div>
                  <p className="text-sm text-muted">
                    Nenhuma notificação por enquanto — o motor de notificações (e-mail, push, in-app)
                    ainda não foi implementado. Consulte o Dashboard para as ações prioritárias de hoje.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => {
                setMenuOpen((v) => !v);
                setBellOpen(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white"
              aria-label="Menu do usuário"
            >
              {initial}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-lg">
                  <div className="px-2 py-1.5">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-muted">{user?.tenant.name}</div>
                  </div>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-black/5 hover:text-gray-900"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-16 flex h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-4">
          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active ? "bg-accent/10 text-accent" : "text-gray-700 hover:bg-black/5"
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="my-3 border-t border-border" />

          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_UPCOMING.map((item) => {
              const Icon = item.icon;
              return (
                <span
                  key={item.label}
                  title="Em breve — funcionalidade ainda não implementada"
                  className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-300"
                >
                  <Icon size={16} />
                  {item.label}
                </span>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
