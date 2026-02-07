// lib/new-listing/mappers.ts

export type ListingImage = { url: string };

export type Draft = {
  title: string;
  description: string;
  location: { address: string };
  price: { perNight: number; currency: string };
  images: ListingImage[];
  mainImageUrl?: string;
};

export type MvpDraft = {
  title: string;
  description: string;
  address: string;
  pricePerNight: number;
  currency: string;
  imageUrls: string[];
  mainImageUrl?: string;
};

export function mvpToDraft(mvp: MvpDraft): Draft {
  return {
    title: mvp.title,
    description: mvp.description,
    location: { address: mvp.address },
    price: {
      perNight: mvp.pricePerNight,
      currency: mvp.currency,
    },
    images: mvp.imageUrls.map((url) => ({ url })),
    mainImageUrl: mvp.mainImageUrl,
  };
}

export function draftToMvp(draft: Draft): MvpDraft {
  return {
    title: draft.title,
    description: draft.description,
    address: draft.location.address,
    pricePerNight: draft.price.perNight,
    currency: draft.price.currency,
    imageUrls: draft.images.map((i) => i.url),
    mainImageUrl: draft.mainImageUrl,
  };
}
