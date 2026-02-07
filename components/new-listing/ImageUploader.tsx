"use client";

import { useRef, useState } from "react";

type Props = {
  value: string[];                 // URL-er
  onChange: (urls: string[]) => void;
  max?: number;
};

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: 12 },
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  input: { display: "none" },
  btn: {
    height: 42,
    borderRadius: 12,
    border: "1px solid #cfcfcf",
    padding: "0 14px",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },
  hint: { margin: 0, color: "#666", fontSize: 13, lineHeight: 1.4 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  card: {
    border: "1px solid #e5e5e5",
    borderRadius: 12,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  img: {
    width: "100%",
    height: 100,
    objectFit: "cover",
    borderRadius: 10,
    background: "#f5f5f5",
  },
  smallBtn: {
    height: 34,
    borderRadius: 10,
    border: "1px solid #cfcfcf",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  error: { marginTop: 10, color: "#b00020", fontSize: 13 },
  progress: { marginTop: 10, color: "#333", fontSize: 13 },
};

export default function ImageUploader({ value, onChange, max = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const remaining = Math.max(0, max - (value?.length ?? 0));

  function openPicker() {
    setMsg(null);
    inputRef.current?.click();
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = ""; // så samme fil kan velges igjen

    if (files.length === 0) return;

    if (files.length > remaining) {
      setMsg(`Du kan legge til maks ${max} bilder totalt. Du har plass til ${remaining} til.`);
      return;
    }

    setUploading(true);
    setMsg(null);

    try {
      const form = new FormData();
      for (const f of files) form.append("files", f);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json?.error ?? "Opplasting feilet.");
        return;
      }

      const urls: string[] = json?.urls ?? [];
      onChange([...(value ?? []), ...urls]);
      setMsg(`Lastet opp ${urls.length} bilde(r).`);
    } catch {
      setMsg("Opplasting feilet.");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(idx: number) {
    const next = [...(value ?? [])];
    next.splice(idx, 1);
    onChange(next);
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.row}>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={onFilesSelected}
          style={styles.input}
        />

        <button type="button" onClick={openPicker} style={styles.btn} disabled={uploading || remaining === 0}>
          {uploading ? "Laster opp..." : "Legg til bilder"}
        </button>

        <p style={styles.hint}>
          {value?.length ?? 0}/{max} bilder. JPG/PNG/WebP (maks ca. 8MB per bilde).
        </p>
      </div>

      {uploading ? <div style={styles.progress}>Opplaster…</div> : null}
      {msg ? <div style={styles.error}>{msg}</div> : null}

      {value && value.length > 0 ? (
        <div style={styles.grid}>
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} style={styles.card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Bilde ${idx + 1}`} style={styles.img} />
              <button type="button" onClick={() => removeAt(idx)} style={styles.smallBtn}>
                Slett
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
