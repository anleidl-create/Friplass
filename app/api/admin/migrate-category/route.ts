import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type Listing = {
  id: string;
  title?: string;
  description?: string;
  locationText?: string;
  address?: string;
  location?: { address?: string };
  category?: string;
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function norm(v: any) {
  return safeString(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAddress(l: Listing) {
  return (
    safeString(l.locationText).trim() ||
    safeString(l.address).trim() ||
    safeString(l.location?.address).trim()
  );
}

function inferCategory(l: Listing): string {
  const text = norm(
    `${safeString(l.title)} ${safeString(l.description)} ${normalizeAddress(l)}`
  );

  // båt
  if (
    text.includes("bat") ||
    text.includes("batplass") ||
    text.includes("brygge") ||
    text.includes("brygga") ||
    text.includes("kai") ||
    text.includes("marina") ||
    text.includes("naust") ||
    text.includes("bathavn") ||
    text.includes("flytebrygge")
  ) {
    return "batplass";
  }

  // bobil
  if (
    text.includes("bobil") ||
    text.includes("camper") ||
    text.includes("motorhome")
  ) {
    return "bobilplass";
  }

  // camping / telt
  if (
    text.includes("camping") ||
    text.includes("campingvogn") ||
    text.includes("telt") ||
    text.includes("teltplass") ||
    text.includes("hengekoye") ||
    text.includes("hammock")
  ) {
    // vi samler alt dette under "campingplass" (samme som Utforsk)
    return "campingplass";
  }

  // fallback
  return "campingplass";
}

function normalizeExistingCategory(cat: any): string {
  const c = norm(cat);
  if (c === "batplass" || c === "båtplass") return "batplass";
  if (c === "bobilplass") return "bobilplass";
  if (c === "campingplass" || c === "teltplass" || c === "campingvogn")
    return "campingplass";
  return "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") || "";

  const envSecret = process.env.MIGRATE_SECRET || "";

  // ✅ Sikkerhet:
  // - Hvis MIGRATE_SECRET er satt: krev riktig secret
  // - Hvis ikke satt: kun tillat i dev (ikke production)
  if (envSecret) {
    if (secret !== envSecret) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized (bad secret)" },
        { status: 401 }
      );
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Migration disabled in production without MIGRATE_SECRET. Set env MIGRATE_SECRET to enable.",
        },
        { status: 403 }
      );
    }
    // dev uten secret: tillat, men krev at secret ikke er tom? (valgfritt)
    if (!secret) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing secret. In dev you can pass any secret, e.g. ?secret=dev",
        },
        { status: 400 }
      );
    }
  }

  const filePath = path.join(process.cwd(), "data", "listings.json");

  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    const listings: Listing[] = Array.isArray(parsed) ? parsed : [];
    if (!Array.isArray(listings)) {
      return NextResponse.json(
        { ok: false, error: "listings.json is not an array" },
        { status: 500 }
      );
    }

    let changed = 0;
    let alreadyHad = 0;

    const beforeCounts = { batplass: 0, bobilplass: 0, campingplass: 0, missing: 0 };
    const afterCounts = { batplass: 0, bobilplass: 0, campingplass: 0 };

    for (const l of listings) {
      const existing = normalizeExistingCategory((l as any).category);
      if (!existing) beforeCounts.missing++;
      else (beforeCounts as any)[existing]++;

      const finalCat = existing || inferCategory(l);

      // skriv category tilbake hvis mangler/ukjent
      if (!existing) {
        (l as any).category = finalCat;
        changed++;
      } else {
        // hvis den finnes men er "rar", normaliser den (f.eks. båtplass -> batplass)
        const rawCat = safeString((l as any).category);
        if (rawCat && rawCat !== finalCat) {
          (l as any).category = finalCat;
          changed++;
        } else {
          alreadyHad++;
        }
      }

      (afterCounts as any)[finalCat] = ((afterCounts as any)[finalCat] || 0) + 1;
    }

    // skriv pent tilbake
    await fs.writeFile(filePath, JSON.stringify(listings, null, 2), "utf8");

    return NextResponse.json({
      ok: true,
      total: listings.length,
      changed,
      alreadyHad,
      beforeCounts,
      afterCounts,
      file: "data/listings.json",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Migration failed", detail: safeString(e?.message) },
      { status: 500 }
    );
  }
}
