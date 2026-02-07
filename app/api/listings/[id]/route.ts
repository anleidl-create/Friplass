import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type ListingImage = { url: string };

type Listing = {
  id: string;
  title: string;
  description: string;
  location?: { address?: string };
  price?: { perNight?: number; currency?: string };
  suitability?: string[];
  mainImageUrl?: string;
  images?: ListingImage[];
  createdAt?: string;
  updatedAt?: string;
};

function jsonPath() {
  return path.join(process.cwd(), "data", "listings.json");
}

async function readAll(): Promise<Listing[]> {
  const filePath = jsonPath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e: any) {
    // Hvis filen ikke finnes ennå
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(listings: Listing[]) {
  const filePath = jsonPath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(listings, null, 2), "utf8");
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const patch = (await req.json()) as Partial<Listing>;

  const all = await readAll();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const current = all[idx];

  // Behold id/createdAt, men oppdater alt annet
  const updated: Listing = {
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  // Litt hygiene:
  // - images alltid array hvis finnes
  if (updated.images && !Array.isArray(updated.images)) updated.images = [];

  // - mainImageUrl bør være en av bildene hvis mulig (valgfritt)
  //   (kan kommenteres ut hvis du vil ha frihet)
  if (updated.mainImageUrl && updated.images?.length) {
    const exists = updated.images.some((img) => img.url === updated.mainImageUrl);
    if (!exists) {
      updated.mainImageUrl = updated.images[0]?.url;
    }
  }

  all[idx] = updated;
  await writeAll(all);

  return NextResponse.json(updated, { status: 200 });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const all = await readAll();
  const before = all.length;
  const next = all.filter((l) => l.id !== id);

  if (next.length === before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeAll(next);
  return NextResponse.json({ ok: true }, { status: 200 });
}
