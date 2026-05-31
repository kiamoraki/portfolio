"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReportCarouselState } from "@/components/CarouselState";
import { Wave1Canvas } from "@/components/sketches/Wave1Canvas";
import { Wave2Canvas } from "@/components/sketches/Wave2Canvas";
import { Wave3Canvas } from "@/components/sketches/Wave3Canvas";
import { Wave4Canvas } from "@/components/sketches/Wave4Canvas";
import { Wave5Canvas } from "@/components/sketches/Wave5Canvas";
import { Wave6Canvas } from "@/components/sketches/Wave6Canvas";

const GRIDS = [
  Wave1Canvas,
  Wave6Canvas,
  Wave2Canvas,
  Wave3Canvas,
  Wave4Canvas,
  Wave5Canvas,
];

const TRANSITION_MS = 500;

export function WaveGrids() {
  const N = GRIDS.length;
  // `pos` indexes into the rendered track which has clone-edges:
  //   slot 0   = clone of last grid
  //   slots 1..N = real grids
  //   slot N+1 = clone of first grid
  // The carousel starts on the first real grid (slot 1).
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const wrappingRef = useRef(false);

  const logicalPos = pos <= 0 ? N - 1 : pos >= N + 1 ? 0 : pos - 1;

  const wrapAfterAnimation = (snapTo: number) => {
    wrappingRef.current = true;
    setTimeout(() => {
      setAnimate(false);
      setPos(snapTo);
      // Two rAFs so the browser applies the no-transition position
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
    if (wrappingRef.current) return;
    setPos((p) => {
      if (p >= N) {
        wrapAfterAnimation(1);
        return N + 1;
      }
      return p + 1;
    });
  };

  const prev = () => {
    if (wrappingRef.current) return;
    setPos((p) => {
      if (p <= 1) {
        wrapAfterAnimation(N);
        return 0;
      }
      return p - 1;
    });
  };

  useReportCarouselState(logicalPos, N, prev, next);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) next();
    else prev();
  };

  const renderedSlides = [GRIDS[N - 1], ...GRIDS, GRIDS[0]];

  const wrapper: CSSProperties = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    background: "#000",
  };

  const track: CSSProperties = {
    display: "flex",
    width: `${renderedSlides.length * 100}vw`,
    height: "100vh",
    transform: `translateX(-${pos * 100}vw)`,
    transition: animate ? `transform ${TRANSITION_MS}ms ease` : "none",
  };

  const slide: CSSProperties = {
    width: "100vw",
    height: "100vh",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const cell: CSSProperties = {
    width: "min(100vh, 100vw)",
    height: "min(100vh, 100vw)",
    flexShrink: 0,
  };

  return (
    <>
      <div className="wave-mobile-stack">
        {GRIDS.map((Grid, i) => (
          <div key={i} className="wave-mobile-cell">
            <Grid />
          </div>
        ))}
      </div>
      <div
        className="project-desktop-carousel wave-carousel"
        style={wrapper}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div style={track}>
          {renderedSlides.map((Grid, i) => (
            <div key={i} style={slide}>
              <div style={cell}>
                <Grid />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
