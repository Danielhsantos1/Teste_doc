import { readSessionValue } from "./session-storage";

// Sem NEXT_PUBLIC_API_URL definida, assume mesma origem (front e API no
// mesmo site Netlify, API servida via redirect de /api/* para uma Netlify
// Function). Em dev local, .env define essa variável apontando pra
// http://localhost:4000 (apps/api rodando como servidor separado).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function getToken(): string | null {
  return readSessionValue("docdeck_token");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(body.message ?? "Erro na requisição", res.status);
  }

  return res.json() as Promise<T>;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    tenant: { id: string; name: string; slug: string };
    role: string;
    permissions: string[];
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new ApiError("Credenciais inválidas", res.status);
  }

  return res.json();
}
