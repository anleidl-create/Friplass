// components/new-listing/Step4Summary.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadMvpDraft,
  saveMvpDraft,
  type MvpDraft,
} from "@/lib/new-listing/mvpStorage";
import { getOrCreateDeviceId } from "@/lib/deviceId";

type ListingImage = { url: string };

function formatPrice(draft: any) {
  const perNight = draft?.price?.perNight as number | undefined;
  const currency = (draft?.price?.currency as string | undefined) ?? "NOK";
  if (perNight == null) return "Ingen pris oppgitt";
  return `${perNight} ${currency} / natt`;
}

function safeAddress(draft: any) {
  const addr = draft?.location?.address ?? draft?.locationText ?? draft?.address;
  return typeof addr === "string" && addr.trim() ? addr.trim() : "Ingen adresse oppgitt";
}

function safeImages(draft: any): ListingImage[] {
  const raw = draft?.images;
  if (!Array.isArray(raw)) return [];

  // støtte både ["url"] og [{url}]
  return raw
    .map((x: any) => {
      if (!x) return null;
      if (typeof x === "string") return { url: x };
      if (typeof x?.url === "string") return { url: x.url };
      return null;
    })
    .filter(Boolean) as ListingImage[];
}

function safeMainImageUrl(draft: any): string | undefined {
  const v = draft?.mainImageUrl;
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

// ✅ Normaliser payload:
// - images alltid [{url}]
// - mainImageUrl alltid satt hvis det finnes bilder
// - adresse alltid inn i location.address (og locationText + address som fallback)
function normalizePayload(draft: any) {
  const images = safeImages(draft);
  const mainImageUrl = safeMainImageUrl(draft);

  let fixedImages = images;
  if (fixedImages.length === 0 && mainImageUrl) {
    fixedImages = [{ url: mainImageUrl }];
  }

  const finalMain = mainImageUrl ?? fixedImages?.[0]?.url;

  const addr = draft?.location?.address ?? draft?.locationText ?? draft?.address;
  const addrTrimmed =
    typeof addr === "string" && addr.trim() ? addr.trim() : undefined;

  const fixedLocation = addrTrimmed
    ? { ...(draft.location ?? {}), address: addrTrimmed }
    : draft.location;

  return {
    ...draft,
    location: fixedLocation,
    locationText: addrTrimmed ?? draft.locationText,
    address: addrTrimmed ?? draft.address,
    images: fixedImages,
    mainImageUrl: finalMain,
  };
}

export default function Step4Summary() {
  const router = useRouter();

  const [draft, setDraft] = useState<MvpDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mode = useMemo(() => {
    if (typeof window === "undefined") return "new";
    return sessionStorage.getItem("mvp_mode") === "edit" ? "edit" : "new";
  }, []);

  const editingId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const id = sessionStorage.getItem("mvp_editingId");
    return id && id.trim() ? id : null;
  }, []);

  useEffect(() => {
    function refresh() {
      const d = loadMvpDraft();
      setDraft(d ?? null);
    }

    refresh();

    // ✅ hvis bruker går frem/tilbake eller tab blir aktiv igjen
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  function goBack() {
    router.push("/ny-annonse/steg-3");
  }

  async function publishOrUpdate() {
    // ✅ ALLTID hent fersk draft ved klikk
    const fresh = loadMvpDraft();
    const draftToSendRaw = (fresh ?? draft) as any;

    if (!draftToSendRaw) {
      setError("Fant ikke utkast. Gå tilbake og fyll ut informasjon.");
      return;
    }

    const draftToSend = normalizePayload(draftToSendRaw);

    setSaving(true);
    setError(null);

    try {
      // lagre (trygt)
      saveMvpDraft(draftToSend as any);

      if (mode === "edit") {
        if (!editingId) throw new Error("Mangler editingId. Start redigering på nytt.");

        const res = await fetch(`/api/listings/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftToSend),
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Kunne ikke oppdatere annonsen.");
        }

        sessionStorage.removeItem("mvp_mode");
        sessionStorage.removeItem("mvp_editingId");
        router.push(`/annonse/${editingId}`);
        return;
      }

      const ownerDeviceId = getOrCreateDeviceId();

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draftToSend, ownerDeviceId }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Kunne ikke publisere annonsen.");
      }

      let createdId: string | null = null;
      try {
        const data = await res.json();
        if (data && typeof data.id === "string") createdId = data.id;
      } catch {
        // ignore
      }

      sessionStorage.removeItem("mvp_mode");
      sessionStorage.removeItem("mvp_editingId");

      if (createdId) router.push(`/annonse/${createdId}`);
      else router.push("/");
    } catch (e: any) {
      setError(e?.message ?? "Ukjent feil");
    } finally {
      setSaving(false);
    }
  }

  async function deleteListing() {
    if (!editingId) {
      setError("Kan ikke slette: mangler ID.");
      return;
    }

    const ok = window.confirm("Er du sikker på at du vil slette annonsen?");
    if (!ok) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/listings/${editingId}`, { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Kunne ikke slette annonsen.");
      }

      sessionStorage.removeItem("mvp_mode");
      sessionStorage.removeItem("mvp_editingId");
      router.push("/");
    } catch (e: any) {
      setError(e?.message ?? "Ukjent feil");
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginTop: 0 }}>Oppsummering</h1>
        <p>Laster utkast…</p>
      </main>
    );
  }

  const normalizedForView = normalizePayload(draft as any);
  const images = safeImages(normalizedForView);
  const mainImageUrl = safeMainImageUrl(normalizedForView);
  const hero = mainImageUrl || images?.[0]?.url;

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>
        {mode === "edit" ? "Oppsummering (rediger)" : "Oppsummering"}
      </h1>

      {error ? (
        <div style={errorBox}>
          <strong>Feil:</strong> {error}
        </div>
      ) : null}

      {hero ? (
        <div style={{ marginTop: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero}
            alt=""
            style={{
              width: "100%",
              height: 360,
              objectFit: "cover",
              borderRadius: 16,
              border: "1px solid rgba(0,0,0,0.12)",
              display: "block",
            }}
          />
        </div>
      ) : null}

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={pillStyle}>{formatPrice(normalizedForView)}</span>
        <span style={pillStyle}>{safeAddress(normalizedForView)}</span>
        {mode === "edit" && editingId ? <span style={pillStyle}>ID: {editingId}</span> : null}
      </div>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: "0 0 8px" }}>Tittel</h2>
        <div style={box}>{normalizedForView?.title || "—"}</div>
      </section>

      <section style={{ marginTop: 16 }}>
        <h2 style={{ margin: "0 0 8px" }}>Beskrivelse</h2>
        <div style={{ ...box, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {normalizedForView?.description || "—"}
        </div>
      </section>

      {images.length ? (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ margin: "0 0 8px" }}>Bilder</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {images.map((img, idx) => (
              <div
                key={img.url + idx}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(0,0,0,0.12)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={goBack} disabled={saving} style={btnSecondary}>
          ← Tilbake
        </button>

        <button type="button" onClick={publishOrUpdate} disabled={saving} style={btnPrimary}>
          {saving ? "Lagrer…" : mode === "edit" ? "Oppdater annonse" : "Publiser annonse"}
        </button>

        {mode === "edit" ? (
          <button type="button" onClick={deleteListing} disabled={saving} style={btnDanger}>
            Slett annonse
          </button>
        ) : null}
      </div>

      {mode === "new" ? (
        <p style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
          Tips: “Mine annonser” vil dukke opp på samme enhet, fordi vi knytter nye annonser til en device-id.
        </p>
      ) : null}
    </main>
  );
}

const pillStyle: React.CSSProperties = {
  fontSize: 14,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
};

const box: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.12)",
  borderRadius: 12,
  padding: 12,
  background: "white",
};

const errorBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid rgba(220, 38, 38, 0.35)",
  background: "rgba(220, 38, 38, 0.06)",
  color: "#991b1b",
};

const btnBase: React.CSSProperties = {
  borderRadius: 12,
  padding: "10px 12px",
  fontWeight: 800,
  border: "1px solid rgba(0,0,0,0.12)",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "black",
  color: "white",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "white",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "white",
  border: "1px solid rgba(220, 38, 38, 0.35)",
  color: "#b91c1c",
};
