const URLS = {
  auth: "https://functions.poehali.dev/bbe7eb6c-fae1-429c-9b40-2896584b9d4d",
  users: "https://functions.poehali.dev/c81166ae-eea4-4a13-8c2e-c1286747733b",
  news: "https://functions.poehali.dev/491a4baa-6295-4358-8582-78c5e508b2e1",
  stats: "https://functions.poehali.dev/d7a80f90-f407-4351-8851-a4f203ae0658",
  appeals: "https://functions.poehali.dev/acd52a79-f0c2-4e34-8354-a1c4c038a504",
  listings: "https://functions.poehali.dev/c97f48dc-125b-44c6-95dd-7bba1ad9286a",
  documents: "https://functions.poehali.dev/326d7164-dac3-407d-bad7-9d613c211c21",
  agent: "https://functions.poehali.dev/da876f65-9bf1-47dd-a655-51724a287820",
  suppliers: "https://functions.poehali.dev/f855736f-6aea-46bc-b19f-5da2b53735cd",
  regionPlan: "https://functions.poehali.dev/12ca1111-c9f0-4f38-bffe-b5bd19cb4cff",
  procurement: "https://functions.poehali.dev/d785322c-a846-4496-9e64-9e42975dffdb",
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
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // Не разлогиниваем автоматически: один фоновый сбой не должен выкидывать
    // из живой сессии. Реальную проверку делает verify() при загрузке.
    throw new Error(data.error || "Не авторизован");
  }
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

  // ── Listings ──
  getListings: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(`${URLS.listings}?${q}`);
  },

  getListing: (id: number) => req(`${URLS.listings}?id=${id}`),

  updateListing: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.listings}?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),

  moderateListing: (id: number, action: "approve" | "reject" | "hide" | "restore", comment?: string) =>
    req(`${URLS.listings}?id=${id}&action=${action}`, {
      method: "PUT",
      body: JSON.stringify({ comment: comment || "" }),
    }),

  deleteListing: (id: number) =>
    req(`${URLS.listings}?id=${id}`, { method: "DELETE" }),

  // ── Documents ──
  getDocuments: () => req(`${URLS.documents}?resource=documents&token=${adminToken.get()}`),
  getDocument: (id: number) => req(`${URLS.documents}?resource=documents&id=${id}&token=${adminToken.get()}`),
  createDocument: (data: Record<string, unknown>) =>
    req(`${URLS.documents}?resource=documents&token=${adminToken.get()}`, { method: "POST", body: JSON.stringify(data) }),
  updateDocument: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.documents}?resource=documents&id=${id}&token=${adminToken.get()}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDocument: (id: number) =>
    req(`${URLS.documents}?resource=documents&id=${id}&token=${adminToken.get()}`, { method: "DELETE" }),

  // ── Project Tasks ──
  getTasks: (stage?: number) => {
    const q = stage ? `&stage=${stage}` : "";
    return req(`${URLS.documents}?resource=tasks${q}&token=${adminToken.get()}`);
  },
  createTask: (data: Record<string, unknown>) =>
    req(`${URLS.documents}?resource=tasks&token=${adminToken.get()}`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.documents}?resource=tasks&id=${id}&token=${adminToken.get()}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: number) =>
    req(`${URLS.documents}?resource=tasks&id=${id}&token=${adminToken.get()}`, { method: "DELETE" }),

  // ── AI Agent ──
  getAgentMessages: (limit = 50) => req(`${URLS.agent}?limit=${limit}&token=${adminToken.get()}`),
  sendAgentMessage: (message: string) =>
    req(`${URLS.agent}?token=${adminToken.get()}`, { method: "POST", body: JSON.stringify({ message }) }),
  clearAgentHistory: () => req(`${URLS.agent}?token=${adminToken.get()}`, { method: "DELETE" }),

  // ── Suppliers (база поставщиков) ──
  getSuppliers: (params: Record<string, string | number> = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return req(`${URLS.suppliers}?${q}`);
  },
  createSupplier: (data: Record<string, unknown>) =>
    req(URLS.suppliers, { method: "POST", body: JSON.stringify(data) }),
  dedupSuppliers: (preview = false) =>
    req(`${URLS.suppliers}?action=dedup`, { method: "POST", body: JSON.stringify({ preview }) }),
  suppliersQuality: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...params, action: "quality" }).toString();
    return req(`${URLS.suppliers}?${q}`);
  },
  suppliersRadar: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams({ ...params, action: "radar" }).toString();
    return req(`${URLS.suppliers}?${q}`);
  },
  updateSupplier: (id: number, data: Record<string, unknown>) =>
    req(`${URLS.suppliers}?id=${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSupplier: (id: number) =>
    req(`${URLS.suppliers}?id=${id}`, { method: "DELETE" }),
  importSuppliers: (rows: Record<string, unknown>[], region: string) =>
    req(`${URLS.suppliers}?action=import`, { method: "POST", body: JSON.stringify({ rows, region }) }),
  aiImportSuppliers: (rows: Record<string, unknown>[], region: string) =>
    req(`${URLS.suppliers}?action=ai_import`, { method: "POST", body: JSON.stringify({ rows, region }) }),
  getSupplierFacets: (region = "", innPrefix = "") =>
    req(`${URLS.suppliers}?action=facets${region ? `&region=${encodeURIComponent(region)}` : ""}${innPrefix ? `&inn_prefix=${innPrefix}` : ""}`),
  getSupplierAnalytics: (region = "") =>
    req(`${URLS.suppliers}?action=analytics${region ? `&region=${encodeURIComponent(region)}` : ""}`),
  analyzeSupplier: (id: number) =>
    req(`${URLS.suppliers}?action=ai_analyze&id=${id}`, { method: "POST", body: JSON.stringify({}) }),
  generateSupplierLetter: (id: number, opts: { tone?: string; company?: string } = {}) =>
    req(`${URLS.suppliers}?action=ai_letter&id=${id}`, { method: "POST", body: JSON.stringify(opts) }),
  enrichSupplier: (id: number) =>
    req(`${URLS.suppliers}?action=ai_enrich&id=${id}`, { method: "POST", body: JSON.stringify({}) }),
  enrichSuppliersBatch: (innPrefix = "64", batch = 4) =>
    req(`${URLS.suppliers}?action=ai_enrich_batch`, { method: "POST", body: JSON.stringify({ inn_prefix: innPrefix, batch }) }),
  getSupplierHistory: (id: number) =>
    req(`${URLS.suppliers}?action=history&id=${id}`),
  addSupplierInteraction: (id: number, data: { type: string; content: string; author?: string }) =>
    req(`${URLS.suppliers}?action=history&id=${id}`, { method: "POST", body: JSON.stringify(data) }),
  deleteSupplierInteraction: (hid: number) =>
    req(`${URLS.suppliers}?action=history&hid=${hid}`, { method: "DELETE" }),

  // ── ИИ-менеджер по закупкам ──
  composeMessage: (id: number, opts: { channel?: string; goal?: string; instructions?: string }) =>
    req(`${URLS.procurement}?action=compose&id=${id}`, { method: "POST", body: JSON.stringify(opts) }),
  sendMessage: (messageId: number, opts: { recipient?: string; subject?: string; body?: string; force?: boolean } = {}) =>
    req(`${URLS.procurement}?action=send`, { method: "POST", body: JSON.stringify({ message_id: messageId, ...opts }) }),
  getSupplierMessages: (id: number) =>
    req(`${URLS.procurement}?action=messages&id=${id}`),
  getMaxStatus: (id: number) =>
    req(`${URLS.procurement}?action=max_status&id=${id}`),
  getWorkHours: () =>
    req(`${URLS.procurement}?action=work_hours`),

  // ── Region plan (план по региону) ──
  getRegionPlan: (region: string) =>
    req(`${URLS.regionPlan}?region=${encodeURIComponent(region)}`),
  saveRegionPlan: (data: Record<string, unknown>) =>
    req(URLS.regionPlan, { method: "POST", body: JSON.stringify(data) }),
  generateRegionPlan: (region: string, partner: string, extra: string) =>
    req(`${URLS.regionPlan}?action=generate`, {
      method: "POST",
      body: JSON.stringify({ region, partner, extra }),
    }),
};