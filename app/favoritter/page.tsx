"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ListingCard from "../../components/listing/ListingCard";
import ListingCardSkeleton from "../../components/listing/ListingCardSkeleton";

type ListingImage = { url: string };

type Listing = {
  id: string;
  title?: string;
  description?: string;

  locationText?: string;
  address?: string;
  location?: { address?: string };

  price?: { perNight?: number; currency?: string };
  pricePerNight?: number;

  images?: ListingImage[];
  mainImageUrl?: string;

  createdAt?: string;
  ownerDeviceId?: string;

  badges?: string[];
  suitability?: string[];

  category?: string;
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function readFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const keys = ["favoritter", "favorites", "favourites"];
  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map((x) => safeString(x)).filter(Boolean));
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).ids))
        return new Set((parsed as any).ids.map((x: any) => safeString(x)).filter(Boolean));
    } catch {
      // ignore
    }
  }
  return new Set();
}

function writeFavoriteIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  const arr = Array.from(ids);
  ["favoritter", "favorites", "favourites"].forEach((k) => {
    try {
      window.localStorage.setItem(k, JSON.stringify(arr));
    } catch {
      // ignore
    }
  });
}

function useDelayedLoading(loading: boolean, delayMs = 150) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setShow(true), delayMs);
      return () => clearTimeout(t);
    } else {
      setShow(false);
    }
  }, [loading, delayMs]);

  return show;
}

export default function FavoritterPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading, 150);
  const [error, setError] = useState("");

  const [all, setAll] = useState<Listing[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Les favoritter fra localStorage når siden åpnes
  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
  }, []);

  // Hent annonser
  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/listings", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : Array.isArray(data?.listings) ? data.listings : [];
        if (!alive) return;
        setAll(arr);
      } catch {
        if (!alive) return;
        setError("Kunne ikke hente annonser. Prøv å laste siden på nytt.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  function toggleFav(id: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavoriteIds(next);
      return next;
    });
  }

  const favorites = useMemo(() => {
    // NB: favoritter må finnes i listings for å vises her
    return all.filter((l) => favoriteIds.has(l.id));
  }, [all, favoriteIds]);

  const skeletonCount = 6;

  function SkeletonGrid() {
    return (
      <div className="grid" aria-label="Laster favoritter">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
        <style jsx>{`
          .grid {
            display: grid;
            gap: 14px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          @media (max-width: 980px) {
            .grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }
          @media (max-width: 520px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main className="page">
      <h1 className="h1">
        <span className="heart">❤️</span> Favoritter
      </h1>

      {error ? (
        <div className="error">{error}</div>
      ) : loading && showSkeleton ? (
        <SkeletonGrid />
      ) : loading ? null : favorites.length === 0 ? (
        <div className="empty">
          <div className="title">Du har ingen favoritter enda.</div>
          <div className="muted">Trykk ❤️ på en annonse for å lagre den her.</div>

          <button className="cta" type="button" onClick={() => router.push("/utforsk")}>
            Gå til Utforsk
          </button>
        </div>
      ) : (
        <div className="grid" aria-label="Favoritter">
          {favorites.map((l) => {
            const isFav = favoriteIds.has(l.id);

            return (
              <div
                key={l.id}
                className="cardWrap"
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  const el = e.target as HTMLElement | null;
                  if (el?.closest("button, a, input, select, textarea, label")) return;
                  router.push(`/annonse/${l.id}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") router.push(`/annonse/${l.id}`);
                }}
              >
                <ListingCard
                  listing={l as any}
                  rightSlot={
                    <button
                      className={`heartBtn ${isFav ? "on" : ""}`}
                      type="button"
                      aria-label={isFav ? "Fjern fra favoritter" : "Legg til favoritter"}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(l.id);
                      }}
                    >
                      {isFav ? "❤️" : "🤍"}
                    </button>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 18px 14px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .h1 {
          margin: 0 0 12px;
          font-size: 38px;
          font-weight: 900;
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .heart {
          font-size: 34px;
        }

        .grid {
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 980px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 520px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }

        .cardWrap {
          cursor: pointer;
        }

        .heartBtn {
          border: 1px solid #e5e7eb;
          background: #fff;
          width: 40px;
          height: 40px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 10px 30px -25px rgba(0, 0, 0, 0.25);
        }
        .heartBtn.on {
          border-color: rgba(59, 108, 255, 0.35);
        }

        .error {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #881337;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
        }

        .empty {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 18px;
          border-radius: 16px;
        }
        .title {
          font-weight: 900;
          font-size: 18px;
        }
        .muted {
          margin-top: 6px;
          color: #64748b;
          font-weight: 600;
        }
        .cta {
          margin-top: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}
