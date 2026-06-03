"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent,
} from "react";
import { useReportCarouselState } from "@/components/CarouselState";

const TRANSITION_MS = 450;

type Props = {
  slides: ReactNode[];
};

export function MetaCarousel({ slides }: Props) {
  const N = slides.length;
  // Clone-edge layout (same trick WaveGrids uses) so the carousel loops
  // smoothly past the ends instead of dead-ending:
  //   slot 0       = clone of slides[N - 1]
  //   slots 1..N   = real slides
  //   slot N + 1   = clone of slides[0]
  // We start on slot 1 (the first real slide). When the user advances
  // past slot N, we slide to the clone at N + 1 (which looks like
  // slide 0), then once the transition finishes we snap pos back to 1
  // with the transition disabled — the visual is identical so the user
  // never sees the jump.
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [activeTitle, setActiveTitle] = useState<string>("");
  const [activeDescription, setActiveDescription] = useState<string>("");
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const wrappingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Slugs whose canvas/video uses a light (white-ish) background.
  // When the carousel lands on one of these, we mirror that state to a
  // body class so the fixed-position sidebar icons + bottom prev/next
  // can switch to dark colors via plain CSS (mix-blend-mode doesn't
  // reliably reach across the icons' separate stacking context).
  const LIGHT_BG_SLUGS = new Set<string>([
    "emergence",
    "ac-video-1",
    "ac-video-2",
    "tobrit",
    "mars",
    "radioactivitea",
    "artificial-consciousness",
    "dojo",
  ]);

  // Update `body.light-slide` and `body[data-meta-active-slug]` to
  // match the currently-visible slide. `data-meta-active-slug` lets
  // CSS scope per-slide overlays (e.g. the TOBRIT falling-faces
  // canvas, which is portaled to body but should only paint while
  // TOBRIT is the active slide).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const track = trackRef.current;
    if (!track) return;
    // Each slide is a `.project-track` (the slide slot). Was
    // `.meta-carousel-slide` before unification — TagCarousel now
    // emits `.project-track > .project-track-content` per slide so
    // the meta carousel uses the same class names as the project
    // page's <ProjectRenderer>.
    const slideEls = track.querySelectorAll<HTMLElement>(
      ".meta-carousel-track > .project-track",
    );
    const active = slideEls[pos];
    const slug =
      active?.querySelector<HTMLElement>("[data-slug]")?.dataset.slug ?? "";
    const title =
      active?.querySelector<HTMLElement>("[data-title]")?.dataset.title ?? "";
    const description =
      active?.querySelector<HTMLElement>("[data-description]")?.dataset
        .description ?? "";
    setActiveTitle(title);
    setActiveDescription(description);
    // Close the description dropdown whenever the active slide changes
    // so the user starts fresh on each new slide instead of inheriting
    // the previous slide's open/closed state.
    setDescriptionOpen(false);
    document.body.classList.toggle("light-slide", LIGHT_BG_SLUGS.has(slug));
    document.body.dataset.metaActiveSlug = slug;
    // Cleanup on unmount so the body class + attr don't linger after
    // navigating away from a meta carousel page.
    return () => {
      if (typeof document !== "undefined") {
        document.body.classList.remove("light-slide");
        delete document.body.dataset.metaActiveSlug;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, N]);

  const wrapAfterAnimation = (snapTo: number) => {
    wrappingRef.current = true;
    setTimeout(() => {
      setAnimate(false);
      setPos(snapTo);
      // Two rAFs so the browser commits the no-transition position
      // before we re-enable transitions for the next move.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          wrappingRef.current = false;
        });
      });
    }, TRANSITION_MS);
  };

  const next = () => {
    if (wrappingRef.current || N === 0) return;
    setPos((p) => {
      if (p >= N) {
        wrapAfterAnimation(1);
        return N + 1;
      }
      return p + 1;
    });
  };

  const prev = () => {
    if (wrappingRef.current || N === 0) return;
    setPos((p) => {
      if (p <= 1) {
        wrapAfterAnimation(N);
        return 0;
      }
      return p - 1;
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [N]);

  // Register prev/next handlers on the CarouselStateContext so the
  // chrome's PREV/NEXT chips (ProjectNav + ProjectMobileBottomNav)
  // drive paging here instead of navigating between routes. Replaces
  // the in-component bottom prev/next buttons we used to render.
  useReportCarouselState(pos, N, prev, next);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  };

  // Render the clone-edged track: [last clone, ...real, first clone].
  const renderedSlides =
    N === 0 ? [] : [slides[N - 1], ...slides, slides[0]];

  const trackStyle: CSSProperties = {
    width: `${renderedSlides.length * 100}vw`,
    transform: `translateX(-${pos * 100}vw)`,
    transition: animate ? `transform ${TRANSITION_MS}ms ease` : "none",
  };

  return (
    <div
      className="meta-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Pinned, viewport-fixed title for the active slide. Rendered at
          the carousel level (not inside a transformed slide) so it
          stays truly fixed at top-right regardless of slide scroll or
          carousel transitions. Driven by the active slide's
          `data-title` + optional `data-description`. When the active
          project has a description, the title becomes a clickable
          button that toggles a dropdown panel showing the description
          text (▼ glyph appears next to the title text); when there's
          no description, the title is plain text with no glyph. */}
      {activeTitle ? (
        activeDescription ? (
          <button
            type="button"
            className="meta-carousel-active-title meta-carousel-active-title--has-description"
            aria-live="polite"
            aria-expanded={descriptionOpen}
            aria-controls="meta-carousel-description-panel"
            onClick={() => setDescriptionOpen((open) => !open)}
          >
            <span className="meta-carousel-active-title__text">
              {activeTitle}
            </span>
            {/* Downward-facing caret — same `stroke="currentColor"` SVG
                family as the rest of the chrome glyphs so it inherits
                the button's text color and follows the slide polarity
                in lockstep with the title text. Was a CSS border-
                triangle before; the SVG caret reads as part of the
                Neuropol nav family (matching strokes, not a filled
                solid). Rotates 180° when the description panel is
                open (the `transform` is on the SVG element). */}
            <svg
              className="meta-carousel-active-title__glyph"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
        ) : (
          <h2 className="meta-carousel-active-title" aria-live="polite">
            {activeTitle}
          </h2>
        )
      ) : null}
      {/* Dropdown panel — fixed below the navbar. Anchored via CSS to
          the same horizontal extent as the title chip so it reads as
          an extension of it. Animated via `data-open` attribute so
          the panel can scale / fade open without unmount churn. */}
      {activeDescription ? (
        <div
          id="meta-carousel-description-panel"
          className="meta-carousel-description-panel"
          data-open={descriptionOpen ? "true" : "false"}
          role="region"
          aria-label="Project description"
        >
          {activeDescription}
        </div>
      ) : null}
      <div
        ref={trackRef}
        className="meta-carousel-track"
        style={trackStyle}
      >
        {/* Each slide returned by TagCarousel is its own outer
            `.project-track` div, so we just render it directly here —
            no need for an additional `.meta-carousel-slide` wrapper.
            The querySelectorAll above targets `.meta-carousel-track >
            .project-track` to find these direct children. */}
        {renderedSlides.map((slide, i) => (
          <Fragment key={i}>{slide}</Fragment>
        ))}
      </div>
      {/* In-component bottom prev/next chips removed — the chrome's
          PREV/NEXT (ProjectNav + ProjectMobileBottomNav) now drives
          paging via `useReportCarouselState` above. */}
    </div>
  );
}
