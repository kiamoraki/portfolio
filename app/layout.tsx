import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirby",
  description: "Interdisciplinary artist and visual systems thinker.",
  icons: { icon: "/favicon.png" },
  // `metadataBase` is the absolute root that resolves the relative
  // `openGraph.images` / `twitter.images` URLs below. Social scrapers
  // (Twitter, Facebook, iMessage, Slack, Discord) refuse relative
  // image paths — they need a fully-qualified URL or they drop the
  // preview silently.
  metadataBase: new URL("https://kiamoraki.com"),
  openGraph: {
    title: "Kirby",
    description: "Interdisciplinary artist and visual systems thinker.",
    url: "https://kiamoraki.com",
    siteName: "Kiamora Kirby",
    images: [
      {
        // Space in the filename has to be percent-encoded so the URL
        // is well-formed when scrapers fetch it. Actual file:
        // `public/img/211117-Mural_Newport_Beach/bw crop-2-min.jpg`.
        url: "/img/211117-Mural_Newport_Beach/bw%20crop-2-min.jpg",
        width: 2370,
        height: 2400,
        alt: "Kiamora Kirby",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kirby",
    description: "Interdisciplinary artist and visual systems thinker.",
    images: ["/img/211117-Mural_Newport_Beach/bw%20crop-2-min.jpg"],
  },
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
      <head>
        {/* Preload the above-the-fold fonts so the browser starts
            fetching them in parallel with HTML/CSS parse rather than
            waiting for the CSSOM to discover the `url(...)` reference
            inside the `@font-face` rules. Combined with the existing
            `font-display: swap` (set per @font-face in globals.css)
            this means text renders in the fallback font for ~0ms
            instead of waiting on a font request that doesn't start
            until CSS parsing reaches the rule. Limited to the body
            + bold faces (DroidSans is the system text font; Neuropol
            is the chrome / heading font) — the other 7 faces aren't
            on the first viewport of any page and load on demand. */}
        <link
          rel="preload"
          href="/fonts/DroidSans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/DroidSans-Bold.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/neuropol.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
