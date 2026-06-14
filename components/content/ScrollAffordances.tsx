"use client";

/**
 * ScrollAffordances — slide dots rendered on multi-piece project
 * pages so the user knows there's content below the first slide.
 *
 * Vertical column of N dots stuck to the right edge. Fills the dot
 * for the currently-most-visible piece. Click a dot to smooth-scroll
 * that piece into view. Visible on both mobile and desktop (mobile
 * gets a slightly smaller chip via the CSS @media block).
 *
 * Auto-hides when the page only has one piece (no point). Rendered
 * from `app/projects/[slug]/page.tsx` with the piece count computed
 * at build time so this client component doesn't have to query the
 * DOM to know whether to render.
 *
 * The earlier paired `<ScrollCue>` (bottom-center "scroll" chip with
 * bouncing chevron) was removed — the right-edge dots now serve as
 * the sole multi-piece affordance, and they're visible from page
 * load so the discoverability problem is already solved.
 */
import { useEffect, useRef, useState } from "react";

export function ScrollAffordances({ pieceCount }: { pieceCount: number }) {
  if (pieceCount <= 1) return null;
  return <SlideDots count={pieceCount} />;
}

function SlideDots({ count }: { count: number }) {
  const [active, setActive] = useState(0);
  const piecesRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    // Query every `.piece` element on the page. They render in
    // document order, so `nodes[i]` corresponds to dot `i`.
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("main .piece"),
    );
    piecesRef.current = nodes;
    if (nodes.length === 0) return;

    // Track which piece occupies the most of the viewport at any
    // moment. `entry.intersectionRatio` updates per piece; we pick
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

  const onClick = (i: number) => {
    const target = piecesRef.current[i];
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="slide-dots" aria-label="Jump to piece">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          className="slide-dots__dot"
          data-active={i === active ? "true" : "false"}
          aria-label={`Piece ${i + 1} of ${count}`}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onClick(i)}
        />
      ))}
    </nav>
  );
}
