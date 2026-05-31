"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LissajousFullCanvas } from "@/components/sketches/LissajousFullCanvas";
import { LissajousGridCanvas } from "@/components/sketches/LissajousGridCanvas";
import { LissajousPortraitsCanvas } from "@/components/sketches/LissajousPortraitsCanvas";
import { MirrorCanvas } from "@/components/sketches/MirrorCanvas";
import { useReportCarouselState } from "@/components/CarouselState";

type SlideKind = "full" | "grid" | "portraits";
const SLIDES: SlideKind[] = ["full", "grid", "portraits"];
const TRANSITION_MS = 500;

export function LissajousCarousel() {
  const N = SLIDES.length;
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const wrappingRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

  // Refs to the real full/portraits canvases so the clone slots can mirror
  // them via drawImage instead of running their own p5 sketches. This keeps
  // the wrap-around visually identical to the real slide and prevents the
  // jump that happened when the carousel snapped from a clone to its real
  // counterpart.
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const portraitsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const logicalPos = pos <= 0 ? N - 1 : pos >= N + 1 ? 0 : pos - 1;

  const wrapAfterAnimation = (snapTo: number) => {
    wrappingRef.current = true;
    setTimeout(() => {
      setAnimate(false);
      setPos(snapTo);
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

  const renderedSlides: SlideKind[] = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];

  const wrapper: CSSProperties = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
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
    overflow: "hidden",
  };

  return (
    <>
      <div className="lissajous-mobile-stack">
        <div className="lissajous-mobile-cell">
          <LissajousFullCanvas inFlow />
        </div>
        <div className="lissajous-mobile-cell">
          <LissajousGridCanvas inFlow />
        </div>
        <div className="lissajous-mobile-cell">
          <LissajousPortraitsCanvas inFlow />
        </div>
      </div>
      <div className="project-desktop-carousel lissajous-carousel" style={wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div style={track}>
        {renderedSlides.map((kind, i) => {
          const slotActive = pos === i;
          // Slots 0 and N+1 are wrap-around clones of the last and first
          // real slides — render mirrors of the real canvas instead of
          // independent p5 instances.
          const isCloneSlot = i === 0 || i === renderedSlides.length - 1;
          // The real full/portraits instances must keep ticking whenever
          // their clone might be visible (mid-wrap), so feed them an
          // isActive that stays true for any pos that's touching their
          // clone slot too.
          const fullActive = pos === 1 || pos === renderedSlides.length - 1;
          const portraitsActive = pos === N || pos === 0;
          return (
            <div key={i} style={slide}>
              {isCloneSlot ? (
                kind === "full" ? (
                  <MirrorCanvas sourceRef={fullCanvasRef} />
                ) : (
                  <MirrorCanvas sourceRef={portraitsCanvasRef} />
                )
              ) : kind === "full" ? (
                <LissajousFullCanvas
                  isActive={fullActive}
                  canvasRef={fullCanvasRef}
                />
              ) : kind === "grid" ? (
                <LissajousGridCanvas isActive={slotActive} />
              ) : (
                <LissajousPortraitsCanvas
                  isActive={portraitsActive}
                  canvasRef={portraitsCanvasRef}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
