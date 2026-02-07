"use client";

import { useState } from "react";

export default function MigreringPage() {
  const [secret, setSecret] = useState("dev");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/migrate-category?secret=${encodeURIComponent(secret)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setResult({ status: res.status, data });
    } catch (e: any) {
      setResult({ status: 0, data: { ok: false, error: e?.message || "Unknown error" } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ margin: "6px 0 10px" }}>Admin – migrering</h1>
      <p style={{ color: "#64748b", fontWeight: 600, marginTop: 0 }}>
        Setter <code>category</code> på annonser som mangler det.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="secret"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "10px 12px",
            minWidth: 220,
          }}
        />
        <button
          onClick={run}
          disabled={loading}
          style={{
            border: "1px solid #e5e7eb",
            background: "#fff",
            padding: "10px 12px",
            borderRadius: 12,
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 800,
          }}
        >
          {loading ? "Kjører..." : "Kjør migrering"}
        </button>
      </div>

      {result ? (
        <pre
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#0b1020",
            color: "#e5e7eb",
            overflow: "auto",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
{JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
