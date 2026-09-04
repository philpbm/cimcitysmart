import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CIMSYSTEM — D2D3",
  description: "Gestion cartographique des cimetières — D2D3.com SA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
