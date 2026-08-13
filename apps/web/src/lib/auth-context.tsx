"use client";

// Armazenamento do token em localStorage é uma simplificação deliberada para
// este kickoff local. SECURITY.md já define a evolução para cookie httpOnly +
// CSRF token como parte da Fase 0 antes de qualquer ambiente de produção.

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login as apiLogin, LoginResponse } from "./api";

type AuthUser = LoginResponse["user"];

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem("docdeck_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem("docdeck_user");
      }
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    window.localStorage.setItem("docdeck_token", res.accessToken);
    window.localStorage.setItem("docdeck_user", JSON.stringify(res.user));
    setUser(res.user);
  }

  function logout() {
    window.localStorage.removeItem("docdeck_token");
    window.localStorage.removeItem("docdeck_user");
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
