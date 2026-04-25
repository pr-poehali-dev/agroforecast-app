export const AUTH_URL      = "https://functions.poehali.dev/3a6fb358-74b8-46ff-8b89-6eb8c01db47d";
export const CRM_URL       = "https://functions.poehali.dev/b82b5560-b8a7-4691-a429-f458f67c2b78";
export const LOGISTICS_URL = "https://functions.poehali.dev/1aefb5aa-0f0b-4575-b1c2-3547538663cc";

export function getToken(): string | null {
  return localStorage.getItem("agroport_token");
}
export function setToken(token: string) {
  localStorage.setItem("agroport_token", token);
}
export function removeToken() {
  localStorage.removeItem("agroport_token");
}
export function authHeaders(): Record<string, string> {
  const token = getToken();
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (token) base["Authorization"] = `Bearer ${token}`;
  return base;
}

export async function apiAuth(action: string, body?: object) {
  const r = await fetch(`${AUTH_URL}?action=${action}`, {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

export async function apiCRM(action: string, body?: object, id?: number, extra?: Record<string, string>) {
  const url = new URL(CRM_URL);
  url.searchParams.set("action", action);
  if (id) url.searchParams.set("id", String(id));
  if (extra) Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

export async function apiLogistics(action: string, body?: object) {
  const url = new URL(LOGISTICS_URL);
  url.searchParams.set("action", action);
  const r = await fetch(url.toString(), {
    method: body ? "POST" : "GET",
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  company: string;
  role: string;
  is_verified: boolean;
  plan: string;
  avatar_url?: string;
  phone?: string;
  created_at?: string;
}