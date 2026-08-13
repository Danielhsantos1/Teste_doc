import Link from "next/link";
import { Logo } from "@/components/logo";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mb-5 flex justify-center">
          <Logo markSize={40} className="flex-col gap-2" />
        </div>

        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Mail size={20} />
        </div>

        <h1 className="text-lg font-bold text-gray-900">Recuperação de senha</h1>
        <p className="mt-2 text-sm text-muted">
          Este fluxo ainda não foi implementado (faz parte do Notification Engine, uma fase
          futura do produto). Por enquanto, fale com o administrador do seu tenant para
          redefinir sua senha.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
