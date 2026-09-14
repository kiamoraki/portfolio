"use client";

import { useEffect, useRef, useState } from "react";
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
 * Position: an absolutely-positioned row at the top of the sketch
 * box, on both breakpoints — the two equations with the refresh
 * control between them, centred over the canvas. The CSS scope
 * (`.shape-of-time-cta-row`) handles the per-breakpoint differences,
 * which are colour (light ink over the black desktop canvas, page ink
 * on the white mobile page) and whether the row overlays the canvas
 * (desktop) or sits in a reserved band above it (mobile).
 */
type Props = {
  /** Forwarded by the `Sketch` primitive so the underlying canvas
   *  positions inside the `.piece-sketch` wrapper instead of
   *  escaping to `position: fixed`. */
  inFlow?: boolean;
};

export function ShapeOfTimeWithRefresh({ inFlow = false }: Props) {
  // Mobile reserves a band above the sketch for the row; desktop
  // overlays it on the canvas. Read in an effect so server and first
  // client render agree.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Live (a, b) pair, published by the canvas on every re-roll.
  const [pair, setPair] = useState<[number, number] | null>(null);
  useEffect(() => {
    const onPair = (e: Event) => {
      const d = (e as CustomEvent<{ a: number; b: number }>).detail;
      if (d) setPair([d.a, d.b]);
    };
    window.addEventListener("shape-of-time:pair", onPair);
    const cfg = globalThis.__shapeOfTimeConfig;
    if (cfg?.currentA !== undefined && cfg?.currentB !== undefined) {
      setPair([cfg.currentA, cfg.currentB]);
    }
    return () => window.removeEventListener("shape-of-time:pair", onPair);
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

  /* Reserve the band the row occupies. Done from JS, on the element,
     because CSS could not: every `.piece-sketch` margin rule added to
     globals.css or project-split.css failed to reach the served
     stylesheet (a scan of `document.styleSheets` found NO rule setting
     margin on `.piece-sketch` at all, while the selector matched), so
     the row kept overlapping the prose above it. An inline style is
     the one lever the build pipeline cannot drop. */
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = rowRef.current?.closest<HTMLElement>(".piece-sketch");
    if (!host) return;
    if (isMobile) {
      // `important` priority: the template sets `margin: 0 !important`
      // on `.piece-sketch`, and a plain inline style loses to a
      // stylesheet `!important`. Inline + important wins.
      host.style.setProperty("margin-top", "3.5rem", "important");
      return () => {
        host.style.removeProperty("margin-top");
      };
    }
    host.style.removeProperty("margin-top");
  }, [isMobile]);

  /* BOTH breakpoints render this row now: the control between the two
     equations, centred above the canvas. Desktop used to portal a bare
     chip to `document.body` and pin it to the viewport bottom; the
     portal only existed so `position: fixed` would resolve against the
     viewport rather than the meta-carousel's transformed track. An
     absolutely-positioned row inside the sketch box has no such
     problem, so the portal (and its body-level visibility gating) is
     no longer needed. */
  const inlineRow = (
    <div className="shape-of-time-cta-row" ref={rowRef}>
      {pair ? (
        <span className="shape-of-time-pair" aria-live="polite">
          x = sin(<strong>{pair[0]}</strong>t)
        </span>
      ) : null}
      {button}
      {pair ? (
        <span className="shape-of-time-pair" aria-live="polite">
          y = sin(<strong>{pair[1]}</strong>t)
        </span>
      ) : null}
    </div>
  );

  return (
    <>
      {inlineRow}
      <ShapeOfTimeCanvas inFlow={inFlow} />
    </>
  );
}
