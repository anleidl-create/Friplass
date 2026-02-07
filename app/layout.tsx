import Header from "../components/header/Header";

export const metadata = {
  title: "Friplass",
  description: "Lei ut plass til båt, bobil, campingvogn og telt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no">
      <body
        style={{
          margin: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#fafafa",
        }}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
