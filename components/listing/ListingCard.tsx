"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
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

  const perNight =
    typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : null;

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
  const img = getMainImageUrl(listing);
  const badges = getBadges(listing);

  // ✅ Prod-safe: hvis bildet 404'er, vis placeholder
  const [imgFailed, setImgFailed] = useState(false);

  // Når annonsens bilde endrer seg, reset failed-flagget
  useEffect(() => {
    setImgFailed(false);
  }, [img]);

  return (
    <article className="card">
      <div className="media">
        {img && !imgFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="img"
            src={img}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="imgPlaceholder" aria-label="Ingen bilde" />
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
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: var(--shadow-card);
        }

        .media {
          position: relative;
          background: #f1f5f9;
        }

        .img,
        .imgPlaceholder {
          width: 100%;
          height: 170px;
          display: block;
          object-fit: cover;
        }

        .imgPlaceholder {
          background: #f1f5f9;
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
          color: var(--text);
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .address {
          font-weight: 700;
          color: var(--muted);
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
          color: var(--muted);
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
          color: var(--text);
        }

        .per {
          font-weight: 700;
          color: var(--muted);
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
