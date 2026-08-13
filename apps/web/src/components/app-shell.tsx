"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Bell, Boxes, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const NAV = [
  { href: "/dashboard", label: "Painel" },
  { href: "/companies", label: "Empresas" },
  { href: "/workers", label: "Trabalhadores" },
  { href: "/documents", label: "Documentos" },
  { href: "/contracts", label: "CLM" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              <Boxes size={18} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-gray-900">DocDeck</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-accent text-white" : "text-muted hover:bg-black/5 hover:text-gray-900"
                  )}
                >
                  {item.label}
                </Link>
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
                    ainda não foi implementado. Consulte o Painel para as ações prioritárias de hoje.
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
                    onClick={logout}
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

      <main className="mx-auto max-w-7xl px-8 py-6">{children}</main>
    </div>
  );
}
