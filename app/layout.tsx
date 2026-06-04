import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirby",
  description: "Artist & UX designer. Immersive installations and interactive arts.",
  icons: { icon: "/favicon.png" },
};

// `interactive-widget: resizes-content` makes iOS Safari (16+) and
// Chrome shrink the LAYOUT viewport when the bottom URL bar appears,
// instead of just the visual viewport. The result: `position: fixed;
// bottom: 0` on `.project-mobile-bottom-nav` automatically pins ABOVE
// the URL bar without any JS gymnastics. Browsers that don't honor
// the directive fall back to the `--browser-chrome-bottom-h` variable
// set by ProjectMobileBottomNav's visualViewport listener.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
