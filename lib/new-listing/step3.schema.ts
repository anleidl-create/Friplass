import { z } from "zod";

export const step3Schema = z.object({
  pricePerNight: z.coerce
    .number()
    .int("Må være heltall")
    .min(0, "Kan ikke være negativ")
    .max(20000, "Virker veldig høyt"),
  cleaningFee: z.coerce
    .number()
    .int("Må være heltall")
    .min(0, "Kan ikke være negativ")
    .max(20000, "Virker veldig høyt")
    .optional()
    .default(0),
  minNights: z.coerce
    .number()
    .int("Må være heltall")
    .min(1, "Minimum 1 natt")
    .max(30, "Maks 30 netter"),
});

export type Step3Values = z.infer<typeof step3Schema>;
