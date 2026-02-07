// lib/favorites.ts
export const FAVORITES_KEY = "friplass_favorites_v1";

export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string");
  } catch {
    return [];
  }
}

export function setFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  // Si ifra til andre komponenter / tabs
  window.dispatchEvent(new Event("favorites:changed"));
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function addFavorite(id: string) {
  const ids = getFavorites();
  if (ids.includes(id)) return;
  setFavorites([id, ...ids]);
}

export function removeFavorite(id: string) {
  const ids = getFavorites().filter((x) => x !== id);
  setFavorites(ids);
}

export function toggleFavorite(id: string): boolean {
  const ids = getFavorites();
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  setFavorites(next);
  return next.includes(id);
}
