import { useEffect, useState } from "react";
import { adminApi, adminToken } from "@/lib/adminApi";
import AdminLogin from "./AdminLogin";
import AdminLayout from "./AdminLayout";
import AdminDashboard from "./sections/AdminDashboard";
import AdminUsers from "./sections/AdminUsers";
import AdminAppeals from "./sections/AdminAppeals";
import AdminNews from "./sections/AdminNews";
import AdminDocs from "./sections/AdminDocs";
import Icon from "@/components/ui/icon";

export default function AdminPanel() {
  const [auth, setAuth] = useState<"loading" | "in" | "out">("loading");
  const [section, setSection] = useState("dashboard");
  const [newAppeals, setNewAppeals] = useState(0);

  useEffect(() => {
    if (!adminToken.get()) { setAuth("out"); return; }
    adminApi.verify().then(ok => setAuth(ok ? "in" : "out"));
  }, []);

  useEffect(() => {
    if (auth !== "in") return;
    adminApi.getAppeals({ status: "new", page: 1 })
      .then(d => setNewAppeals(d.total || 0))
      .catch(() => {});
  }, [auth]);

  if (auth === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <Icon name="Loader" size={28} className="animate-spin text-primary" />
    </div>
  );

  if (auth === "out") return <AdminLogin onLogin={() => setAuth("in")} />;

  const sections: Record<string, React.ReactNode> = {
    dashboard: <AdminDashboard onSection={setSection} />,
    users: <AdminUsers />,
    appeals: <AdminAppeals />,
    news: <AdminNews />,
    docs: <AdminDocs />,
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminLayout
        section={section}
        onSection={setSection}
        onLogout={() => setAuth("out")}
        newAppeals={newAppeals}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          {sections[section]}
        </div>
      </main>
    </div>
  );
}
