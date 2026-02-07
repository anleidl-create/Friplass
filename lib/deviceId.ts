// lib/deviceId.ts
export const DEVICE_ID_KEY = "friplass_device_id_v1";

function fallbackUuid() {
  // Enkel fallback hvis randomUUID ikke finnes
  return (
    "id-" +
    Math.random().toString(16).slice(2) +
    "-" +
    Date.now().toString(16)
  );
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""; // server: ingen localStorage
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing && existing.trim()) return existing;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : fallbackUuid();

  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
