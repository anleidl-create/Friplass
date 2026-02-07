// components/listing/BadgesRow.tsx
import type { CSSProperties } from "react";

// Hvis @ er rødt hos deg, bytt til: ../../lib/new-listing/badges
import { BADGES } from "@/lib/new-listing/badges";

type Props = {
  keys?: string[];
  max?: number;
  compact?: boolean;
};

export default function BadgesRow({ keys = [], max = 99, compact = false }: Props) {
  const list = (keys ?? [])
    .filter(Boolean)
    .map((k) => String(k).trim())
    .filter((k) => k.length > 0);

  if (list.length === 0) return null;

  const metaByKey = new Map<string, any>((BADGES as any[]).map((b) => [b.key, b]));
  const shown = list.slice(0, max);
  const rest = list.length - shown.length;

  const pillStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: compact ? "4px 8px" : "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "#fff",
    fontSize: compact ? 12 : 13,
    color: "var(--text)",
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  const wrapStyle: CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  };

  return (
    <div style={wrapStyle}>
      {shown.map((k) => {
        const meta = metaByKey.get(k);
        const label = meta?.label ?? k;
        return (
          <span key={k} style={pillStyle} title={k}>
            {label}
          </span>
        );
      })}

      {rest > 0 && (
        <span style={{ ...pillStyle, opacity: 0.75 }} title="Flere egenskaper">
          +{rest}
        </span>
      )}
    </div>
  );
}
