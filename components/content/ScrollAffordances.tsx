"use client";

/**
 * ScrollAffordances — two paired hints rendered on multi-piece project
 * pages so the user knows there's content below the first slide:
 *
 *   • <ScrollCue>: a small bottom-center "scroll" chip with an animated
 *     chevron. Fades in on mount, fades out the moment the user
 *     scrolls. Returns if they scroll back to the top. Desktop only —
 *     mobile already has the bottom prev/next chrome implying paging.
 *
 *   • <SlideDots>: a vertical column of N dots stuck to the right
 *     edge. Fills the dot for the currently-most-visible piece. Click
 *     a dot to smooth-scroll that piece into view. Desktop only —
 *     mobile screens are too narrow to justify the right-edge gutter.
 *
 * Both auto-hide when the page only has one piece (no point in either).
 * Rendered from `app/projects/[slug]/page.tsx` with the piece count
 * computed at build time so this client component doesn't have to
 * query the DOM to know whether to render.
 */
import { useEffect, useRef, useState } from "react";

export function ScrollAffordances({ pieceCount }: { pieceCount: number }) {
  if (pieceCount <= 1) return null;
  return (
    <>
      <ScrollCue />
      <SlideDots count={pieceCount} />
    </>
  );
}

function ScrollCue() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      // Hide as soon as the user scrolls more than a few px — the
      // affordance has served its purpose once they engage. Show
      // again at the top (e.g. on scroll-up to start) so it acts as
      // a persistent reminder of "more below" whenever you're
      // there. 32px threshold gives a clean break from incidental
      // momentum micro-scrolls.
      setVisible(window.scrollY < 32);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className="scroll-cue"
      data-visible={visible ? "true" : "false"}
      aria-hidden="true"
    >
      <span className="scroll-cue__label">scroll</span>
      <svg
        className="scroll-cue__arrow"
        viewBox="0 0 24 24"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </div>
  );
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
