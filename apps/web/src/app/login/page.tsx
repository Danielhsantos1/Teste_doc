"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Logo } from "@/components/logo";
import { CheckCircle2 } from "lucide-react";

function LogoutToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("docdeck_show_logout_toast") === "1") {
      window.sessionStorage.removeItem("docdeck_show_logout_toast");
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-gray-900 shadow-lg">
      <CheckCircle2 size={18} className="text-low" />
      Logout realizado com sucesso
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@docdeck.demo");
  const [password, setPassword] = useState("docdeck123");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password, rememberMe);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo markSize={40} className="mb-5 flex-col gap-2" />
          <h1 className="text-xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-muted">Entre com suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Lembrar-me
            </label>
            <Link href="/esqueci-senha" className="text-accent hover:underline">
              Esqueceu a senha?
            </Link>
          </div>

          {error && <div className="text-sm text-critical">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          Ambiente de demonstração — credenciais pré-preenchidas
          (<code className="text-gray-500">admin@docdeck.demo</code> /{" "}
          <code className="text-gray-500">docdeck123</code>), dados marcados como DEMO DATA.
        </div>
      </div>

      <LogoutToast />
    </div>
  );
}
