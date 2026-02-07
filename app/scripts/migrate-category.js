// scripts/migrate-category.js
const fs = require("fs/promises");
const path = require("path");

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function normalizeText(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(listing) {
  const hay = normalizeText(
    `${listing?.title ?? ""} ${listing?.description ?? ""}`
  );

  // 🛥️ BÅTPLASS
  if (
    hay.includes("båtplass") ||
    hay.includes("brygge") ||
    hay.includes("kai") ||
    hay.includes("marina") ||
    hay.includes("naust") ||
    hay.includes("båthavn") ||
    hay.includes("fortøyn") ||
    hay.includes("fortøying") ||
    hay.includes("flytebrygge") ||
    hay.includes("båt")
  ) {
    return "batplass";
  }

  // 🚐 BOBILPLASS
  if (
    hay.includes("bobil") ||
    hay.includes("bobilplass") ||
    hay.includes("camper") ||
    hay.includes("campervan") ||
    hay.includes("motorhome") ||
    hay.includes("caravan")
  ) {
    return "bobilplass";
  }

  // 🏕️ CAMPINGPLASS
  if (
    hay.includes("campingplass") ||
    hay.includes("camping") ||
    hay.includes("campingvogn") ||
    hay.includes("telt") ||
    hay.includes("teltplass") ||
    hay.includes("hengekøye") ||
    hay.includes("hammock") ||
    hay.includes("fricamping")
  ) {
    return "campingplass";
  }

  return null;
}


async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry") || args.has("--dry-run");

  const filePath = path.join(process.cwd(), "data", "listings.json");
  const raw = await fs.readFile(filePath, "utf8");

  let listings;
  try {
    listings = JSON.parse(raw);
  } catch (e) {
    console.error("❌ Klarte ikke parse JSON i data/listings.json");
    throw e;
  }

  if (!Array.isArray(listings)) {
    throw new Error("❌ data/listings.json må være et array av annonser.");
  }

  let changed = 0;
  let already = 0;
  let unknown = 0;

  const unknownIds = [];

  const next = listings.map((l) => {
    const hasCategory = typeof l?.category === "string" && l.category.trim().length > 0;
    if (hasCategory) {
      already++;
      return l;
    }

    const inferred = inferCategory(l);

    if (!inferred) {
      unknown++;
      unknownIds.push(l?.id ?? "(mangler id)");
      return l; // lar den være urørt
    }

    changed++;
    return { ...l, category: inferred };
  });

  console.log("— Migrering: category —");
  console.log("Fil:", filePath);
  console.log("Dry-run:", dryRun ? "JA" : "NEI");
  console.log("Totalt:", listings.length);
  console.log("Allerede category:", already);
  console.log("Satt category:", changed);
  console.log("Ukjent (ingen endring):", unknown);

  if (unknownIds.length) {
    console.log("\nUkjente annonser (id):");
    for (const id of unknownIds.slice(0, 30)) console.log(" -", id);
    if (unknownIds.length > 30) console.log(" ... +", unknownIds.length - 30, "flere");
    console.log("\nTips: Du kan manuelt sette category på disse etterpå.");
  }

  if (dryRun) {
    console.log("\n✅ Dry-run ferdig. Ingen filer er endret.");
    return;
  }

  // Backup først
  const backupPath = filePath.replace(/\.json$/i, `.bak-${nowStamp()}.json`);
  await fs.writeFile(backupPath, raw, "utf8");

  // Skriv ny fil (pretty)
  await fs.writeFile(filePath, JSON.stringify(next, null, 2) + "\n", "utf8");

  console.log("\n✅ Ferdig! Backup laget:");
  console.log(backupPath);
}

main().catch((e) => {
  console.error("\n❌ Feil:", e?.message ?? e);
  process.exit(1);
});
