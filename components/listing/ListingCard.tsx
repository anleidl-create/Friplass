"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import BadgesRow from "./BadgesRow";

export type ListingImage = { url: string };

export type Listing = {
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

  // badges variants
  badges?: string[];
  suitability?: string[];
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getAddress(l: Listing) {
  return (
    safeString(l.location?.address).trim() ||
    safeString(l.locationText).trim() ||
    safeString(l.address).trim() ||
    ""
  );
}

function getPrice(l: Listing): { perNight: number; currency: string } | null {
  const p1 = l?.price?.perNight;
  const p2 = (l as any)?.pricePerNight;

  const perNight = typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : null;
  if (typeof perNight !== "number" || !Number.isFinite(perNight)) return null;

  const currency = safeString(l?.price?.currency).trim() || "NOK";
  return { perNight, currency };
}

function getMainImageUrl(l: Listing) {
  const main = safeString(l.mainImageUrl).trim();
  if (main) return main;

  const imgs = Array.isArray(l.images) ? l.images : [];
  const first = safeString(imgs?.[0]?.url).trim();
  return first || "";
}

function getBadges(l: Listing) {
  const b1 = Array.isArray(l.badges) ? l.badges : [];
  const b2 = Array.isArray(l.suitability) ? l.suitability : [];
  const set = new Set<string>();

  [...b1, ...b2].forEach((x) => {
    const s = safeString(x).trim();
    if (s) set.add(s);
  });

  return Array.from(set).slice(0, 3);
}

export default function ListingCard({
  listing,
  rightSlot,
  bottomSlot,
  onAddressClick,
}: {
  listing: Listing;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
  onAddressClick?: (address: string) => void;
}) {
  const title = safeString(listing.title).trim() || "Uten tittel";
  const address = getAddress(listing);
  const price = getPrice(listing);
  const badges = getBadges(listing);

  const rawImg = getMainImageUrl(listing);
  const img = useMemo(() => safeString(rawImg).trim(), [rawImg]);

  // ✅ hvis bilde-url er død i prod, unngå “broken image”
  const [imgBroken, setImgBroken] = useState(false);
  const showImage = Boolean(img) && !imgBroken;

  return (
    <article className="card">
      <div className="media">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="img"
            src={img}
            alt={title}
            loading="lazy"
            onError={() => setImgBroken(true)}
          />
        ) : (
          <div className="imgPlaceholder" aria-label="Ingen bilde">
            <span className="phText">Ingen bilde (beta)</span>
          </div>
        )}

        {rightSlot ? <div className="rightSlot">{rightSlot}</div> : null}
      </div>

      <div className="body">
        <div className="line1">
          <div className="title" title={title}>
            {title}
          </div>

          {address ? (
            onAddressClick ? (
              <button
                type="button"
                className="addressBtn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddressClick(address);
                }}
                aria-label={`Søk etter ${address}`}
                title={`Søk etter ${address}`}
              >
                {address}
              </button>
            ) : (
              <div className="address" title={address}>
                {address}
              </div>
            )
          ) : (
            <div />
          )}
        </div>

        {price ? (
          <div className="price">
            {price.perNight} {price.currency}
            <span className="per"> / natt</span>
          </div>
        ) : null}

        {badges.length > 0 ? (
          <div className="badges">
            <BadgesRow keys={badges} />
          </div>
        ) : null}

        {bottomSlot ? <div className="bottomSlot">{bottomSlot}</div> : null}
      </div>

      <style jsx>{`
        .card {
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: var(--shadow-card, 0 10px 30px -25px rgba(0, 0, 0, 0.35));
        }

        .media {
          position: relative;
          background: #f1f5f9;
        }

        .img {
          width: 100%;
          height: 170px;
          display: block;
          object-fit: cover;
        }

        .imgPlaceholder {
          width: 100%;
          height: 170px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        }

        .phText {
          font-weight: 800;
          font-size: 13px;
          color: #64748b;
          letter-spacing: 0.2px;
        }

        .rightSlot {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 5;
        }

        .body {
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .line1 {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: baseline;
        }

        .title {
          font-weight: 900;
          font-size: 16px;
          color: var(--text, #0f172a);
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .address {
          font-weight: 700;
          color: var(--muted, #64748b);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }

        .addressBtn {
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          font: inherit;
          font-weight: 700;
          color: var(--muted, #64748b);
          cursor: pointer;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .addressBtn:hover {
          text-decoration: underline;
        }

        .price {
          font-weight: 900;
          font-size: 15px;
          color: var(--text, #0f172a);
        }

        .per {
          font-weight: 700;
          color: var(--muted, #64748b);
        }

        .badges {
          margin-top: 2px;
        }

        .bottomSlot {
          margin-top: 2px;
        }

        @media (max-width: 520px) {
          .img,
          .imgPlaceholder {
            height: 150px;
          }

          .line1 {
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .title {
            white-space: normal;
          }

          .address,
          .addressBtn {
            max-width: none;
            white-space: normal;
            word-break: break-word;
            text-align: left;
          }
        }
      `}</style>
    </article>
  );
}
