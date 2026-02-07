// app/utforsk/page.tsx
import { Suspense } from "react";
import UtforskClient from "./UtforskClient";

export const metadata = {
  title: "Utforsk | Friplass",
};

// ✅ Viktig: hindrer Next/Vercel i å feile på prerender når useSearchParams brukes
export const dynamic = "force-dynamic";

export default function UtforskPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Laster Utforsk…</div>}>
      <UtforskClient />
    </Suspense>
  );
}
