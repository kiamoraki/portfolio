"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavClient() {
  const pathname = usePathname();
  const normalized = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const isIndex = normalized === "/";
  const isAbout = normalized === "/about";

  // Wall-clock rainbow sync — computes the current rainbow color
  // from `Date.now()` every animation frame and writes it to two
  // CSS variables on `documentElement`:
  //   --rainbow-now      → for `background-color` / `color` consumers
  //   --rainbow-now-rgb  → the same value as space-separated RGB,
  //                        so consumers can do `rgb(var(--…) / 0.5)`
  //
  // Why JS instead of `@keyframes` + `animation-delay`? CSS animations
  // capture their `animation-delay` value at START time and never
  // re-read it. Any animation that mounts AFTER page load — a focused
  // input, a hovered modal button, the modal opening at all (the
  // dialog is `display: none` until `showModal()`, which stops its
  // animations) — would start out-of-phase with the top-bar chips
  // that have been running since page load. A shared CSS variable
  // updated every frame guarantees every consumer paints the same
  // colour at the same moment, no matter when they joined the party.
  //
  // `--rainbow-delay` is also kept up to date for any legacy CSS
  // animation that still references it (mobile `.nav-info.active`,
  // `.project-title-toggle--open`) — those will be slightly behind
  // the JS-driven elements on first paint after mount, but the
  // drift is bounded by one frame (~16ms) which is imperceptible.
  useEffect(() => {
    // 12-stop palette matching the `nav-grid-cycle` keyframes — the
    // wrap-around stop (12 ≡ 0) is implicit via modular indexing.
    const PALETTE: ReadonlyArray<readonly [number, number, number]> = [
      [0xff, 0x1f, 0xe0],
      [0xe0, 0x1f, 0xff],
      [0xa2, 0x3e, 0xff],
      [0x45, 0xd9, 0xff],
      [0x45, 0xff, 0xa2],
      [0x83, 0xff, 0x64],
      [0xc1, 0xff, 0xa2],
      [0xe0, 0xff, 0xa2],
      [0xff, 0xff, 0x45],
      [0xff, 0xd9, 0x45],
      [0xff, 0xba, 0x45],
    ];
    const CYCLE_MS = 12000;
    const STOPS = PALETTE.length;
    const root = document.documentElement;
    let rafId = 0;

    const update = () => {
      const t = Date.now() % CYCLE_MS;
      const idx = (t / CYCLE_MS) * STOPS;
      const i0 = Math.floor(idx) % STOPS;
      const i1 = (i0 + 1) % STOPS;
      const f = idx - Math.floor(idx);
      const a = PALETTE[i0];
      const b = PALETTE[i1];
      const r = Math.round(a[0] + (b[0] - a[0]) * f);
      const g = Math.round(a[1] + (b[1] - a[1]) * f);
      const bl = Math.round(a[2] + (b[2] - a[2]) * f);
      root.style.setProperty("--rainbow-now", `rgb(${r} ${g} ${bl})`);
      root.style.setProperty("--rainbow-now-rgb", `${r} ${g} ${bl}`);
      // Legacy `--rainbow-delay` for CSS animations that still use
      // `animation: nav-grid-cycle 12s var(--rainbow-delay) …`.
      const offsetSec = t / 1000;
      root.style.setProperty(
        "--rainbow-delay",
        `-${offsetSec.toFixed(3)}s`,
      );
      rafId = window.requestAnimationFrame(update);
    };
    update();
    return () => window.cancelAnimationFrame(rafId);
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
          <svg
            className="nav-house-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10h14V10" />
          </svg>
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
        <span className="nav-info-label">cv</span>
      </Link>
    </>
  );
}
