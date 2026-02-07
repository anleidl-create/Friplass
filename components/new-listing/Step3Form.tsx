"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/styles/ny-annonse.module.css";
import { loadMvpDraft, saveMvpDraft } from "@/lib/new-listing/storage";

type MvpDraft = {
  imageUrls?: string[];
  mainImageUrl?: string;
};

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload feilet (${res.status}). ${txt}`);
  }

  const data = (await res.json()) as any;
  const url = data?.url || data?.file?.url;
  if (!url) throw new Error("Upload: mangler url i respons.");
  return String(url);
}

async function tryDelete(url: string) {
  // Best effort: ikke stopp brukeren om delete-endpoint varierer
  try {
    await fetch("/api/uploads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    // ignore
  }
}

export default function Step3Form() {
  const router = useRouter();
  const draft = (loadMvpDraft() ?? {}) as MvpDraft;

  const [imageUrls, setImageUrls] = useState<string[]>(
    Array.isArray(draft.imageUrls) ? draft.imageUrls : []
  );
  const [mainImageUrl, setMainImageUrl] = useState<string>(
    typeof draft.mainImageUrl === "string" ? draft.mainImageUrl : ""
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hero = useMemo(() => {
    if (mainImageUrl && imageUrls.includes(mainImageUrl)) return mainImageUrl;
    return imageUrls[0] || "";
  }, [imageUrls, mainImageUrl]);

  function persist(nextUrls: string[], nextMain: string) {
    const prev = (loadMvpDraft() ?? {}) as any;
    saveMvpDraft({
      ...prev,
      imageUrls: nextUrls,
      mainImageUrl: nextMain && nextUrls.includes(nextMain) ? nextMain : (nextUrls[0] || ""),
    });
  }

  async function onPickFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setError("");
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        const url = await uploadFile(f);
        uploaded.push(url);
      }

      const next = [...imageUrls, ...uploaded];
      const nextMain = mainImageUrl || next[0] || "";
      setImageUrls(next);
      setMainImageUrl(nextMain);
      persist(next, nextMain);
    } catch (e: any) {
      setError(e?.message || "Ukjent feil ved opplasting.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(url: string) {
    setError("");
    const next = imageUrls.filter((x) => x !== url);
    const nextMain = url === mainImageUrl ? (next[0] || "") : mainImageUrl;

    setImageUrls(next);
    setMainImageUrl(nextMain);
    persist(next, nextMain);

    await tryDelete(url);
  }

  function setAsMain(url: string) {
    setMainImageUrl(url);
    persist(imageUrls, url);
  }

  function onNext() {
    persist(imageUrls, mainImageUrl);
    router.push("/ny-annonse/steg-4");
  }

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Last opp bilder</label>
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onPickFiles(e.target.files)}
          disabled={busy}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>

      {imageUrls.length === 0 ? (
        <p style={{ color: "#6b7280", marginTop: 8 }}>Ingen bilder ennå.</p>
      ) : (
        <>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>
              Forhåndsvisning (hovedbilde)
            </div>
            <img
              src={hero}
              alt="Hovedbilde"
              style={{
                width: "100%",
                maxWidth: 720,
                height: 320,
                objectFit: "cover",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                display: "block",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 12,
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            {imageUrls.map((url) => {
              const active = url === hero;
              return (
                <div
                  key={url}
                  style={{
                    border: active ? "2px solid #111827" : "1px solid #e5e7eb",
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <img
                    src={url}
                    alt="Bilde"
                    style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 10, display: "flex", gap: 8, justifyContent: "space-between" }}>
                    <button
                      type="button"
                      onClick={() => setAsMain(url)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #e5e7eb",
                        background: active ? "#111827" : "#fff",
                        color: active ? "#fff" : "#111827",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {active ? "Hovedbilde" : "Velg som hoved"}
                    </button>

                    <button
                      type="button"
                      onClick={() => remove(url)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #fecaca",
                        background: "#fff",
                        color: "#b91c1c",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      Slett
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={() => router.back()}>
          Tilbake
        </button>
        <button type="button" className={styles.primary} onClick={onNext} disabled={busy}>
          Neste
        </button>
      </div>
    </div>
  );
}
