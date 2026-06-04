"use client";

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
 */
type Props = {
  /** Forwarded by the `Sketch` primitive so the underlying canvas
   *  positions inside the `.piece-sketch` wrapper instead of
   *  escaping to `position: fixed`. */
  inFlow?: boolean;
};

export function ShapeOfTimeWithRefresh({ inFlow = false }: Props) {
  const onRefresh = () => {
    if (typeof window === "undefined") return;
    const cfg = globalThis.__shapeOfTimeConfig ?? {};
    cfg.refreshTick = (cfg.refreshTick ?? 0) + 1;
    globalThis.__shapeOfTimeConfig = cfg;
  };

  return (
    <>
      <ShapeOfTimeCanvas inFlow={inFlow} />
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
    </>
  );
}
