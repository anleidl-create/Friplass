// app/annonse/[id]/page.tsx
import { notFound } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import BadgesRow from "../../../components/listing/BadgesRow";
import ListingGallery from "../../../components/listing/ListingGallery";
import FavoriteButton from "../../../components/favorites/FavoriteButton";


export const runtime = "nodejs";

type ListingImage = { url: string };

type Listing = {
  id: string;
  title: string;
  category?: string;
  description?: string;

  location?: { address?: string };
  locationText?: string;
  address?: string;

  price?: { perNight?: number; currency?: string };
  pricePerNight?: number;

  images?: ListingImage[];
  mainImageUrl?: string;

  suitability?: string[];
  createdAt?: string;
};

async function readListings(): Promise<Listing[]> {
  const filePath = path.join(process.cwd(), "data", "listings.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Listing[]) : [];
  } catch {
    return [];
  }
}

function getAddress(l: Listing) {
  return l.location?.address || l.locationText || l.address || "";
}

function getPriceText(l: Listing) {
  const perNight =
    (typeof l.price?.perNight === "number" ? l.price.perNight : undefined) ??
    (typeof l.pricePerNight === "number" ? l.pricePerNight : undefined);

  if (typeof perNight !== "number") return "";
  const currency = l.price?.currency || "NOK";
  return `${perNight} ${currency} / natt`;
}

function getGalleryImages(l: Listing): ListingImage[] {
  const imgs = Array.isArray(l.images) ? l.images : [];
  const urls = imgs.map((x) => x?.url).filter(Boolean) as string[];

  if (l.mainImageUrl && !urls.includes(l.mainImageUrl)) urls.unshift(l.mainImageUrl);

  return urls.map((u) => ({ url: u }));
}

export default async function ListingPage({
  params,
}: {
  // ✅ Next kan gi params som Promise i noen versjoner / setups
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved =
    typeof (params as any)?.then === "function"
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string });

  const id = resolved.id;

  const listings = await readListings();
  const listing = listings.find((x) => x.id === id);

  if (!listing) return notFound();

  const address = getAddress(listing);
  const priceText = getPriceText(listing);
  const galleryImages = getGalleryImages(listing);

  return (
    <main style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>{listing.title}</h1>

        {address ? <div style={{ color: "var(--muted)" }}>{address}</div> : null}
        {priceText ? <div style={{ fontWeight: 700 }}>{priceText}</div> : null}

        {Array.isArray(listing.suitability) && listing.suitability.length > 0 ? (
          <div style={{ marginTop: 6 }}>
            <BadgesRow keys={listing.suitability} />
          </div>
        ) : null}

        {/* ✅ Galleri med ❤️ overlay */}
        <div style={{ marginTop: 10, position: "relative" }}>
          <div style={{ position: "absolute", top: 14, right: 14, zIndex: 20 }}>
            <FavoriteButton listingId={listing.id} />
          </div>

          <ListingGallery
            images={galleryImages}
            mainImageUrl={listing.mainImageUrl}
            title={listing.title}
          />
        </div>

        {listing.description ? (
          <div style={{ marginTop: 10, lineHeight: 1.6 }}>{listing.description}</div>
        ) : null}
      </div>
    </main>
  );
}
