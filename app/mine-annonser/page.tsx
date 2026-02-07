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

function getOwnerDeviceIdFromStorage(): string {
  if (typeof window === "undefined") return "";

  const keys = [
    "ownerDeviceId",
    "mvp_ownerDeviceId",
    "deviceId",
    "mvp_deviceId",
    "friplass_ownerDeviceId",
    "friplass_deviceId",
    "mvp_owner_id",
    "mvp_device_id",
  ];

  for (const k of keys) {
    const v = safeString(window.localStorage.getItem(k)).trim();
    if (v) return v;
  }

  for (const k of keys) {
    const v = safeString(window.sessionStorage.getItem(k)).trim();
    if (v) return v;
  }

  return "";
}

function storeOwnerDeviceId(id: string) {
  if (typeof window === "undefined") return;
  if (!id) return;

  const keys = ["ownerDeviceId", "mvp_ownerDeviceId", "friplass_ownerDeviceId"];
  for (const k of keys) {
    try {
      window.localStorage.setItem(k, id);
    } catch {
      // ignore
    }
  }
}

function normalizeAddress(l: Listing) {
  return (
    safeString(l.locationText).trim() ||
    safeString(l.address).trim() ||
    safeString(l.location?.address).trim()
  );
}

function normalizePricePerNight(l: Listing) {
  const p1 = l?.price?.perNight;
  const p2 = (l as any)?.pricePerNight;
  const val = typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : null;
  return typeof val === "number" && Number.isFinite(val) ? val : null;
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

function EmptyState() {
  return (
    <div
      style={{
        marginTop: 18,
        padding: 18,
        border: "1px solid var(--border, #e5e7eb)",
        borderRadius: 16,
        background: "#fff",
        boxShadow: "var(--shadow-card, 0 10px 30px -25px rgba(0,0,0,.35))",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 10px",
          background: "rgba(59,108,255,0.10)",
          border: "1px solid rgba(59,108,255,0.25)",
          fontSize: 26,
        }}
      >
        📦
      </div>

      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
        Du har ingen annonser enda
      </div>

      <div style={{ color: "var(--muted, #64748b)", lineHeight: 1.45 }}>
        Lag din første annonse, så dukker den opp her.
      </div>

      <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
        <a
          href="/ny-annonse/steg-1"
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(59,108,255,0.35)",
            background: "rgba(59,108,255,0.10)",
            color: "var(--text, #0f172a)",
            fontWeight: 800,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Lei ut en plass <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}

export default function MineAnnonserPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading, 150);
  const [error, setError] = useState("");
  const [all, setAll] = useState<Listing[]>([]);
  const [busyId, setBusyId] = useState<string>("");

  const [ownerDeviceId, setOwnerDeviceId] = useState<string>("");

  // init ownerDeviceId fra storage
  useEffect(() => {
    setOwnerDeviceId(getOwnerDeviceIdFromStorage());
  }, []);

  // Fetch listings + adopter ownerDeviceId hvis vi ikke har den lagret
  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/listings", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data)
          ? data
          : Array.isArray(data?.listings)
          ? data.listings
          : [];

        if (!alive) return;
        setAll(arr);

        // ✅ adopter ownerDeviceId fra nyeste annonse hvis vi ikke har den lokalt
        const current = getOwnerDeviceIdFromStorage();
        if (!current && Array.isArray(arr) && arr.length) {
          const newestWithOwner = [...arr]
            .filter((x: any) => safeString(x?.ownerDeviceId).trim())
            .sort((a: any, b: any) => {
              const ta = Date.parse(safeString(a?.createdAt));
              const tb = Date.parse(safeString(b?.createdAt));
              const va = Number.isFinite(ta) ? ta : 0;
              const vb = Number.isFinite(tb) ? tb : 0;
              return vb - va;
            })[0];

          const adopted = safeString(newestWithOwner?.ownerDeviceId).trim();
          if (adopted) {
            storeOwnerDeviceId(adopted);
            setOwnerDeviceId(adopted);
          }
        }

        // DEBUG: logg hva vi har
        const missingOwner = arr.filter((x: any) => !safeString(x?.ownerDeviceId).trim()).length;
        const distinctOwners = Array.from(
          new Set(arr.map((x: any) => safeString(x?.ownerDeviceId).trim()).filter(Boolean))
        );
        console.log("[MINE] ownerDeviceId(local):", getOwnerDeviceIdFromStorage());
        console.log("[MINE] listings:", arr.length, "missing owner:", missingOwner, "owners:", distinctOwners);
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

  const mine = useMemo(() => {
    const myId = safeString(ownerDeviceId).trim();

    // ✅ Robust MVP-filter:
    // - Hvis vi har myId: ta både (match) og (mangler ownerDeviceId) (gamle annonser)
    // - Hvis vi ikke har myId: ta annonser som mangler ownerDeviceId (ellers 0)
    const filtered = all.filter((l) => {
      const o = safeString(l.ownerDeviceId).trim();
      if (!o) return true; // gamle annonser uten ownerDeviceId -> regn som "mine" i MVP
      if (!myId) return false;
      return o === myId;
    });

    const sorted = [...filtered].sort((a, b) => {
      const ta = Date.parse(safeString(a.createdAt));
      const tb = Date.parse(safeString(b.createdAt));
      const va = Number.isFinite(ta) ? ta : 0;
      const vb = Number.isFinite(tb) ? tb : 0;
      if (vb !== va) return vb - va;
      return safeString(b.id).localeCompare(safeString(a.id));
    });

    return sorted;
  }, [all, ownerDeviceId]);

  async function deleteListing(id: string) {
    if (!id) return;

    const ok = window.confirm("Slette annonsen? Dette kan ikke angres.");
    if (!ok) return;

    setBusyId(id);
    setError("");

    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setAll((prev) => prev.filter((x) => x.id !== id));
    } catch {
      setError("Kunne ikke slette annonsen. Prøv igjen.");
    } finally {
      setBusyId("");
    }
  }

  const skeletonCount = 6;

  function SkeletonGrid() {
    return (
      <div className="grid" aria-label="Laster dine annonser">
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
    <div className="page">
      <div className="top">
        <div>
          <div className="h1">Mine annonser</div>
          <div className="sub">Du ser bare annonser laget på denne enheten.</div>
        </div>

        <a className="newBtn" href="/ny-annonse/steg-1">
          Ny annonse <span aria-hidden>→</span>
        </a>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {loading && showSkeleton ? (
        <SkeletonGrid />
      ) : loading ? null : mine.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid" aria-label="Dine annonser">
          {mine.map((l) => {
            const addr = normalizeAddress(l);
            const price = normalizePricePerNight(l);

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
                  listing={{
                    ...l,
                    locationText: l.locationText ?? addr,
                    price:
                      l.price ??
                      (price != null ? { perNight: price, currency: "NOK" } : l.price),
                  } as any}
                  bottomSlot={
                    <div className="actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/rediger/${l.id}`);
                        }}
                      >
                        Rediger
                      </button>

                      <button
                        type="button"
                        className="btn danger"
                        disabled={busyId === l.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteListing(l.id);
                        }}
                      >
                        {busyId === l.id ? "Sletter..." : "Slett"}
                      </button>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page {
          padding: 14px 14px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .top {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .h1 {
          font-size: 22px;
          font-weight: 900;
        }

        .sub {
          margin-top: 4px;
          color: #64748b;
          font-weight: 600;
        }

        .newBtn {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(59, 108, 255, 0.35);
          background: rgba(59, 108, 255, 0.1);
          color: #0f172a;
          font-weight: 900;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
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

        .actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 10px;
        }

        .btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
        }

        .btn.danger {
          border-color: #fecaca;
          background: #fff1f2;
          color: #881337;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .error {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #881337;
          padding: 12px;
          border-radius: 12px;
          font-weight: 800;
          margin-bottom: 14px;
        }
      `}</style>
    </div>
  );
}
