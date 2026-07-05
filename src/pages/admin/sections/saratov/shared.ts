export const REGION = "Саратовская область";

export interface Supplier {
  id: number; name: string; inn: string; region: string; district: string;
  locality: string; crops: string; volume_tons: number | null;
  contact_person: string; phone: string; email: string; address: string;
  status: string; source: string; notes: string; created_at: string;
  ownership?: string; website?: string; fax?: string; revenue?: string;
  staff_count?: string; founded_year?: string; activity?: string; postal_code?: string;
  is_farmer?: boolean; priority?: number; ai_analysis?: string; ai_letter?: string;
}

// Приоритетные районы вокруг Аткарска
export const PRIORITY_DISTRICTS = [
  "Аткарский", "Екатериновский", "Петровский", "Калининский",
  "Лысогорский", "Татищевский", "Аркадакский",
];

export const STATUS_LABELS: Record<string, string> = {
  new: "Новый", in_progress: "В работе", negotiation: "Переговоры",
  partner: "Партнёр", rejected: "Отказ",
};
export const STATUS_COLORS: Record<string, string> = {
  new: "bg-secondary text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  partner: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

export const emptyForm = () => ({
  name: "", inn: "", region: REGION, district: "", locality: "", crops: "",
  volume_tons: "", contact_person: "", phone: "", email: "", address: "",
  status: "new", notes: "", ownership: "", website: "", fax: "", revenue: "",
  staff_count: "", founded_year: "", activity: "", postal_code: "",
});

export interface Facet { value: string; count: number }
export interface Facets { regions: Facet[]; districts: Facet[]; activities: Facet[]; ownerships: Facet[] }

export interface Analytics {
  region: string; total: number;
  by_district: { district: string; count: number }[];
  by_activity: { activity: string; count: number }[];
  by_ownership: { ownership: string; count: number }[];
}