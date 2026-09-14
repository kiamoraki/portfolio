"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadP5 } from "@/components/sketches/loadP5";

export function NavClient() {
  const pathname = usePathname();
  const normalized = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const isIndex = normalized === "/";
  const isAbout = normalized === "/about";

  // The wall-clock rainbow sync is GONE. It ran a `requestAnimation
  // Frame` loop for the life of every page, writing `--rainbow-now`,
  // `--rainbow-now-rgb` and `--rainbow-delay` onto `documentElement`
  // 60 times a second — a permanently mutating inline `style` on the
  // <html> tag.
  //
  // Nothing visible depended on it any more. The nav chips lost their
  // rainbow `::before` overlays when the bar went flat, and the mobile
  // bottom nav that used `--rainbow-now` is `display: none` on split
  // pages (which is every project now). The only live consumers left
  // are the contact modal's focus border and its button hover
  // overlays, and those already declare `var(--rainbow-now, #ff1fe0)`
  // — so they fall back to the static magenta rather than breaking.

  // Kick off the p5 chunk fetch as soon as the page hydrates. The
  // chunk is ~1MB and gated by the `loadP5()` singleton, so this
  // first call starts the request; every sketch's IntersectionObserver
  // that later calls `loadP5()` reuses the in-flight promise. By the
  // time a thumbnail or piece-canvas mounts and asks for p5, it's
  // either already loaded or close to it. NavClient mounts on every
  // route, so this happens regardless of which page the user lands on.
  useEffect(() => {
    void loadP5();
  }, []);

  return (
    <>
      <div className="mobile-header-frame" aria-hidden="true" />
      <nav className="nav-main">
        <Link
          href="/"
          className={`icon-standard ${isIndex ? "active" : ""}`}
          aria-label="Home"
        >
          {/* The wordmark IS the home link now; the house glyph was
              removed. Still `aria-hidden` because the link's own
              `aria-label="Home"` names it, so it is read once. */}
          <span className="nav-home-label" aria-hidden="true">
            Kiamora Kirby
          </span>
        </Link>
      </nav>
      {/* CV chip — always rendered so it stays in the chrome strip on
          every page. On /about itself it gets the `active` class, same
          rainbow-gif backdrop the Home button uses on the homepage. */}
      <Link
        href="/about"
        className={`nav-info ${isAbout ? "active" : ""}`}
        aria-label="About"
        aria-current={isAbout ? "page" : undefined}
      >
        {/* Renders uppercase via `.nav-info-label`. The link and its
            `aria-label` still point at /about — only the wordmark for
            it changed. */}
        <span className="nav-info-label">whois</span>
      </Link>
    </>
  );
}
