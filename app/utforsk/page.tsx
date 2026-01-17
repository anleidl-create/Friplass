// app/utforsk/page.tsx

type Listing = {
  id: string;
  title: string;
  location: string;
  pricePerNight: number;
  rating?: number;
  reviews?: number;
  badges: string[];
};

const DEMO_LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Rolig bobilplass ved sjøen",
    location: "Egersund",
    pricePerNight: 390,
    rating: 4.8,
    reviews: 34,
    badges: ["Strøm", "Vann", "Direktebooking"],
  },
  {
    id: "2",
    title: "Gårdsplass – enkel adkomst",
    location: "Stavanger",
    pricePerNight: 250,
    rating: 4.6,
    reviews: 18,
    badges: ["Parkering", "Familievennlig"],
  },
  {
    id: "3",
    title: "Teltplass i skogkanten",
    location: "Bjerkreim",
    pricePerNight: 180,
    rating: 4.7,
    reviews: 9,
    badges: ["Natur", "Bålplass"],
  },
  {
    id: "4",
    title: "Sentralt – korttidsparkering",
    location: "Sandnes",
    pricePerNight: 220,
    rating: 4.4,
    reviews: 22,
    badges: ["Parkering", "Nær sentrum"],
  },
  {
    id: "5",
    title: "Campingvognplass med strøm",
    location: "Bryne",
    pricePerNight: 310,
    rating: 4.9,
    reviews: 11,
    badges: ["Strøm", "Rolig område"],
  },
  {
    id: "6",
    title: "Utsikt – premium spot",
    location: "Sirdal",
    pricePerNight: 450,
    rating: 4.9,
    reviews: 41,
    badges: ["Utsikt", "Strøm", "Vann"],
  },
];

export default function ExplorePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="pageIntro">
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.3 }}>Utforsk</h1>
        <p style={{ margin: "8px 0 0", color: "var(--muted)" }}>
          Finn plasser med tydelige fasiliteter og premium presentasjon.
        </p>
      </div>

      <div className="explore-shell">
        <aside className="filters card">
          <h3 style={{ margin: 0, fontSize: 16 }}>Filtre</h3>

          <div style={{ height: 10 }} />

          <label className="field">
            <span className="label">Hvor?</span>
            <input placeholder="Søk sted (f.eks. Egersund)" />
          </label>

          <div className="row2">
            <label className="field">
              <span className="label">Fra</span>
              <input type="date" />
            </label>
            <label className="field">
              <span className="label">Til</span>
              <input type="date" />
            </label>
          </div>

          <div className="chips">
            {["Bobil", "Campingvogn", "Telt", "Parkering"].map((x) => (
              <button key={x} className="chip" type="button">
                {x}
              </button>
            ))}
          </div>

          <label className="field">
            <span className="label">Maks pris per natt</span>
            <input type="number" placeholder="f.eks. 400" />
          </label>

          <button className="btn btn-primary" type="button">
            Bruk filtre
          </button>
        </aside>

        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="topbar card">
            <div>
              <h2 style={{ margin: 0, fontSize: 20, letterSpacing: -0.2 }}>
                Utforsk plasser
              </h2>
              <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 14 }}>
                {DEMO_LISTINGS.length} treff (demo)
              </p>
            </div>

            <div className="sort">
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Sorter</span>
              <select defaultValue="relevant">
                <option value="relevant">Mest relevant</option>
                <option value="price_asc">Pris: lav → høy</option>
                <option value="price_desc">Pris: høy → lav</option>
                <option value="rating">Best vurdert</option>
              </select>
            </div>
          </div>

          <div className="grid">
            {DEMO_LISTINGS.map((l) => (
              <a key={l.id} href={`/plass/${l.id}`} className="listing">
                <div className="thumb" aria-hidden="true">
                  <div className="thumbBadge">Premium</div>
                </div>

                <div className="listingBody">
                  <div className="listingTop">
                    <div>
                      <div className="listingTitle">{l.title}</div>
                      <div className="listingMeta">{l.location}</div>
                    </div>

                    <div className="price">
                      <div className="priceValue">{l.pricePerNight} kr</div>
                      <div className="priceLabel">per natt</div>
                    </div>
                  </div>

                  <div className="badges" style={{ marginTop: 12 }}>
                    {l.badges.slice(0, 3).map((b) => (
                      <span key={b} className="badge">
                        {b}
                      </span>
                    ))}
                  </div>

                  <div className="listingBottom">
                    <span>
                      {l.rating ? (
                        <>
                          ★ {l.rating.toFixed(1)}{" "}
                          <span className="muted">({l.reviews ?? 0})</span>
                        </>
                      ) : (
                        <span className="muted">Ny</span>
                      )}
                    </span>
                    <span className="linkHint">Se detaljer →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
