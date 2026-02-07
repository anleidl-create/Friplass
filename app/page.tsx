// app/page.tsx
import fs from "fs/promises";
import path from "path";

type ListingImage = { url: string };

type Listing = {
  id: string;
  title: string;
  description?: string;
  location?: { address?: string };
  price?: { perNight?: number; currency?: string };
  images?: ListingImage[];
  mainImageUrl?: string; // ✅ NY
  createdAt?: string;
};

async function readListings(): Promise<Listing[]> {
  const filePath = path.join(process.cwd(), "data", "listings.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed as Listing[];
    if (parsed && Array.isArray(parsed.listings)) return parsed.listings as Listing[];

    return [];
  } catch (err: any) {
    if (err?.code === "ENOENT") return [];
    throw err;
  }
}

function safeAddress(l: Listing) {
  return l.location?.address?.trim() || "Sted ikke oppgitt";
}

function formatPrice(l: Listing) {
  const perNight = l.price?.perNight;
  const currency = l.price?.currency ?? "NOK";
  if (perNight == null) return "Pris ikke oppgitt";
  return `${perNight} ${currency} / natt`;
}

function excerpt(text: string | undefined, max = 120) {
  const t = (text || "").trim();
  if (!t) return "Ingen beskrivelse";
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

// ✅ Velg riktig bilde til kort: mainImageUrl -> første bilde -> null
function getCardImageUrl(l: Listing): string | null {
  const main = typeof l.mainImageUrl === "string" ? l.mainImageUrl.trim() : "";
  if (main) return main;

  const first =
    Array.isArray(l.images) && l.images.length > 0 && typeof l.images[0]?.url === "string"
      ? l.images[0].url
      : "";

  return first || null;
}

export default async function HomePage() {
  const listings = await readListings();

  // Nyeste først hvis createdAt finnes (ellers behold rekkefølge)
  const sorted = [...listings].sort((a, b) => {
    const da = a.createdAt ? Date.parse(a.createdAt) : 0;
    const db = b.createdAt ? Date.parse(b.createdAt) : 0;
    return db - da;
  });

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            padding: 16,
            borderRadius: 16,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>Friplass</h1>
            <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
              {sorted.length} annonse{sorted.length === 1 ? "" : "r"}
            </p>
          </div>

          <a href="/ny-annonse/steg-1" style={ctaStyle}>
            + Ny annonse
          </a>
        </header>

        <div style={{ height: 16 }} />

        {sorted.length === 0 ? (
          <section
            style={{
              padding: 18,
              borderRadius: 16,
              background: "#ffffff",
              border: "1px dashed #d1d5db",
            }}
          >
            <h2 style={{ margin: "0 0 8px" }}>Ingen annonser ennå</h2>
            <p style={{ margin: "0 0 14px", color: "#6b7280" }}>
              Klikk “Ny annonse” for å legge ut din første plass.
            </p>
            <a href="/ny-annonse/steg-1" style={ctaStyle}>
              Lag annonse
            </a>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {sorted.map((l) => {
              const cardImage = getCardImageUrl(l);

              return (
                <a
                  key={l.id}
                  href={`/annonse/${l.id}`}
                  style={{
                    textDecoration: "none",
                    color: "#111827",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 12,
                    display: "block",
                  }}
                >
                  <div
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {cardImage ? (
                      <img
                        src={cardImage}
                        alt={l.title}
                        style={{
                          width: "100%",
                          height: 180,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height: 180,
                          display: "grid",
                          placeItems: "center",
                          color: "#6b7280",
                        }}
                      >
                        Ingen bilde
                      </div>
                    )}
                  </div>

                  <h2 style={{ margin: "10px 0 6px", fontSize: 18 }}>{l.title}</h2>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={pillStyle}>{formatPrice(l)}</span>
                    <span style={pillStyle}>{safeAddress(l)}</span>
                  </div>

                  <p style={{ margin: 0, color: "#374151", lineHeight: 1.5 }}>
                    {excerpt(l.description, 140)}
                  </p>
                </a>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 16px",
  borderRadius: 12,
  backgroundColor: "#111827",
  color: "#ffffff",
  fontSize: 14,
  fontWeight: 800,
  textDecoration: "none",
  border: "1px solid #111827",
  cursor: "pointer",
};

const pillStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "5px 9px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  color: "#111827",
};
