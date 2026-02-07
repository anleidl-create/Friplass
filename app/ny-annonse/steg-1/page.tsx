"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadMvpDraft, saveMvpDraft, type MvpDraft } from "../../../lib/new-listing/mvpStorage";

export default function Step1() {
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

  const titleOk = (draft.title ?? "").trim().length >= 5;
  const descOk = (draft.description ?? "").trim().length >= 20;
  const canNext = titleOk && descOk;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={h1Style}>Ny annonse</h1>
            <p style={mutedStyle}>Steg 1 av 4 – Tittel og beskrivelse</p>
          </div>

          <a href="/" style={linkStyle}>
            ← Til forsiden
          </a>
        </header>

        <section style={cardStyle}>
          <label style={labelStyle}>Tittel</label>
          <input
            value={draft.title ?? ""}
            onChange={(e) => update("title", e.target.value as any)}
            style={inputStyle}
            placeholder="F.eks. Bobilplass ved sjøen"
          />
          <div style={hintStyle}>
            Minst 5 tegn {titleOk ? "✓" : ""}
          </div>

          <div style={{ height: 6 }} />

          <label style={labelStyle}>Beskrivelse</label>
          <textarea
            value={draft.description ?? ""}
            onChange={(e) => update("description", e.target.value as any)}
            style={{ ...inputStyle, minHeight: 140, resize: "vertical" }}
            placeholder="Beskriv plassen, utsikt, fasiliteter osv."
          />
          <div style={hintStyle}>
            Minst 20 tegn {descOk ? "✓" : ""}
          </div>
        </section>

        <div style={navRowStyle}>
          <div />
          <button
            type="button"
            style={{ ...btnStyle, ...primaryBtnStyle, opacity: canNext ? 1 : 0.6 }}
            disabled={!canNext}
            onClick={() => router.push("/ny-annonse/steg-2")}
          >
            Neste →
          </button>
        </div>
      </div>
    </main>
  );
}

/* ---------- Styles (typed) ---------- */

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

const linkStyle: React.CSSProperties = {
  textDecoration: "none",
  color: "#111827",
  fontWeight: 700,
};
