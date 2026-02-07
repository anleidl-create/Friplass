export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

const DATA_PATH = path.join(process.cwd(), "data", "listings.json");

type AnyObj = Record<string, any>;

async function readAll(): Promise<any[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(listings: any[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(listings, null, 2), "utf8");
}

function asString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function normalizeAddressFields(draft: AnyObj) {
  const a =
    asString(draft?.locationText).trim() ||
    asString(draft?.address).trim() ||
    asString(draft?.location?.address).trim() ||
    "";

  return {
    locationText: a,
    address: a,
    location: { ...(draft.location || {}), address: a },
  };
}

function normalizeImages(draft: AnyObj): { images: { url: string }[]; mainImageUrl?: string } {
  const raw = draft?.images;
  let urls: string[] = [];

  if (Array.isArray(raw)) {
    urls = raw
      .map((x: any) => (typeof x === "string" ? x : x?.url))
      .map((x: any) => asString(x).trim())
      .filter(Boolean);
  }

  const main = asString(draft?.mainImageUrl).trim();
  if (main && !urls.includes(main)) urls.unshift(main);

  const images = urls.map((u) => ({ url: u }));
  const mainImageUrl = images[0]?.url;

  return { images, mainImageUrl };
}

function normalizePrice(draft: AnyObj) {
  const p1 = draft?.price?.perNight;
  const p2 = draft?.pricePerNight;

  const perNight = typeof p1 === "number" ? p1 : typeof p2 === "number" ? p2 : undefined;
  const currency = asString(draft?.price?.currency).trim() || "NOK";

  if (typeof perNight !== "number") {
    return { price: draft?.price, pricePerNight: draft?.pricePerNight };
  }

  return {
    price: { perNight, currency },
    pricePerNight: perNight,
  };
}

function validateDraft(draft: AnyObj) {
  const problems: string[] = [];
  const title = asString(draft?.title).trim();
  const description = asString(draft?.description).trim();

  if (title.length < 5) problems.push("Tittel må være minst 5 tegn.");
  if (description.length < 20) problems.push("Beskrivelse må være minst 20 tegn.");

  const imgs = normalizeImages(draft).images;
  if (!imgs.length) problems.push("Minst ett bilde må lastes opp.");

  return problems;
}

function normalizeForSave(draft: AnyObj) {
  const id = asString(draft?.id).trim() || crypto.randomUUID();
  const ownerDeviceId = asString(draft?.ownerDeviceId).trim() || crypto.randomUUID();
  const createdAt = asString(draft?.createdAt).trim() || new Date().toISOString();

  const addr = normalizeAddressFields(draft);
  const imgs = normalizeImages(draft);
  const price = normalizePrice(draft);

  const category = asString(draft?.category).trim() || undefined;

  return {
    ...draft,
    id,
    ownerDeviceId,
    createdAt,
    ...(category ? { category } : {}),
    ...addr,
    ...price,
    images: imgs.images,
    mainImageUrl: imgs.mainImageUrl,
    title: asString(draft?.title).trim(),
    description: asString(draft?.description).trim(),
  };
}

export async function GET() {
  const listings = await readAll();
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  try {
    const draft = (await req.json()) as AnyObj;

    const problems = validateDraft(draft);
    if (problems.length) {
      return NextResponse.json({ ok: false, problems }, { status: 400 });
    }

    const listings = await readAll();
    const normalized = normalizeForSave(draft);

    const next = [normalized, ...listings];
    await writeAll(next);

    return NextResponse.json(normalized, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Kunne ikke lagre annonse." }, { status: 500 });
  }
}
