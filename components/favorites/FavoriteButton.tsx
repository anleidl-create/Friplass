"use client";

import { useEffect, useMemo, useState } from "react";

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
      if (Array.isArray(parsed))
        return new Set(parsed.map((x) => safeString(x)).filter(Boolean));
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

export default function FavoriteButton({
  listingId,
  size = 44,
}: {
  listingId: string;
  size?: number;
}) {
  const id = useMemo(() => safeString(listingId).trim(), [listingId]);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    const favs = readFavoriteIds();
    setIsFav(favs.has(id));
  }, [id]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key) return;
      if (!["favoritter", "favorites", "favourites"].includes(e.key)) return;
      const favs = readFavoriteIds();
      setIsFav(favs.has(id));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [id]);

  function toggle() {
    const favs = readFavoriteIds();
    if (favs.has(id)) favs.delete(id);
    else favs.add(id);
    writeFavoriteIds(favs);
    setIsFav(favs.has(id));
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-label={isFav ? "Fjern fra favoritter" : "Legg til favoritter"}
      title={isFav ? "Fjern fra favoritter" : "Legg til favoritter"}
      className={`fav ${isFav ? "on" : ""}`}
      style={{ width: size, height: size }}
    >
      {isFav ? "❤️" : "🤍"}

      <style jsx>{`
        .fav {
          border: 1px solid rgba(229, 231, 235, 0.95);
          background: rgba(255, 255, 255, 0.95);
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 22px;
          box-shadow: 0 10px 30px -25px rgba(0, 0, 0, 0.35);
          -webkit-tap-highlight-color: transparent;
        }
        .fav.on {
          border-color: rgba(59, 108, 255, 0.35);
        }
      `}</style>
    </button>
  );
}
