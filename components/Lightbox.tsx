"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import LightboxFancy from "@/components/LightboxFancy";


type LightboxProps = {
  open: boolean;
  src: string;
  alt?: string;
  onClose: () => void;
};

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export default function Lightbox({ open, src, alt, onClose }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mounted = useMemo(() => typeof window !== "undefined", []);
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        // klikk utenfor bilde lukker
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.86)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Lukk"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 44,
          height: 44,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          cursor: "pointer",
          fontSize: 22,
          lineHeight: "44px",
        }}
      >
        ×
      </button>

      <img
        src={src}
        alt={alt ?? ""}
        style={{
          maxWidth: "min(1100px, 100%)",
          maxHeight: "min(84vh, 100%)",
          width: "auto",
          height: "auto",
          borderRadius: 14,
          boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
          userSelect: "none",
        }}
        draggable={false}
      />
    </div>,
    document.body
  );
}
