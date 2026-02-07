"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadMvpDraft, saveMvpDraft, type MvpDraft } from "../../../lib/new-listing/mvpStorage";

export default function Step2() {
  const router = useRouter();
  const [draft, setDraft] = useState<MvpDraft | null>(null);

  useEffect(() => {
    setDraft(loadMvpDraft());
  }, []);

  function update<K extends keyof MvpDraft>(key: K, value: MvpDraft[K]) {
    if (!draft) return;
    const next = { ...draft, [key]: value } as MvpDraft;
    setDraft(next);
    saveMvpDraft(next);
  }

  if (!draft) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={h1Style}>Ny annonse</h1>
            <p style={mutedStyle}>Laster…</p>
          </div>
        </div>
      </main>
    );
  }

  const addressOk = (draft.address ?? "").trim().length > 0;
  const priceOk = typeof draft.pricePerNight === "number" && draft.pricePerNight > 0;
  const canNext = addressOk && priceOk;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={h1Style}>Ny annonse</h1>
            <p style={mutedStyle}>Steg 2 av 4 – Adresse og pris</p>
          </div>
        </header>

        <section style={cardStyle}>
          <label style={labelStyle}>Adresse / sted</label>
          <input
            value={draft.address ?? ""}
            onChange={(e) => update("address", e.target.value as any)}
            style={inputStyle}
            placeholder="Egersund"
          />

          <div style={{ height: 6 }} />

          <label style={labelStyle}>Pris per natt (NOK)</label>
          <input
            value={draft.pricePerNight ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const num = val === "" ? ("" as any) : Number(val);
              update("pricePerNight", num);
            }}
            style={inputStyle}
            inputMode="numeric"
            placeholder="750"
          />
          <div style={hintStyle}>{priceOk ? "✓" : "Må være et tall > 0"}</div>
        </section>

        <div style={navRowStyle}>
          <button type="button" style={{ ...btnStyle, ...secondaryBtnStyle }} onClick={() => router.push("/ny-annonse/steg-1")}>
            ← Tilbake
          </button>

          <button
            type="button"
            style={{ ...btnStyle, ...primaryBtnStyle, opacity: canNext ? 1 : 0.6 }}
            disabled={!canNext}
            onClick={() => router.push("/ny-annonse/steg-3")}
          >
            Neste →
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------- Styles ---------- */

const pageStyle: React.CSSProperties = {
  padding: 24,
  background: "#f8fafc",
  minHeight: "100vh",
  fontFamily: "system-ui, sans-serif",
};

const containerStyle: React.CSSProperties = {
  maxWidth: 820,
  margin: "0 auto",
  display: "grid",
  gap: 14,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  padding: 16,
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #e5e7eb",
  display: "grid",
  gap: 10,
};

const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
};

const mutedStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#6b7280",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  fontSize: 15,
  outline: "none",
};

const hintStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
};

const navRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const btnStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  border: "1px solid #111827",
};

const primaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#111827",
  color: "#ffffff",
};

const secondaryBtnStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#111827",
};
