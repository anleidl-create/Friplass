"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { saveMvpDraft, type MvpDraft } from "../../../lib/new-listing/mvpStorage";

type ListingImage = { url: string };

type Listing = {
  id: string;
  title?: string;
  description?: string;

  locationText?: string;
  address?: string;
  location?: { address?: string };

  price?: { perNight?: number; currency?: string };
  pricePerNight?: number;

  images?: ListingImage[];
  mainImageUrl?: string;

  createdAt?: string;
  ownerDeviceId?: string;

  badges?: string[];
  suitability?: string[];

  category?: string;
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeAddress(l: Listing) {
  return (
    safeString(l.locationText).trim() ||
    safeString(l.address).trim() ||
    safeString(l.location?.address).trim()
  );
}

function normalizePricePerNight(l: Listing) {
  const p1 = l?.price?.perNight;
  const p2 = (l as any)?.pricePerNight;
  const val = typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : null;
  return typeof val === "number" && Number.isFinite(val) ? val : null;
}

function normalizeImages(l: Listing) {
  // Støtter både {url}[] og string[] (bare i tilfelle)
  const raw = (l as any)?.images;
  if (Array.isArray(raw)) {
    if (raw.length === 0) return [] as { url: string }[];
    if (typeof raw[0] === "string") return raw.map((x: string) => ({ url: x }));
    return raw
      .map((x: any) => ({ url: safeString(x?.url).trim() }))
      .filter((x: any) => x.url);
  }
  return [] as { url: string }[];
}

function normalizeBadges(l: Listing) {
  const b1 = Array.isArray(l.badges) ? l.badges : [];
  const b2 = Array.isArray(l.suitability) ? l.suitability : [];
  const set = new Set<string>();
  [...b1, ...b2].forEach((x) => {
    const s = safeString(x).trim();
    if (s) set.add(s);
  });
  return Array.from(set);
}

type ParamsShape = { id?: string };

export default function EditListingBootstrapPage({
  params,
}: {
  params: ParamsShape | Promise<ParamsShape>;
}) {
  const router = useRouter();

  // ✅ Next 15/16: params kan være Promise i client – unwrap med React.use()
  const unwrappedParams: ParamsShape =
    params && typeof (params as any)?.then === "function"
      ? use(params as Promise<ParamsShape>)
      : (params as ParamsShape);

  const id = safeString(unwrappedParams?.id).trim();

  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState("");

  const bootKey = useMemo(() => `edit_boot_${id}`, [id]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!id) {
        setStatus("error");
        setError("Mangler annonse-ID.");
        return;
      }

      // unngå dobbelt-boot ved HMR / strict mode
      if (typeof window !== "undefined") {
        const already = window.sessionStorage.getItem(bootKey);
        if (already === "1") {
          router.replace("/ny-annonse/steg-1");
          return;
        }
        window.sessionStorage.setItem(bootKey, "1");
      }

      setStatus("loading");
      setError("");

      try {
        const res = await fetch("/api/listings", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const arr: Listing[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.listings)
          ? data.listings
          : [];

        const found = arr.find((x) => safeString(x?.id) === id);

        if (!found) {
          if (!alive) return;
          setStatus("error");
          setError("Fant ikke annonsen. Den kan være slettet.");
          return;
        }

        const addr = normalizeAddress(found);
        const pricePerNight = normalizePricePerNight(found);
        const images = normalizeImages(found);
        const badges = normalizeBadges(found);

        // ✅ Map listing -> draft (minimalt, men robust)
        const draft: MvpDraft = {
          id: found.id,

          title: safeString(found.title),
          description: safeString(found.description),

          // category er viktig i steg-1
          category: safeString((found as any).category) as any,

          // adresse bakoverkompatibelt (dere har: locationText, address, location.address)
          locationText: addr,
          address: addr,
          location: { address: addr } as any,

          // pris bakoverkompatibelt
          price: {
            perNight: typeof pricePerNight === "number" ? pricePerNight : undefined,
            currency: "NOK",
          } as any,

          // bilder
          images: images as any,
          mainImageUrl: safeString((found as any).mainImageUrl) || images?.[0]?.url || "",

          // badges
          suitability: badges as any,

          // behold owner (ikke nødvendig, men greit)
          ownerDeviceId: safeString((found as any).ownerDeviceId),

          // behold createdAt (valgfritt)
          createdAt: safeString((found as any).createdAt),
        } as any;

        // ✅ Sett edit-mode + lagre draft
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("mvp_mode", "edit");
          window.sessionStorage.setItem("mvp_editingId", found.id);
        }

        saveMvpDraft(draft);

        if (!alive) return;
        router.replace("/ny-annonse/steg-1");
      } catch (e) {
        if (!alive) return;
        setStatus("error");
        setError("Kunne ikke laste annonsen for redigering. Prøv å oppdatere siden.");
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id, bootKey, router]);

  return (
    <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      {status === "loading" ? (
        <div style={{ fontWeight: 800 }}>Åpner redigering…</div>
      ) : (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#881337",
            padding: 12,
            borderRadius: 12,
            fontWeight: 800,
          }}
        >
          {error}
          <div style={{ marginTop: 10 }}>
            <a
              href="/mine-annonser"
              style={{
                display: "inline-block",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#0f172a",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Tilbake til Mine annonser →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
