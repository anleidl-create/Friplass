export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 40, margin: 0 }}>Friplass</h1>

      <p style={{ fontSize: 18, marginTop: 12 }}>
        Lei privat båtplass, campingbilplass eller teltplass – enkelt og trygt.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <a
          href="/sok"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: "black",
            color: "white",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Søk plasser
        </a>

        <a
          href="/legg-ut"
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #ccc",
            textDecoration: "none",
            fontWeight: 600,
            color: "black",
          }}
        >
          Legg ut plass
        </a>
      </div>

      <p style={{ marginTop: 24, color: "#555" }}>
        Norge + Sverige • Privatperson til privatperson (P2P)
      </p>
    </main>
  );
}
