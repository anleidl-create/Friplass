// app/plass/[id]/page.tsx

type Listing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating?: number;
  reviews?: number;
  badges: string[];
  description: string;
  amenities: string[];
  rules: string[];
};

const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Rolig bobilplass ved sjøen",
    location: "Egersund",
    pricePerNight: 390,
    rating: 4.8,
    reviews: 34,
    badges: ["Strøm", "Vann", "Direktebooking"],
    description:
      "Fin og rolig plass med enkel adkomst. Flatt underlag og kort vei til sjøen. Passer perfekt for en natt eller helgetur.",
    amenities: ["Strøm", "Vann", "Flat plass", "Hundevennlig", "Enkel adkomst"],
    rules: ["Stille etter kl. 23:00", "Ingen forsøpling", "Respekter området"],
  },
  {
    id: "2",
    title: "Gårdsplass – enkel adkomst",
    location: "Stavanger",
    pricePerNight: 250,
    rating: 4.6,
    reviews: 18,
    badges: ["Parkering", "Familievennlig"],
    description:
      "Praktisk plass på gårdsplass med rask adkomst. Godt egnet for én overnatting på vei videre.",
    amenities: ["Enkel inn/ut", "God belysning", "Familievennlig"],
    rules: ["Ingen høy musikk", "Hold området ryddig"],
  },
  {
    id: "3",
    title: "Teltplass i skogkanten",
    location: "Bjerkreim",
    pricePerNight: 180,
    rating: 4.7,
    reviews: 9,
    badges: ["Natur", "Bålplass"],
    description:
      "Naturnær teltplass med fin kveldssol. Kort sti inn til plass. Perfekt for en rolig natt.",
    amenities: ["Bålplass", "Tursti", "Naturnært"],
    rules: ["Bål kun i bålplass", "Ta med søppel hjem"],
  },
  {
    id: "4",
    title: "Sentralt – korttidsparkering",
    location: "Sandnes",
    pricePerNight: 220,
    rating: 4.4,
    reviews: 22,
    badges: ["Parkering", "Nær sentrum"],
    description:
      "Parkering nært sentrum. Perfekt for event, jobb eller én natt i nærheten av alt.",
    amenities: ["Nær sentrum", "God belysning", "Enkel adkomst"],
    rules: ["Kun parkering/overnatting", "Ikke ta mer enn én plass"],
  },
  {
    id: "5",
    title: "Campingvognplass med strøm",
    location: "Bryne",
    pricePerNight: 310,
    rating: 4.9,
    reviews: 11,
    badges: ["Strøm", "Rolig område"],
    description:
      "Stille og rolig plass med strømuttak. Godt egnet for campingvogn og bobil.",
    amenities: ["Strøm", "Flat plass", "Rolig område"],
    rules: ["Stille etter kl. 23:00"],
  },
  {
    id: "6",
    title: "Utsikt – premium spot",
    location: "Sirdal",
    pricePerNight: 450,
    rating: 4.9,
    reviews: 41,
    badges: ["Utsikt", "Strøm", "Vann"],
    description:
      "Premium plass med utsikt. Strøm og vann tilgjengelig. Perfekt base for turer og avslapning.",
    amenities: ["Utsikt", "Strøm", "Vann", "Turmuligheter"],
    rules: ["Ingen forsøpling", "Respekter ro og naboer"],
  },
];

export default function PlacePage({
  params,
}: {
  params: { id: string };
}) {
  const listing = LISTINGS.find((x) => x.id === params.id) ?? LISTINGS[0];

  return (
    <div className="placeWrap">
      <a href="/utforsk" className="backLink">
        ← Tilbake til utforsk
      </a>

      <div className="placeHeader">
        <div>
          <h1 className="placeTitle">{listing.title}</h1>

          <div className="placeMeta">
            <span>{listing.location}</span>
            <span className="dot">•</span>
            <span>
              {typeof listing.rating === "number" ? (
                <>
                  ★ {listing.rating.toFixed(1)}{" "}
                  <span className="muted">({listing.reviews ?? 0})</span>
                </>
              ) : (
                <span className="muted">Ny annonse</span>
              )}
            </span>
          </div>

          <div className="badges" style={{ marginTop: 12 }}>
            {listing.badges.map((b) => (
              <span key={b} className="badge">
                {b}
              </span>
            ))}
          </div>
        </div>

        <aside className="priceCard card">
          <div className="priceBig">{kr(listing.pricePerNight)}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            per natt
          </div>

          <div className="dateRow">
            <div>
              <div className="label">Fra</div>
              <input type="date" />
            </div>
            <div>
              <div className="label">Til</div>
              <input type="date" />
            </div>
          </div>

          <button className="btn btn-primary" type="button" style={{ width: "100%" }}>
            Send forespørsel
          </button>

          <button
            className="btn btn-outline"
            type="button"
            style={{ width: "100%", marginTop: 10 }}
          >
            Lagre plass
          </button>

          <p className="muted" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 12 }}>
            (Demo) Neste: koble til database + bookingsystem.
          </p>
        </aside>
      </div>

      <div className="gallery">
        <div className="imgPh img1" aria-label="Bilde 1 placeholder" />
        <div className="imgPh img2" aria-label="Bilde 2 placeholder" />
        <div className="imgPh img3" aria-label="Bilde 3 placeholder" />
      </div>

      <div className="placeGrid">
        <section className="card">
          <h2 className="sectionTitle">Om plassen</h2>
          <p className="p">{listing.description}</p>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Fasiliteter</h2>
          <ul className="list">
            {listing.amenities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Regler</h2>
          <ul className="list">
            {listing.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Kart</h2>
          <div className="mapPh">Kart kommer her (Mapbox/Google senere)</div>
        </section>
      </div>
    </div>
  );
}

function kr(n: number) {
  return `${n} kr`;
}
