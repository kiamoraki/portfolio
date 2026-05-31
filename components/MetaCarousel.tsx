"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent,
} from "react";

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
  const touchStartX = useRef<number | null>(null);
  const wrappingRef = useRef(false);

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
      <div className="meta-carousel-track" style={trackStyle}>
        {renderedSlides.map((slide, i) => (
          <div key={i} className="meta-carousel-slide">
            {slide}
          </div>
        ))}
      </div>
      <div className="meta-carousel-nav" aria-hidden={N <= 1}>
        <button
          type="button"
          className="meta-carousel-btn meta-carousel-prev"
          onClick={prev}
          aria-label="Previous animation"
        >
          prev
        </button>
        <button
          type="button"
          className="meta-carousel-btn meta-carousel-next"
          onClick={next}
          aria-label="Next animation"
        >
          next
        </button>
      </div>
    </div>
  );
}
