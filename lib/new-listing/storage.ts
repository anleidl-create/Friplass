const KEY = "friplass:mvp:draft";

export type MvpDraft = {
  title: string;
  description: string;
  address: string;
  pricePerNight: number;
  imageUrls: string[];
};

export const emptyDraft: MvpDraft = {
  title: "",
  description: "",
  address: "",
  pricePerNight: 0,
  imageUrls: [],
};

export function loadMvpDraft(): MvpDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...emptyDraft, ...JSON.parse(raw) } : { ...emptyDraft };
  } catch {
    return { ...emptyDraft };
  }
}

export function saveMvpDraft(draft: MvpDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {}
}

export function clearMvpDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
