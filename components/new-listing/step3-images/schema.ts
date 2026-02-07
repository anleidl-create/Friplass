import { z } from "zod";

export const step3ImagesSchema = z
  .object({
    images: z.array(
      z.object({
        url: z.string().min(1),
      })
    ).default([]),

    mainImageIndex: z
      .number()
      .int()
      .min(0)
      .optional()
      .default(0),
  })
  .superRefine((val, ctx) => {
    if (val.images.length > 0 && val.mainImageIndex >= val.images.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mainImageIndex"],
        message: "Hovedbilde er utenfor gyldig område.",
      });
    }
  });

export type Step3ImagesValues = z.infer<typeof step3ImagesSchema>;
