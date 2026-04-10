"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import AdminNav from "@/components/admin/AdminNav";

type BugReport = {
  id: string;
  user_email: string;
  page: string;
  what_happened: string;
  expected: string;
  created_at: string;
};

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });
      setBugs(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const formatDate = (str: string) =>
    new Date(str).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f5f5f5" }}>
      <AdminNav />
      <main style={{ flex: 1, padding: "2rem" }}>
        <h1 style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 28, marginBottom: 8 }}>
          🐛 Bugs signalés
        </h1>
        <p style={{ color: "#666", fontFamily: "Montserrat, sans-serif", fontSize: 14, marginBottom: 32 }}>
          Remontées des utilisateurs via le chatbot
        </p>

        {loading ? (
          <p style={{ fontFamily: "Montserrat, sans-serif" }}>Chargement...</p>
        ) : bugs.length === 0 ? (
          <div style={{
            background: "#fff", border: "2px solid #111", padding: "2rem",
            textAlign: "center", fontFamily: "Montserrat, sans-serif",
            boxShadow: "4px 4px 0 #111",
          }}>
            Aucun bug signalé pour le moment 🎉
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {bugs.map((bug) => (
              <div key={bug.id} style={{
                background: "#fff",
                border: "2px solid #111",
                boxShadow: "4px 4px 0 #111",
                padding: "1.25rem 1.5rem",
                fontFamily: "Montserrat, sans-serif",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{
                      background: "#E8151B", color: "#fff",
                      fontSize: 11, fontWeight: 900, padding: "2px 10px",
                    }}>
                      BUG
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{bug.user_email}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#888" }}>{formatDate(bug.created_at)}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, textTransform: "uppercase" }}>
                      Page concernée
                    </div>
                    <div style={{ fontSize: 13, background: "#f9f9f9", border: "1px solid #ddd", padding: "8px 10px" }}>
                      {bug.page || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, textTransform: "uppercase" }}>
                      Ce qui s'est passé
                    </div>
                    <div style={{ fontSize: 13, background: "#f9f9f9", border: "1px solid #ddd", padding: "8px 10px" }}>
                      {bug.what_happened || "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 4, textTransform: "uppercase" }}>
                      Ce qui était attendu
                    </div>
                    <div style={{ fontSize: 13, background: "#f9f9f9", border: "1px solid #ddd", padding: "8px 10px" }}>
                      {bug.expected || "—"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}