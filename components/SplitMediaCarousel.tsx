"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Piece-level carousel for the split template's media column.
 *
 * Clicking the LEFT half steps back one slide, the RIGHT half steps
 * forward; both wrap. Arrow keys do the same so the control isn't
 * mouse-only.
 *
 * DOM-driven, matching `ScrollAffordances`: it discovers `.piece`
 * elements after mount rather than being handed a slide count, so it
 * works for any project regardless of how its MDX body is composed.
 *
 * Two things this deliberately does NOT do:
 *
 *   1. It does not swallow clicks on interactive descendants. The
 *      eternal-return slide carries its own eye-toggle button, and a
 *      blanket handler would advance the carousel every time you
 *      pressed it. Clicks originating inside a button/link/input are
 *      left alone.
 *   2. It does not hide inactive slides with `display: none`. The
 *      `<Sketch>` primitive lazy-mounts its p5 canvas off an
 *      IntersectionObserver, and a display:none wrapper has no box,
 *      so the observer would never fire and any sketch on slide 2+
 *      would stay permanently blank. Inactive slides are instead
 *      taken out of flow and hidden with `visibility`, which keeps
 *      their box (and therefore the observer) alive. See
 *      `.split-carousel` in app/project-split.css.
 */
// Credits portal themselves into the text rail on split pages (see
// components/content/Text.tsx), leaving an empty `-credits` piece
// behind. Excluding it here stops the carousel ending on a blank
// slide. The `-credits` suffix is an existing project convention,
// already relied on by `.piece[data-piece-id$="-credits"]` rules in
// project-page.css.
const V2_SLIDES = '.piece:not([data-piece-id$="-credits"])';
// Legacy projects (paintings) never render `<Piece>`: their MDX is
// top-level `<Figure>` / `<Row>` / `<Video>`, which come out as
// `.row` / `figure.image` / `.piece-layout` directly under `<main>`.
// Same two-tier discovery `ScrollAffordances` uses, so a legacy body
// works in this template without rewriting its MDX into v2 pieces.
const LEGACY_SLIDES =
  ":scope > .row, :scope > figure.image, :scope > .piece-layout, " +
  ":scope > .video, :scope > .project-track > .row, " +
  ":scope > .project-track > figure.image";

function findSlides(root: HTMLElement): HTMLElement[] {
  const v2 = Array.from(root.querySelectorAll<HTMLElement>(V2_SLIDES));
  if (v2.length) return v2;
  return Array.from(root.querySelectorAll<HTMLElement>(LEGACY_SLIDES));
}

export function SplitMediaCarousel({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);

  // Discover slides after mount. MDX bodies render server-side, so the
  // slots exist by the time this runs.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Tag whatever we found so CSS can key off one attribute instead of
    // needing a selector per legacy primitive.
    const slides = findSlides(root);
    slides.forEach((el) => {
      el.dataset.carouselSlide = "";
    });
    setCount(slides.length);
  }, []);

  // Reflect the active index onto the slides for CSS to act on.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const slides = findSlides(root);
    slides.forEach((el, i) => {
      el.dataset.carouselActive = i === index ? "true" : "false";
    });
  }, [index, count]);

  const step = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        if (count <= 0) return prev;
        return (prev + delta + count) % count;
      });
    },
    [count],
  );

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Let the slide's own controls win. Without this the eye toggle
      // would flip observation state AND advance the slide.
      // NB: `canvas` is deliberately NOT in this list. The sketch fills
      // its whole slide, so excluding it would make that slide the one
      // place the carousel can't be clicked through.
      if (
        (e.target as HTMLElement).closest(
          "button, a, input, select, textarea, [role='button']",
        )
      ) {
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      step(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
    },
    [step],
  );

  // Which half the pointer is over, so the cursor can show a caret
  // pointing the way a click would go. CSS can't vary `cursor` by
  // position within a single element, and splitting the box into two
  // overlay halves would sit on top of the slide's own controls (the
  // eternal-return eye toggle) and swallow their clicks. Tracking the
  // pointer and flipping one attribute keeps the single click handler
  // and its control-passthrough intact.
  const [half, setHalf] = useState<"left" | "right">("right");

  // Only meaningful with something to navigate to. On a single-slide
  // project the attribute is omitted entirely, so the caret cursors
  // (which key off `[data-carousel-half]`) never apply and the pointer
  // stays default: no affordance is shown for a click that can't go
  // anywhere.
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const next = e.clientX - rect.left < rect.width / 2 ? "left" : "right";
    setHalf((prev) => (prev === next ? prev : next));
  }, []);

  // Slide counter lives under the title in the RAIL, which is a
  // sibling subtree rendered by the server template, while the index
  // is client state in here. Portalling avoids lifting carousel state
  // into a context that wraps both columns just to print two numbers.
  // Same approach `<Credits>` uses to reach the rail.
  const [countSlot, setCountSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setCountSlot(document.getElementById("split-count-slot"));
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    },
    [step],
  );

  return (
    <div
      ref={rootRef}
      className="split-carousel"
      data-carousel-ready={count > 0 ? "true" : "false"}
      {...(count > 1 ? { "data-carousel-half": half } : {})}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onKeyDown={onKeyDown}
      role="group"
      aria-roledescription="carousel"
      aria-label={
        count > 0 ? `Project media, slide ${index + 1} of ${count}` : "Project media"
      }
      tabIndex={0}
    >
      {/* Rendered into the rail. Hidden from assistive tech: the
          wrapper's `aria-label` already announces "slide N of M", so
          exposing this too would read the position twice. */}
      {countSlot && count > 1
        ? createPortal(
            <span className="split-count" aria-hidden="true">
              Slides {index + 1}/{count}
            </span>,
            countSlot,
          )
        : null}
      {children}
    </div>
  );
}
