"use client";

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

type LightboxFancyProps = {
  open: boolean;
  images: { url: string; alt?: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
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

export default function LightboxFancy({
  open,
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: LightboxFancyProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mounted = useMemo(() => typeof window !== "undefined", []);
  useLockBodyScroll(open);

  // Tastatur
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, onPrev, onNext]);

  // Swipe (touch)
  useEffect(() => {
    if (!open) return;
    let startX = 0;
    let startY = 0;
    let active = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      active = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      // horisontal swipe prioriteres
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx > 0) onPrev();
        else onNext();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, onPrev, onNext]);

  // Enkel prefetch (nabo-bilder)
  useEffect(() => {
    if (!open) return;
    const prev = images[(index - 1 + images.length) % images.length]?.url;
    const next = images[(index + 1) % images.length]?.url;
    [prev, next].forEach((u) => {
      if (!u) return;
      const img = new Image();
      img.src = u;
    });
  }, [open, images, index]);

  if (!mounted || !open || images.length === 0) return null;

  const current = images[index];

  const IconButton = ({
    label,
    onClick,
    children,
    style,
  }: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 46,
        height: 46,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.22)",
        background: "rgba(0,0,0,0.35)",
        color: "white",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        ...style,
      }}
    >
      {children}
    </button>
  );

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 9999,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
      }}
    >
      {/* Topbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 12px",
          color: "rgba(255,255,255,0.9)",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.85 }}>
          {index + 1} / {images.length}
        </div>

        <IconButton label="Lukk" onClick={onClose}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>×</span>
        </IconButton>
      </div>

      {/* Canvas */}
      <div
        style={{
          position: "relative",
          display: "grid",
          placeItems: "center",
          padding: 16,
        }}
      >
        <IconButton
          label="Forrige bilde"
          onClick={onPrev}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <span style={{ fontSize: 22 }}>‹</span>
        </IconButton>

        <img
          src={current.url}
          alt={current.alt ?? ""}
          style={{
            maxWidth: "min(1180px, 100%)",
            maxHeight: "min(82vh, 100%)",
            borderRadius: 14,
            boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
            userSelect: "none",
          }}
          draggable={false}
        />

        <IconButton
          label="Neste bilde"
          onClick={onNext}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <span style={{ fontSize: 22 }}>›</span>
        </IconButton>
      </div>

      {/* Hint */}
      <div
        style={{
          padding: "10px 16px 16px",
          textAlign: "center",
          color: "rgba(255,255,255,0.65)",
          fontSize: 13,
        }}
      >
        Tips: bruk ← → på tastatur, eller swipe på mobil.
      </div>
    </div>,
    document.body
  );
}
