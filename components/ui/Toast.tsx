"use client";

import { useEffect } from "react";

type ToastProps = {
  open: boolean;
  message: string;
  durationMs?: number;
  onClose: () => void;
};

export default function Toast({
  open,
  message,
  durationMs = 1800,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => onClose(), durationMs);
    return () => window.clearTimeout(t);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div style={wrap}>
      <div style={toast} role="status" aria-live="polite">
        {message}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 18,
  display: "flex",
  justifyContent: "center",
  zIndex: 9999,
  pointerEvents: "none",
};

const toast: React.CSSProperties = {
  pointerEvents: "auto",
  background: "rgba(15, 23, 42, 0.92)", // slate-ish
  color: "#fff",
  padding: "10px 12px",
  borderRadius: 999,
  fontSize: 14,
  lineHeight: "18px",
  maxWidth: "92vw",
  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
};
