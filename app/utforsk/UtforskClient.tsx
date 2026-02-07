"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Toast from "../../components/ui/Toast";

import ListingCard from "../../components/listing/ListingCard";
import ListingCardSkeleton from "../../components/listing/ListingCardSkeleton";

function EmptyState({
  title,
  subtitle,
  onReset,
  ctaHref,
  ctaText,
}: {
  title: string;
  subtitle?: string;
  onReset?: () => void;
  ctaHref?: string;
  ctaText?: string;
}) {
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
        https://friplass.no/utforsk

https://www.friplass.no/utforsk
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
        🔎
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>

      {subtitle ? (
        <div style={{ color: "var(--muted, #64748b)", lineHeight: 1.45 }}>
          {subtitle}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid var(--border, #e5e7eb)",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Nullstill filtre
          </button>
        ) : null}

        {ctaHref && ctaText ? (
          <a
            href={ctaHref}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(59,108,255,0.35)",
              background: "rgba(59,108,255,0.10)",
              color: "var(--text, #0f172a)",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {ctaText} <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </div>
  );
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

type ListingImage = { url: string };

type Listing = {
  id: string;
  title?: string;
  description?: string;

  // location variants
  locationText?: string;
  address?: string;
  location?: { address?: string };

  // price variants
  price?: { perNight?: number; currency?: string };
  pricePerNight?: number;

  // images variants
  images?: ListingImage[];
  mainImageUrl?: string;

  // misc
  createdAt?: string;
  ownerDeviceId?: string;

  // badges variants
  badges?: string[];
  suitability?: string[];

  // category
  category?: string;
};

type CategoryFilter = "alle" | "batplass" | "bobilplass" | "campingplass";
type SortMode = "newest" | "price_asc" | "price_desc";

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

// Robust normalisering for søk (tåler å/ø/æ og store/små bokstaver)
function norm(v: any) {
  return safeString(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(l: Listing) {
  return (
    safeString(l.locationText).trim() ||
    safeString(l.address).trim() ||
    safeString(l.location?.address).trim()
  );
}

function normalizeBadges(l: Listing) {
  const b1 = Array.isArray(l.badges) ? l.badges : [];
  const b2 = Array.isArray(l.suitability) ? l.suitability : [];
  const set = new Set<string>();
  [...b1, ...b2].forEach((x) => {
    const s = safeString(x).trim();
    if (s) set.add(s);
  });
  return Array.from(set);
}

function normalizePricePerNight(l: Listing) {
  const p1 = l?.price?.perNight;
  const p2 = (l as any)?.pricePerNight;
  const val = typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : null;
  return typeof val === "number" && Number.isFinite(val) ? val : null;
}

function inferCategoryFromText(l: Listing): CategoryFilter {
  const text = norm(
    `${safeString(l.title)} ${safeString(l.description)} ${normalizeAddress(l)}`
  );

  if (
    text.includes("bat") ||
    text.includes("batplass") ||
    text.includes("brygge") ||
    text.includes("kai") ||
    text.includes("marina") ||
    text.includes("brygg") ||
    text.includes("naust") ||
    text.includes("bathavn")
  )
    return "batplass";

  if (
    text.includes("bobil") ||
    text.includes("camper") ||
    text.includes("motorhome")
  )
    return "bobilplass";

  if (
    text.includes("camping") ||
    text.includes("campingvogn") ||
    text.includes("telt") ||
    text.includes("teltplass") ||
    text.includes("hengekoye") ||
    text.includes("hammock")
  )
    return "campingplass";

  return "alle";
}

function toDisplayCategory(l: Listing): CategoryFilter {
  const cat = norm((l as any).category);
  if (cat === "batplass" || cat === "båtplass") return "batplass";
  if (cat === "bobilplass") return "bobilplass";
  if (cat === "campingplass" || cat === "campingvogn" || cat === "teltplass")
    return "campingplass";
  return inferCategoryFromText(l);
}

function categoryLabel(c: CategoryFilter) {
  if (c === "alle") return "Alle";
  if (c === "batplass") return "Båtplass";
  if (c === "bobilplass") return "Bobilplass";
  return "Campingplass";
}

function readFavoriteIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const keys = ["favoritter", "favorites", "favourites"];
  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return new Set(parsed.map((x) => safeString(x)).filter(Boolean));
      if (
        parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as any).ids)
      )
        return new Set(
          (parsed as any).ids.map((x: any) => safeString(x)).filter(Boolean)
        );
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

export default function UtforskClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const urlCategory = (searchParams.get("category") || "").toLowerCase();
  const urlQ = searchParams.get("q") || "";
  const urlSort = (searchParams.get("sort") || "") as SortMode | "";
  const urlFav = (searchParams.get("favorites") || "").toLowerCase();

  const [loading, setLoading] = useState(true);
  const showSkeleton = useDelayedLoading(loading, 150);
  const [error, setError] = useState("");

  const [all, setAll] = useState<Listing[]>([]);

  const [category, setCategory] = useState<CategoryFilter>("alle");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");
  const [onlyFav, setOnlyFav] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // ✅ Toast
  const [toastOpen, setToastOpen] = useState(false);

  function showResetToast() {
    setToastOpen(false);
    requestAnimationFrame(() => setToastOpen(true));
  }

  function hadAnyFiltersOn() {
    return Boolean(
      (query || "").trim() || category !== "alle" || sort !== "newest" || onlyFav
    );
  }

  // Init favorites once
  useEffect(() => {
    setFavoriteIds(readFavoriteIds());
  }, []);

  // URL -> state (category)
  useEffect(() => {
    const normalized =
      urlCategory === "batplass" || urlCategory === "båtplass"
        ? "batplass"
        : urlCategory === "bobilplass"
        ? "bobilplass"
        : urlCategory === "campingplass"
        ? "campingplass"
        : urlCategory === ""
        ? "alle"
        : "alle";

    setCategory(normalized as CategoryFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory]);

  // URL -> state (onlyFav)
  useEffect(() => {
    const on =
      urlFav === "1" || urlFav === "true" || urlFav === "yes" || urlFav === "on";
    setOnlyFav(on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFav]);

  // URL -> state (q)
  useEffect(() => {
    setQuery(urlQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQ]);

  // URL -> state (sort)
  useEffect(() => {
    if (urlSort === "price_asc" || urlSort === "price_desc" || urlSort === "newest") {
      setSort(urlSort);
    } else if (urlSort === "") {
      setSort("newest");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSort]);

  function pushUrl(next: {
    category?: CategoryFilter;
    q?: string;
    sort?: SortMode;
    favorites?: boolean;
  }) {
    const sp = new URLSearchParams(searchParams.toString());

    const cat = next.category ?? category;
    if (cat === "alle") sp.delete("category");
    else sp.set("category", cat);

    const q = (next.q ?? query).trim();
    if (!q) sp.delete("q");
    else sp.set("q", q);

    const s = next.sort ?? sort;
    if (s === "newest") sp.delete("sort");
    else sp.set("sort", s);

    const fav = next.favorites ?? onlyFav;
    if (fav) sp.set("favorites", "1");
    else sp.delete("favorites");

    const qs = sp.toString();
    router.push(qs ? `/utforsk?${qs}` : "/utforsk");
  }

  function setCategoryAndSync(next: CategoryFilter) {
    setCategory(next);
    pushUrl({ category: next });
  }

  function toggleFav(id: string) {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeFavoriteIds(next);
      return next;
    });
  }

  function resetAll() {
    const shouldToast = hadAnyFiltersOn();

    setCategory("alle");
    setQuery("");
    setSort("newest");
    setOnlyFav(false);
    router.push("/utforsk");

    if (shouldToast) showResetToast();
  }

  // Fetch listings
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

  const filtered = useMemo(() => {
    const qn = norm(query);

    const enriched = all.map((l) => {
      const addr = normalizeAddress(l);
      const badges = normalizeBadges(l);
      const cat = toDisplayCategory(l);
      const price = normalizePricePerNight(l);
      const createdAt = safeString(l.createdAt);
      return { l, addr, badges, cat, price, createdAt };
    });

    let out = enriched.filter((x) => category === "alle" || x.cat === category);

    if (onlyFav) out = out.filter((x) => favoriteIds.has(x.l.id));

    if (qn) {
      const boatSearchTerms = [
        "brygge",
        "brygga",
        "kai",
        "marina",
        "flytebrygge",
        "bathavn",
      ];
      const isBoatQuery = boatSearchTerms.some((w) => qn.includes(norm(w)));

      out = out.filter((x) => {
        const hay = [
          x.l.title,
          x.l.description,
          x.addr,
          x.badges.join(" "),
          (x.l as any).category,
        ]
          .map(norm)
          .join(" ");

        if (hay.includes(qn)) return true;
        if (isBoatQuery && x.cat === "batplass") return true;

        return false;
      });
    }

    const sorted = [...out].sort((a, b) => {
      if (sort === "newest") {
        const ta = Date.parse(a.createdAt || "");
        const tb = Date.parse(b.createdAt || "");
        const va = Number.isFinite(ta) ? ta : 0;
        const vb = Number.isFinite(tb) ? tb : 0;
        if (vb !== va) return vb - va;
        return safeString(b.l.id).localeCompare(safeString(a.l.id));
      }

      const pa = a.price;
      const pb = b.price;

      const aHas = typeof pa === "number";
      const bHas = typeof pb === "number";

      if (!aHas && !bHas) return 0;
      if (!aHas) return 1;
      if (!bHas) return -1;

      if (sort === "price_asc") return (pa as number) - (pb as number);
      return (pb as number) - (pa as number);
    });

    return sorted.map((x) => x.l);
  }, [all, category, onlyFav, favoriteIds, query, sort]);

  const skeletonCount = 8;

  function SkeletonGrid() {
    return (
      <div className="grid" aria-label="Laster annonser">
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

  // Tom-state tekst/CTA avhengig av om "Kun favoritter" er på
  const emptyTitle = onlyFav
    ? "Ingen favoritter enda"
    : "Ingen treff med disse filtrene";
  const emptySubtitle = onlyFav
    ? "Trykk ❤️ på en annonse i Utforsk for å lagre den her."
    : "Prøv å endre kategori, søk eller fjern favorittfilter.";
  const emptyCtaHref = onlyFav ? "/utforsk" : "/ny-annonse/steg-1";
  const emptyCtaText = onlyFav ? "Gå til Utforsk" : "Lei ut en plass";

  return (
    <div className="page">
      <div className="stickyBar">
        <div className="filters">
          <div className="chipsWrap" role="tablist" aria-label="Kategori">
            <div className="chips">
              {(
                ["alle", "batplass", "bobilplass", "campingplass"] as CategoryFilter[]
              ).map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    className={`chip ${active ? "active" : ""}`}
                    onClick={() => setCategoryAndSync(c)}
                    type="button"
                  >
                    {categoryLabel(c)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="right">
            <input
              className="search"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                pushUrl({ q: v });
              }}
              placeholder="Søk (tittel, sted, badges...)"
              aria-label="Søk"
            />

            <select
              className="select"
              value={sort}
              onChange={(e) => {
                const v = e.target.value as SortMode;
                setSort(v);
                pushUrl({ sort: v });
              }}
              aria-label="Sortering"
            >
              <option value="newest">Standard (nyeste)</option>
              <option value="price_asc">Pris: lav → høy</option>
              <option value="price_desc">Pris: høy → lav</option>
            </select>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={onlyFav}
                onChange={(e) => {
                  const v = e.target.checked;
                  setOnlyFav(v);
                  pushUrl({ favorites: v });
                }}
              />
              Kun favoritter
            </label>

            <button className="reset" onClick={resetAll} type="button">
              Nullstill filtre
            </button>
          </div>
        </div>
      </div>

      <div className="content">
        {error ? (
          <div className="error">{error}</div>
        ) : loading && showSkeleton ? (
          <SkeletonGrid />
        ) : loading ? null : filtered.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle}
            onReset={resetAll}
            ctaHref={emptyCtaHref}
            ctaText={emptyCtaText}
          />
        ) : (
          <div className="grid" aria-label="Annonser">
            {filtered.map((l) => {
              const isFav = favoriteIds.has(l.id);

              return (
                <div
                  key={l.id}
                  className="cardWrap"
                  role="link"
                  tabIndex={0}
                  onClick={(e) => {
                    const el = e.target as HTMLElement | null;
                    if (el?.closest("button, a, input, select, textarea, label"))
                      return;
                    router.push(`/annonse/${l.id}`);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      router.push(`/annonse/${l.id}`);
                  }}
                >
                  <ListingCard
                    listing={l as any}
                    onAddressClick={(addr: string) => {
                      setQuery(addr);
                      pushUrl({ q: addr });
                    }}
                    rightSlot={
                      <button
                        className={`heart ${isFav ? "on" : ""}`}
                        type="button"
                        aria-label={
                          isFav ? "Fjern fra favoritter" : "Legg til favoritter"
                        }
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
      </div>

      {/* ✅ Toast */}
      <Toast
        open={toastOpen}
        message="Filtre nullstilt"
        onClose={() => setToastOpen(false)}
      />

      <style jsx>{`
        .page {
          padding: 14px 14px 40px;
        }

        .stickyBar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e5e7eb;
          margin: -14px -14px 14px;
          padding: 12px 14px;
        }

        .filters {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        /* ✅ Mobilvennlig chips: horisontal scroll + snap */
        .chipsWrap {
          max-width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .chipsWrap::-webkit-scrollbar {
          display: none;
        }

        .chips {
          display: inline-flex;
          gap: 8px;
          padding-bottom: 2px;
          white-space: nowrap;

          scroll-snap-type: x mandatory;
        }
        .chip {
          flex: 0 0 auto;
          scroll-snap-align: start;

          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 600;
          cursor: pointer;
        }
        .chip.active {
          border-color: #3b6cff;
          box-shadow: 0 10px 30px -25px rgba(59, 108, 255, 0.6);
        }

        /* ✅ StickyBar mobil-polish: grid i stedet for wrap-kaos */
        .right {
          display: grid;
          grid-template-columns: 1fr auto auto auto;
          gap: 10px;
          align-items: center;
          justify-content: end;
        }

        .search {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          min-width: 260px;
          outline: none;
        }

        .select {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          outline: none;
          background: #fff;
        }

        .checkbox {
          display: inline-flex;
          gap: 8px;
          align-items: center;
          font-weight: 600;
          color: #0f172a;
          user-select: none;
          white-space: nowrap;
        }

        .reset {
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ✅ Mobil: søk på egen rad, resten i 2 kolonner */
        @media (max-width: 720px) {
          .right {
            grid-template-columns: 1fr 1fr;
            justify-content: stretch;
          }
          .search {
            grid-column: 1 / -1;
            width: 100%;
            min-width: 0;
          }
          .select {
            width: 100%;
          }
          .reset {
            width: 100%;
          }
        }

        .content {
          max-width: 1200px;
          margin: 0 auto;
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

        .heart {
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
        .heart.on {
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
      `}</style>
    </div>
  );
}
