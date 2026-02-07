import { z } from "zod";

const SUITABILITY_VALUES = ["familie", "hund", "stille", "naer_sentrum", "strom"] as const;
export type Suitability = (typeof SUITABILITY_VALUES)[number];

const AVAILABILITY_VALUES = ["hverdag", "helg", "begge"] as const;
export type Availability = (typeof AVAILABILITY_VALUES)[number];

export const step2Schema = z
  .object({
    description: z
      .string()
      .min(20, "Beskrivelse må være minst 20 tegn")
      .max(1200, "Maks 1200 tegn"),

    // alltid array (ikke optional!)
    suitability: z
      .array(
        z
          .string()
          .refine((v): v is Suitability => (SUITABILITY_VALUES as readonly string[]).includes(v), {
            message: "Ugyldig valg",
          })
          .transform((v) => v as Suitability)
      )
      .default([]),

    availability: z
      .string()
      .min(1, "Velg tilgjengelighet")
      .refine((v): v is Availability => (AVAILABILITY_VALUES as readonly string[]).includes(v), {
        message: "Velg tilgjengelighet",
      })
      .transform((v) => v as Availability),

    availableFrom: z.string().optional(),
    availableTo: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const from = val.availableFrom?.trim();
    const to = val.availableTo?.trim();

    if (!from && !to) return;

    if (from && to && from > to) {
      ctx.addIssue({
        code: "custom",
        path: ["availableTo"],
        message: "Til-dato kan ikke være før fra-dato",
      });
    }
  });

export type Step2Values = z.infer<typeof step2Schema>;
