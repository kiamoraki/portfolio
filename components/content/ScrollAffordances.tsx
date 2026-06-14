"use client";

/**
 * ScrollAffordances — slide dots rendered on multi-section project
 * pages so the user knows there's content below the first slide.
 *
 * Vertical column of N dots stuck to the right edge (left icon
 * column on mobile). Fills the dot for the currently-most-visible
 * section. Click a dot to smooth-scroll that section into view.
 * Visible on both mobile and desktop (mobile gets a slightly smaller
 * chip via the CSS @media block).
 *
 * Slot discovery is DOM-driven so both v2 (Piece-based) and legacy
 * (top-level Row / Figure) projects light up automatically:
 *
 *   1. Prefer `main .piece` — v2 projects render every piece as
 *      `<section class="piece">` under `.project-track-content`.
 *   2. Fall back to `main > .row, main > figure.image, main > .piece-
 *      layout` — legacy projects render layout primitives directly
 *      as children of `<main>`.
 *
 * Renders nothing if fewer than 2 slots exist (no scroll affordance
 * needed on single-piece pages). The earlier paired `<ScrollCue>`
 * (bottom-center "scroll" chip with bouncing chevron) was removed —
 * the dots alone serve as the multi-section affordance.
 */
import { useEffect, useState } from "react";

const SLOT_SELECTOR =
  "main .piece, main > .row, main > figure.image, main > .piece-layout";

export function ScrollAffordances() {
  const [slots, setSlots] = useState<HTMLElement[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(SLOT_SELECTOR),
    );
    setSlots(nodes);
    if (nodes.length <= 1) return;

    // Track which slot occupies the most of the viewport at any
    // moment. `entry.intersectionRatio` updates per slot; we pick
    // the one with the largest ratio. Threshold step of 0.05 gives
    // smooth tracking without the observer firing every pixel.
    const ratios = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target, e.intersectionRatio);
        }
        let bestIdx = 0;
        let bestRatio = -1;
        for (let i = 0; i < nodes.length; i++) {
          const r = ratios.get(nodes[i]) ?? 0;
          if (r > bestRatio) {
            bestRatio = r;
            bestIdx = i;
          }
        }
        setActive(bestIdx);
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, []);

  if (slots.length <= 1) return null;

  const onClick = (i: number) => {
    const target = slots[i];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="slide-dots" aria-label="Jump to section">
      {slots.map((_, i) => (
        <button
          key={i}
          type="button"
          className="slide-dots__dot"
          data-active={i === active ? "true" : "false"}
          aria-label={`Section ${i + 1} of ${slots.length}`}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onClick(i)}
        />
      ))}
    </nav>
  );
}
