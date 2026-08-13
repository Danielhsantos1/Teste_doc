"use client";

// Armazenamento do token em localStorage/sessionStorage (conforme "Lembrar-me"
// no login) é uma simplificação deliberada para este kickoff local.
// SECURITY.md já define a evolução para cookie httpOnly + CSRF token como
// parte da Fase 0 antes de qualquer ambiente de produção.

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, LoginResponse } from "./api";
import { clearSession, readSessionValue, writeSession } from "./session-storage";

type AuthUser = LoginResponse["user"];

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = readSessionValue("docdeck_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        clearSession();
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string, rememberMe: boolean) {
    const res = await apiLogin(email, password);
    writeSession(res.accessToken, JSON.stringify(res.user), rememberMe);
    setUser(res.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
