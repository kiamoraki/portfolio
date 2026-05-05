import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirby",
  description: "Artist & UX designer. Immersive installations and interactive arts.",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
