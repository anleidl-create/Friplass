"use client";

import { useEffect, useState } from "react";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

type Props = {
  listingId: string;
  size?: number;          // px (ikonstørrelse-ish)
  showText?: boolean;     // valgfritt "Lagre"/"Lagret"
  className?: string;
};

export default function FavoriteButton({
  listingId,
  size = 34,
  showText = false,
  className,
}: Props) {
  const [fav, setFav] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Les favorittstatus etter mount (localStorage finnes bare i browser)
  useEffect(() => {
    setMounted(true);
    setFav(isFavorite(listingId));

    const onChange = () => setFav(isFavorite(listingId));
    window.addEventListener("favorites:changed", onChange);
    window.addEventListener("storage", onChange); // hvis flere tabs
    return () => {
      window.removeEventListener("favorites:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [listingId]);

  function onClick(e: React.MouseEvent) {
    e.preventDefault(); // viktig hvis knappen ligger inne i en <Link>
    e.stopPropagation();

    const next = toggleFavorite(listingId);
    setFav(next);
  }

  // Unngå mismatch på server/client
  if (!mounted) return null;

  const label = fav ? "Lagret" : "Lagre";
  const aria = fav ? "Fjern fra favoritter" : "Legg til i favoritter";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      title={aria}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
        userSelect: "none",
        border: "1px solid rgba(0,0,0,0.12)",
        background: "white",
        borderRadius: 999,
        padding: showText ? "8px 12px" : 0,
        width: showText ? "auto" : size,
        height: size,
        justifyContent: "center",
        boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: Math.round(size * 0.55),
          lineHeight: 1,
          transform: "translateY(1px)",
        }}
      >
        {fav ? "❤️" : "🤍"}
      </span>

      {showText && (
        <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      )}
    </button>
  );
}
