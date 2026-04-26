const URLS = {
  auth: "https://functions.poehali.dev/bbe7eb6c-fae1-429c-9b40-2896584b9d4d",
  users: "https://functions.poehali.dev/c81166ae-eea4-4a13-8c2e-c1286747733b",
  news: "https://functions.poehali.dev/491a4baa-6295-4358-8582-78c5e508b2e1",
  stats: "https://functions.poehali.dev/d7a80f90-f407-4351-8851-a4f203ae0658",
  appeals: "https://functions.poehali.dev/acd52a79-f0c2-4e34-8354-a1c4c038a504",
};

const TOKEN_KEY = "admin_token";

export const adminToken = {
  get: () => localStorage.getItem(TOKEN_KEY) || "",
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function headers(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "X-Admin-Token": adminToken.get(),
    ...extra,
  };
}

async function req(url: string, opts?: RequestInit) {
  const res = await fetch(url, { headers: headers(), ...opts });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка запроса");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const adminApi = {
  login: (login: string, password: string) =>
    req(`${URLS.auth}?action=login`, {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),

  verify: () =>
    fetch(`${URLS.auth}?action=verify`, { headers: headers() })
      .then(r => r.ok),

  logout: () =>
    req(`${URLS.auth}?action=logout`, { method: "DELETE" }),

  // ── Stats ──
  getStats: (period = 30) =>
    req(`${URLS.stats}?period=${period}`),

  // ── Users ──
  getUsers: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(`${URLS.users}?${q}`);
  },

  getUser: (id: number) => req(`${URLS.users}?id=${id}`),

  updateUser: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.users}?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // ── News ──
  getNews: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(`${URLS.news}?${q}`);
  },

  getOneNews: (id: number) => req(`${URLS.news}?id=${id}`),

  createNews: (data: Record<string, unknown>) =>
    req(URLS.news, { method: "POST", body: JSON.stringify(data) }),

  updateNews: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.news}?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteNews: (id: number) =>
    req(`${URLS.news}?id=${id}`, { method: "DELETE" }),

  // ── Appeals ──
  getAppeals: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(`${URLS.appeals}?${q}`);
  },

  getAppeal: (id: number) => req(`${URLS.appeals}?id=${id}`),

  updateAppeal: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.appeals}?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
};
