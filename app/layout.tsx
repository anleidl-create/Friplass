import "./globals.css";

export const metadata = {
  title: "Friplass",
  description: "Lei privat båtplass, campingbilplass eller teltplass – enkelt og trygt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body className="min-h-screen bg-white text-zinc-900">
        <div className="mx-auto max-w-5xl px-4">
          {/* Header */}
          <header className="flex items-center justify-between py-5">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
                F
              </span>
              <span className="text-lg">Friplass</span>
            </a>

            <nav className="flex items-center gap-3">
              <a
                href="/sok"
                className="rounded-xl px-3 py-2 text-sm font-medium hover:bg-zinc-100"
              >
                Søk
              </a>
              <a
                href="/legg-ut"
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Legg ut plass
              </a>
            </nav>
          </header>

          {/* Page */}
          <main className="pb-16">{children}</main>

          {/* Footer */}
          <footer className="border-t py-8 text-sm text-zinc-500">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Friplass</p>
              <div className="flex gap-4">
                <a href="/vilkar" className="hover:text-zinc-700">
                  Vilkår
                </a>
                <a href="/personvern" className="hover:text-zinc-700">
                  Personvern
                </a>
                <a href="/hjelp" className="hover:text-zinc-700">
                  Hjelp
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
