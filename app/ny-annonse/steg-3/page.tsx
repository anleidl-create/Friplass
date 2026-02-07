"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadMvpDraft,
  saveMvpDraft,
  type MvpDraft,
} from "../../../lib/new-listing/mvpStorage";

type ListingImage = { url: string };

export default function Step3() {
  const router = useRouter();
  const [draft, setDraft] = useState<MvpDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(loadMvpDraft());
  }, []);

  function update(next: MvpDraft) {
    setDraft(next);
    saveMvpDraft(next as any);
  }

  // ✅ NEW: images: [{url}]
  function getImages(d: MvpDraft): ListingImage[] {
    const imgs = (d as any)?.images;

    // støtte både [{url}] og ["url"]
    if (Array.isArray(imgs)) {
      return imgs
        .map((x: any) => {
          if (!x) return null;
          if (typeof x === "string") return { url: x };
          if (typeof x?.url === "string") return { url: x.url };
          return null;
        })
        .filter(Boolean) as ListingImage[];
    }

    // fallback: gammel stil imageUrls
    const legacy = (d as any)?.imageUrls;
    if (Array.isArray(legacy)) {
      return legacy
        .filter((x: any) => typeof x === "string" && x.trim().length > 0)
        .map((u: string) => ({ url: u }));
    }

    return [];
  }

  function getMainUrl(d: MvpDraft): string | undefined {
    const v = (d as any)?.mainImageUrl;
    if (typeof v === "string" && v.trim().length > 0) return v.trim();

    const imgs = getImages(d);
    return imgs[0]?.url;
  }

  function setMainImage(url: string) {
    if (!draft) return;
    const imgs = getImages(draft);
    if (!imgs.some((x) => x.url === url)) return;

    const next: MvpDraft = { ...(draft as any), mainImageUrl: url } as any;
    update(next);
  }

  function removeImage(urlToRemove: string) {
    if (!draft) return;

    const current = getImages(draft);
    const nextImages = current.filter((img) => img.url !== urlToRemove);

    const currentMain = getMainUrl(draft);
    let nextMain = currentMain;

    if (currentMain === urlToRemove) {
      nextMain = nextImages.length > 0 ? nextImages[0].url : undefined;
    }

    const next: MvpDraft = {
      ...(draft as any),

      // ✅ lagre i nytt format
      images: nextImages,
      mainImageUrl: nextMain,

      // ✅ valgfritt: behold legacy tomt for å unngå forvirring
      imageUrls: undefined,
    } as any;

    update(next);
  }

  async function upload(file: File) {
    if (!draft) return;

    setBusy(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("files", file);

      const res = await fetch("/api/uploads", { method: "POST", body: form });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        setError(
          `Upload feilet (${res.status}). ${data?.error || data?.raw || ""}`.trim()
        );
        setBusy(false);
        return;
      }

      const url = data?.url || data?.fileUrl || data?.path;

      if (!url || typeof url !== "string") {
        setError(`Upload OK, men mangler url i responsen: ${text}`);
        setBusy(false);
        return;
      }

      const current = getImages(draft);
      const exists = current.some((x) => x.url === url);
      const nextImages = exists ? current : [...current, { url }];

      const currentMain = getMainUrl(draft);
      const nextMain = currentMain ?? (nextImages.length > 0 ? nextImages[0].url : undefined);

      const next: MvpDraft = {
        ...(draft as any),
        images: nextImages,
        mainImageUrl: nextMain,

        // ✅ fjern legacy-felt for å unngå at noe annet leser feil
        imageUrls: undefined,
      } as any;

      update(next);
      setBusy(false);
    } catch (e: any) {
      setError(`Nettverksfeil: ${e?.message || "ukjent"}`);
      setBusy(false);
    }
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

  const images = getImages(draft);
  const mainUrl = getMainUrl(draft);
  const canNext = images.length > 0;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={h1Style}>Ny annonse</h1>
            <p style={mutedStyle}>Steg 3 av 4 – Bilder</p>
          </div>
        </header>

        {error ? <div style={errorBoxStyle}>{error}</div> : null}

        <section style={cardStyle}>
          <label style={labelStyle}>Last opp bilde</label>

          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.currentTarget.value = "";
            }}
          />

          <div style={hintStyle}>
            {busy ? "Laster opp…" : "Velg et bilde (JPG/PNG)"}{" "}
            {images.length > 0 ? `• ${images.length} bilde(r)` : ""}
          </div>

          <div style={imageGridStyle}>
            {images.map((img) => {
              const url = img.url;
              const isMain = !!mainUrl && url === mainUrl;

              return (
                <div
                  key={url}
                  style={{
                    ...imageCardStyle,
                    border: isMain ? "2px solid #16a34a" : imageCardStyle.border,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={imageStyle} />

                  <div style={imageActionsStyle}>
                    {isMain ? (
                      <span style={mainBadgeStyle}>⭐ Hovedbilde</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setMainImage(url)}
                        style={actionBtnStyle}
                        disabled={busy}
                      >
                        Velg som hovedbilde
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      style={removeBtnStyle}
                      disabled={busy}
                      aria-label="Fjern bilde"
                      title="Fjern bilde"
                    >
                      Fjern
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {images.length === 0 ? (
            <p style={{ ...mutedStyle, marginTop: 6 }}>
              Ingen bilder lagt til ennå.
            </p>
          ) : null}
        </section>

        <div style={navRowStyle}>
          <button
            type="button"
            style={{ ...btnStyle, ...secondaryBtnStyle }}
            disabled={busy}
            onClick={() => router.push("/ny-annonse/steg-2")}
          >
            ← Tilbake
          </button>

          <button
            type="button"
            style={{
              ...btnStyle,
              ...primaryBtnStyle,
              opacity: canNext && !busy ? 1 : 0.6,
            }}
            disabled={!canNext || busy}
            onClick={() => router.push("/ny-annonse/steg-4")}
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

const imageGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
  marginTop: 10,
};

const imageCardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  background: "#fff",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  objectFit: "cover",
  display: "block",
};

const imageActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const actionBtnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};

const mainBadgeStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #86efac",
  background: "#dcfce7",
  fontSize: 12,
  fontWeight: 900,
};

const removeBtnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};

const errorBoxStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#7f1d1d",
};
