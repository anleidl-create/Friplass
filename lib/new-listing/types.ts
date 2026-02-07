export type NewListingDraft = {
  // Steg 1
  title?: string;
  category?: "bobil" | "campingvogn" | "teltplass" | "batplass" | "parkering";
  locationText?: string;

  // Steg 2
  description?: string;
  suitability?: Array<"familie" | "hund" | "stille" | "naer_sentrum" | "strom">;
  availability?: "hverdag" | "helg" | "begge";

  // ⬇️ NYTT (Nivå 1 kalender)
  availableFrom?: string; // YYYY-MM-DD
  availableTo?: string;   // YYYY-MM-DD

  // Steg 3
  pricePerNight?: number;
  cleaningFee?: number;
  minNights?: number;
};
