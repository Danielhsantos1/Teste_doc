// "Lembrar-me" no login decide o backend de armazenamento: localStorage
// (sobrevive ao fechar o navegador) ou sessionStorage (some ao fechar a
// aba). Helpers centralizados para as duas chaves usadas em toda a app.

const KEYS = ["docdeck_token", "docdeck_user"] as const;

export function readSessionValue(key: (typeof KEYS)[number]): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function writeSession(token: string, userJson: string, rememberMe: boolean): void {
  const store = rememberMe ? window.localStorage : window.sessionStorage;
  const other = rememberMe ? window.sessionStorage : window.localStorage;
  store.setItem("docdeck_token", token);
  store.setItem("docdeck_user", userJson);
  other.removeItem("docdeck_token");
  other.removeItem("docdeck_user");
}

export function clearSession(): void {
  for (const key of KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
}
