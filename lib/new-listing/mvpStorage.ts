// lib/new-listing/mvpStorage.ts
export type MvpDraft = Record<string, any>;

const KEY = "friplass:mvpDraft";

function safeParse(raw: string | null): any {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Normaliserer kun "legacy" -> "ny" struktur, men kaster ikke felter.
 * Målet er at ting som locationText/location/address aldri forsvinner.
 */
function normalizeDraft(d: any): MvpDraft {
  const draft: any = d && typeof d === "object" ? { ...d } : {};

  // -------------------------
  // Adresse
  // -------------------------
  const addr =
    draft?.location?.address ??
    draft?.locationText ??
    draft?.address;

  if (typeof addr === "string" && addr.trim()) {
    const a = addr.trim();
    draft.locationText = a;
    draft.address = a;
    draft.location = { ...(draft.location ?? {}), address: a };
  }

  // -------------------------
  // Pris (legacy pricePerNight -> price.perNight)
  // -------------------------
  if (
    (draft.price == null || typeof draft.price !== "object") &&
    (draft.pricePerNight != null || draft.currency != null)
  ) {
    const perNight = Number(draft.pricePerNight ?? 0);
    draft.price = {
      perNight: Number.isFinite(perNight) ? perNight : 0,
      currency: typeof draft.currency === "string" ? draft.currency : "NOK",
    };
  }

  if (draft.price && typeof draft.price === "object") {
    if (draft.price.currency == null) draft.price.currency = "NOK";
  }

  // -------------------------
  // Bilder (legacy imageUrls -> images[{url}])
  // -------------------------
  if (!Array.isArray(draft.images) && Array.isArray(draft.imageUrls)) {
    draft.images = draft.imageUrls
      .filter((x: any) => typeof x === "string" && x.trim())
      .map((url: string) => ({ url }));
  }

  // sørg for at images alltid blir [{url}] hvis det finnes url-strenger
  if (Array.isArray(draft.images)) {
    draft.images = draft.images
      .map((x: any) => {
        if (!x) return null;
        if (typeof x === "string") return { url: x };
        if (typeof x?.url === "string") return { url: x.url };
        return null;
      })
      .filter(Boolean);
  } else {
    draft.images = [];
  }

  // mainImageUrl fallback
  if (typeof draft.mainImageUrl !== "string" || !draft.mainImageUrl.trim()) {
    draft.mainImageUrl = draft.images?.[0]?.url;
  }

  return draft;
}

export function loadMvpDraft(): MvpDraft {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(KEY);
  return normalizeDraft(safeParse(raw));
}

export function saveMvpDraft(next: any) {
  if (typeof window === "undefined") return;
  const normalized = normalizeDraft(next);
  sessionStorage.setItem(KEY, JSON.stringify(normalized));
}

export function clearMvpDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
