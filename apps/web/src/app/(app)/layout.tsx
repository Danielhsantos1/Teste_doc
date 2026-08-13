"use client";

import { useRequireAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/app-shell";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Carregando...
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
