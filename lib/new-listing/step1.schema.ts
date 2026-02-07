import { z } from "zod";

const CATEGORY_VALUES = ["batplass", "bobilplass", "campingplass"] as const;
export type Category = (typeof CATEGORY_VALUES)[number];

function normalizeCategory(v: string) {
  const s = (v || "").toLowerCase().trim();

  // gamle -> nye
  if (s === "batplass" || s === "bat" || s === "båt") return "batplass";
  if (s === "bobil" || s === "bobilplass") return "bobilplass";
  if (s === "campingvogn" || s === "teltplass" || s === "telt" || s === "campingplass") return "campingplass";

  return s;
}

export const step1Schema = z.object({
  title: z.string().min(6, "Tittel må være minst 6 tegn").max(80, "Maks 80 tegn"),

  category: z
    .string()
    .min(1, "Velg en kategori")
    .transform((v) => normalizeCategory(v))
    .refine((v): v is Category => (CATEGORY_VALUES as readonly string[]).includes(v), {
      message: "Velg en kategori",
    })
    .transform((v) => v as Category),

  locationText: z
    .string()
    .min(2, "Skriv sted (f.eks. Egersund)")
    .max(80, "Maks 80 tegn"),
});

export type Step1Values = z.infer<typeof step1Schema>;
