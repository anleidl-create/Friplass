"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const FAVORITES_KEY = "friplass_favorites_v1";

function readFavoriteCount(): number {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function Header() {
  const [favCount, setFavCount] = useState(0);

  useEffect(() => {
    setFavCount(readFavoriteCount());

    function onStorage(e: StorageEvent) {
      if (e.key === FAVORITES_KEY) {
        setFavCount(readFavoriteCount());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const iconBtn: React.CSSProperties = {
    position: "relative",
    minWidth: 40,
    minHeight: 40,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    color: "inherit",
    background: "white",
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Logo / tittel */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Friplass
        </Link>

        {/* Actions */}
        <nav style={{ display: "flex", gap: 10 }}>
          {/* Utforsk */}
          <Link href="/utforsk" style={iconBtn} aria-label="Utforsk" title="Utforsk">
            🔎
          </Link>

          {/* Favoritter */}
          <Link
            href="/favoritter"
            style={iconBtn}
            aria-label="Favoritter"
            title="Favoritter"
          >
            ❤️
            {favCount > 0 ? (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "black",
                  color: "white",
                  borderRadius: 999,
                  fontSize: 11,
                  padding: "2px 6px",
                  lineHeight: 1,
                }}
              >
                {favCount}
              </span>
            ) : null}
          </Link>

          {/* Mine annonser */}
          <Link
            href="/mine-annonser"
            style={iconBtn}
            aria-label="Mine annonser"
            title="Mine annonser"
          >
            🧑‍💻
          </Link>
        </nav>
      </div>
    </header>
  );
}
