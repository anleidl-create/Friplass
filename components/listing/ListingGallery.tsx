"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type Img = { url: string };

export default function ListingGallery({
  images,
  mainImageUrl,
  title,
}: {
  images?: Img[];
  mainImageUrl?: string;
  title?: string;
}) {
  const all = useMemo(() => {
    const urls = new Set<string>();

    const main = (mainImageUrl || "").trim();
    if (main) urls.add(main);

    (images || []).forEach((img) => {
      const u = (img?.url || "").trim();
      if (u) urls.add(u);
    });

    return Array.from(urls);
  }, [images, mainImageUrl]);

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  // ✅ Prod-safe: husk hvilke URLer som feiler (404/blocked)
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  // Når bildegalleriet endrer seg (ny listing), reset failures + active index
  useEffect(() => {
    setFailedUrls(new Set());
    setActive(0);
  }, [all.join("|")]);

  const hasMany = all.length > 1;
  const current = all[active] || all[0] || "";

  function markFailed(url: string) {
    if (!url) return;
    setFailedUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }

  const currentFailed = current ? failedUrls.has(current) : true;

  function prev() {
    if (!hasMany) return;
    setActive((i) => (i - 1 + all.length) % all.length);
  }

  function next() {
    if (!hasMany) return;
    setActive((i) => (i + 1) % all.length);
  }

  // ===== Swipe (mobil) via pointer events =====
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  function onPointerDown(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") return;
    startX.current = e.clientX;
    startY.current = e.clientY;
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (e.pointerType === "mouse") return;
    if (startX.current == null || startY.current == null) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    startX.current = null;
    startY.current = null;

    if (Math.abs(dy) > Math.abs(dx)) return;

    const TH = 35;
    if (dx > TH) prev();
    else if (dx < -TH) next();
  }

  // ===== Trackpad/wheel (web) for “bla” i fullskjerm =====
  const wheelLock = useRef<number>(0);

  function onWheelStage(e: React.WheelEvent<HTMLDivElement>) {
    if (!hasMany) return;

    const dx = Math.abs(e.deltaX);
    const dy = Math.abs(e.deltaY);

    const preferHorizontal = dx > dy || e.shiftKey;
    if (!preferHorizontal) return;

    e.preventDefault();

    const now = Date.now();
    if (now - wheelLock.current < 220) return;
    wheelLock.current = now;

    const dir = (e.deltaX !== 0 ? e.deltaX : e.deltaY) > 0 ? 1 : -1;
    if (dir > 0) next();
    else prev();
  }

  // Lås body scroll når modal er åpen
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Keyboard i modal
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight" && hasMany) setActive((i) => (i + 1) % all.length);
      if (e.key === "ArrowLeft" && hasMany) setActive((i) => (i - 1 + all.length) % all.length);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hasMany, all.length]);

  if (!all.length) {
    return (
      <div className="ph">
        <div className="box" />
        <style jsx>{`
          .ph .box {
            height: 320px;
            border-radius: 18px;
            border: 1px solid #e5e7eb;
            background: #f1f5f9;
          }
        `}</style>
      </div>
    );
  }

  function Placeholder({ kind }: { kind: "hero" | "full" | "thumb" }) {
    const isThumb = kind === "thumb";
    return (
      <div className={`phBox ${isThumb ? "thumb" : ""}`} aria-label="Ingen bilde">
        <span aria-hidden>🖼️</span>

        <style jsx>{`
          .phBox {
            width: 100%;
            height: ${kind === "hero" ? "360px" : kind === "full" ? "100%" : "100%"};
            display: grid;
            place-items: center;
            background: #f1f5f9;
            border: 1px solid #e5e7eb;
            border-radius: ${kind === "thumb" ? "14px" : "18px"};
            color: rgba(15, 23, 42, 0.35);
            font-size: ${kind === "thumb" ? "18px" : "26px"};
          }
          @media (max-width: 520px) {
            .phBox {
              height: ${kind === "hero" ? "280px" : kind === "full" ? "100%" : "100%"};
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="wrap">
      <button
        type="button"
        className="heroBtn"
        onClick={() => setOpen(true)}
        aria-label="Åpne bilde i fullskjerm"
      >
        {current && !currentFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="hero"
            src={current}
            alt={title || "Bilde"}
            onError={() => markFailed(current)}
          />
        ) : (
          <Placeholder kind="hero" />
        )}
      </button>

      {hasMany && (
        <div className="thumbs" aria-label="Bilder">
          {all.map((u, idx) => {
            const isBad = failedUrls.has(u);
            return (
              <button
                type="button"
                key={u + idx}
                className={`thumbBtn ${idx === active ? "on" : ""}`}
                onClick={() => setActive(idx)}
                aria-label={`Velg bilde ${idx + 1} av ${all.length}`}
              >
                {u && !isBad ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="thumb" src={u} alt="" onError={() => markFailed(u)} />
                ) : (
                  <Placeholder kind="thumb" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-label="Fullskjerm bilde"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <button className="close" type="button" onClick={() => setOpen(false)} aria-label="Lukk">
            ✕
          </button>

          {hasMany && (
            <>
              <button className="nav left" type="button" onClick={prev} aria-label="Forrige">
                ‹
              </button>
              <button className="nav right" type="button" onClick={next} aria-label="Neste">
                ›
              </button>
            </>
          )}

          <div
            className="stage"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onWheel={onWheelStage}
          >
            {current && !currentFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="full"
                src={current}
                alt={title || "Bilde"}
                onError={() => markFailed(current)}
              />
            ) : (
              <Placeholder kind="full" />
            )}

            {hasMany && (
              <div className="counter">
                {active + 1} / {all.length}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .wrap {
          display: grid;
          gap: 10px;
        }

        .heroBtn {
          padding: 0;
          border: 0;
          background: transparent;
          cursor: zoom-in;
          border-radius: 18px;
          overflow: hidden;
        }

        .hero {
          width: 100%;
          height: 360px;
          object-fit: cover;
          display: block;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
          background: #f1f5f9;
        }

        .thumbs {
          display: flex;
          gap: 10px;
          overflow: auto;
          padding-bottom: 2px;
        }

        .thumbBtn {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 14px;
          padding: 0;
          cursor: pointer;
          overflow: hidden;
          flex: 0 0 auto;
          width: 92px;
          height: 70px;
          display: grid;
        }

        .thumbBtn.on {
          border-color: rgba(59, 108, 255, 0.6);
          box-shadow: 0 12px 28px -24px rgba(59, 108, 255, 0.8);
        }

        .thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.86);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .stage {
          position: relative;
          width: 100%;
          max-width: 1200px;
          height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;

          touch-action: pan-y;
          user-select: none;
          -webkit-user-select: none;
        }

        .full {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 20px 60px -40px rgba(0, 0, 0, 0.9);
          background: rgba(255, 255, 255, 0.06);
        }

        .close {
          position: fixed;
          top: 14px;
          right: 14px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 18px;
        }

        .nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          width: 48px;
          height: 48px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .nav.left {
          left: 14px;
        }
        .nav.right {
          right: 14px;
        }

        .counter {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.9);
          font-weight: 700;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 6px 10px;
          border-radius: 999px;
        }

        @media (max-width: 520px) {
          .hero {
            height: 280px;
          }
          .thumbBtn {
            width: 82px;
            height: 62px;
          }
        }
      `}</style>
    </div>
  );
}
