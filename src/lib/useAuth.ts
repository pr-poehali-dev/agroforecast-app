import { useState, useEffect, useCallback } from "react";

export const AUTH_URL = "https://functions.poehali.dev/3a6fb358-74b8-46ff-8b89-6eb8c01db47d";

export interface User {
  id: number;
  email: string;
  full_name: string;
  company: string | null;
  role: string;
  plan: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
  created_at: string;
}

function authHeaders(token: string) {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ap_token"));
  const [loading, setLoading] = useState(!!localStorage.getItem("ap_token"));

  const fetchMe = useCallback(async (t: string) => {
    try {
      const r = await fetch(`${AUTH_URL}?action=me`, { headers: authHeaders(t) });
      if (!r.ok) { logout(); return; }
      const data = await r.json();
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe(token);
    else setLoading(false);
  }, [token, fetchMe]);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Ошибка входа");
    localStorage.setItem("ap_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email: string, password: string, full_name: string, role: string) => {
    const r = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name, role }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Ошибка регистрации");
    localStorage.setItem("ap_token", data.token);
    setToken(data.token);
    await fetchMe(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("ap_token");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (fields: Partial<User>) => {
    if (!token) return;
    await fetch(`${AUTH_URL}?action=update_profile`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(fields),
    });
    await fetchMe(token);
  };

  const forgotPassword = async (email: string) => {
    const r = await fetch(`${AUTH_URL}?action=forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return r.json();
  };

  return { user, token, loading, login, register, logout, updateProfile, forgotPassword, isAuth: !!user };
}

export const CRM_URL = "https://functions.poehali.dev/b82b5560-b8a7-4691-a429-f458f67c2b78";

export function crmFetch(token: string, entity: string, params: Record<string, string> = {}, options?: RequestInit) {
  const q = new URLSearchParams({ entity, ...params }).toString();
  return fetch(`${CRM_URL}?${q}`, {
    ...options,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...(options?.headers || {}) },
  });
}
