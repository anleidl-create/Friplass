export type BadgeKey =
  | "strom"
  | "vann"
  | "toalett"
  | "dusj"
  | "wifi"
  | "naer_sjo"
  | "familievennlig"
  | "rolig"
  | "enkel_adkomst"
  | "hund_tillatt";

export const BADGES: { key: BadgeKey; label: string }[] = [
  { key: "strom", label: "Strøm" },
  { key: "vann", label: "Vann" },
  { key: "toalett", label: "Toalett" },
  { key: "dusj", label: "Dusj" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "naer_sjo", label: "Nær sjø" },
  { key: "familievennlig", label: "Familievennlig" },
  { key: "rolig", label: "Rolig område" },
  { key: "enkel_adkomst", label: "Enkel adkomst" },
  { key: "hund_tillatt", label: "Hund tillatt" },
];

export function badgeLabel(key: string) {
  return BADGES.find((b) => b.key === key)?.label ?? key;
}
