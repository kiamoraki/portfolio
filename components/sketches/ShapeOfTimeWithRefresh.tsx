"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShapeOfTimeCanvas } from "@/components/sketches/ShapeOfTimeCanvas";

/**
 * Wraps `ShapeOfTimeCanvas` with a refresh chip that swaps the
 * current freqA:freqB pair for a fresh roll and resets the sketch.
 *
 * The refresh path is just a tick counter on `globalThis.__shape
 * OfTimeConfig.refreshTick`. The canvas's draw loop observes the
 * tick and calls `buildParticles()` (which re-rolls the pair via
 * `pickFreqPair` and clears the canvas) the next frame.
 *
 * Position: a fixed, viewport-pinned chip centered horizontally
 * between the chrome PREV / NEXT slots — top-right on desktop,
 * bottom-center above the mobile PREV/NEXT bar. The CSS scope
 * (`.shape-of-time-refresh`) handles both layouts.
 *
 * Portal: the button is rendered into `document.body` via
 * `createPortal` so it escapes the meta-carousel's `transform`
 * ancestor — `position: fixed` inside a transformed ancestor is
 * spec'd to use that ancestor as the containing block (per the
 * CSS Transforms spec), which would make `left: 50%; bottom: 1rem`
 * resolve against the multi-slide track (width = N × 100vw) rather
 * than the viewport, parking the chip off-screen horizontally.
 * Rendering to body sidesteps that entirely — the chip lives at
 * the document root with no transformed ancestor, so the fixed
 * positioning resolves against the viewport in both standalone
 * and meta-carousel contexts. Visibility is gated by CSS on
 * `body[data-meta-active-slug]` and `body:has(main[data-project-
 * slug])` so the chip only shows for the shape-of-time slide
 * (carousel) or page (standalone).
 */
type Props = {
  /** Forwarded by the `Sketch` primitive so the underlying canvas
   *  positions inside the `.piece-sketch` wrapper instead of
   *  escaping to `position: fixed`. */
  inFlow?: boolean;
};

export function ShapeOfTimeWithRefresh({ inFlow = false }: Props) {
  // Portal target only exists after mount (no SSR for `document.body`).
  // Track a mounted flag and render the portal only after first effect
  // runs — otherwise hydration mismatches between server (no portal)
  // and client (portal).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onRefresh = () => {
    if (typeof window === "undefined") return;
    const cfg = globalThis.__shapeOfTimeConfig ?? {};
    cfg.refreshTick = (cfg.refreshTick ?? 0) + 1;
    globalThis.__shapeOfTimeConfig = cfg;
  };

  const button = (
    <button
      type="button"
      className="shape-of-time-refresh"
      onClick={onRefresh}
      aria-label="Skip to a new lissajous pair"
    >
      {/* Curved-arrow refresh glyph, matched to the rest of the
          site's `stroke="currentColor"` SVG family. Two arcs +
          two arrowheads form the classic "spin around" loop. */}
      <svg
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
        {/* Top arc + arrowhead pointing right */}
        <path d="M3 12 A 9 9 0 0 1 19 7" />
        <polyline points="14 7 19 7 19 2" />
        {/* Bottom arc + arrowhead pointing left */}
        <path d="M21 12 A 9 9 0 0 1 5 17" />
        <polyline points="10 17 5 17 5 22" />
      </svg>
    </button>
  );

  return (
    <>
      <ShapeOfTimeCanvas inFlow={inFlow} />
      {mounted ? createPortal(button, document.body) : null}
    </>
  );
}
