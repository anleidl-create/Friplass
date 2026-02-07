"use client";

import React from "react";

export function DraftSavedBadge({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <span
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        background: "#e9f7ef",
        border: "1px solid #b7e1c6",
        color: "#176a37",
        fontSize: 13,
      }}
    >
      Utkast lagret ✓
    </span>
  );
}
