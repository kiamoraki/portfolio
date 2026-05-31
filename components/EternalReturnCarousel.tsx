"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import {
  EternalReturnUnobservedCanvas,
  type EternalReturnCanvasController,
} from "@/components/sketches/EternalReturnUnobservedCanvas";
import { useReportCarouselState } from "@/components/CarouselState";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<
  string,
  { width: number; height: number }
>;

type ImageRef = { src: string; alt?: string };
type Slide =
  | { type: "unobserved" }
  | { type: "observed" }
  | { type: "image"; src: string; alt?: string }
  | { type: "grid"; cols: number; rows: number; srcs: ImageRef[] };

const SLIDES: Slide[] = [
  { type: "unobserved" },
  { type: "observed" },
  { type: "image", src: "/img/eternal_return/2012-kirby-eternal_return-install.jpg", alt: "Install" },
  {
    type: "grid",
    cols: 2,
    rows: 2,
    srcs: [
      { src: "/img/eternal_return/2012-kirby-eternal_return-colorboard.jpg", alt: "Color board" },
      { src: "/img/eternal_return/2012-kirby-eternal_return-multiple_single.png", alt: "Multiple → single" },
      { src: "/img/eternal_return/2012-kirby-eternal_return-single_multiple.png", alt: "Single → multiple" },
      { src: "/img/eternal_return/2012-kirby-eternal_return-diagram-interaction_zone.jpg", alt: "Interaction zone diagram" },
    ],
  },
  {
    type: "grid",
    cols: 2,
    rows: 1,
    srcs: [
      { src: "/img/eternal_return/2012-kirby-eternal_return-hardware.jpg", alt: "Hardware" },
      { src: "/img/eternal_return/2012-kirby-eternal_return-transmitter_receiver.png", alt: "Transmitter / receiver" },
    ],
  },
];

const TRANSITION_MS = 500;

function MobileImg({ src, alt, sizes = "100vw" }: { src: string; alt?: string; sizes?: string }) {
  const dims = manifest[src];
  const style = { width: "100%", height: "auto", display: "block" } as const;
  if (dims) {
    return (
      <Image
        src={src}
        alt={alt ?? ""}
        width={dims.width}
        height={dims.height}
        sizes={sizes}
        style={style}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ""} style={style} />;
}

// Mirrors the canvas's own grid sizing so the container height fits an exact
// number of width-derived square cells. Locked to 4 cols × 7 rows for mobile.
const ER_MOBILE_COLS = 4;
const ER_MOBILE_ROWS = 7;
function computeUnobservedHeight(viewportW: number): number {
  const cellSize = viewportW / ER_MOBILE_COLS;
  return cellSize * ER_MOBILE_ROWS;
}

function EternalReturnMobileLayout() {
  // Pluck slides by type to drive the mobile layout.
  const installSlide = SLIDES.find((s) => s.type === "image" && s.src.includes("install")) as
    | { type: "image"; src: string; alt?: string }
    | undefined;
  const grid2x2 = SLIDES.find((s) => s.type === "grid" && s.rows === 2) as
    | { type: "grid"; cols: number; rows: number; srcs: ImageRef[] }
    | undefined;
  const grid2x1 = SLIDES.find((s) => s.type === "grid" && s.rows === 1) as
    | { type: "grid"; cols: number; rows: number; srcs: ImageRef[] }
    | undefined;

  const [unobservedHeight, setUnobservedHeight] = useState<number | null>(null);
  useEffect(() => {
    const compute = () => {
      setUnobservedHeight(computeUnobservedHeight(window.innerWidth));
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  // Single canvas driven by the eye toggle: closed eye = unobserved grid,
  // open eye = observed convergence. Replaces the previous two stacked
  // unobserved/observed canvases.
  const controller = useRef<EternalReturnCanvasController | null>(null);
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    controller.current?.setTriggered(triggered);
  }, [triggered]);

  return (
    <div className="er-mobile">
      <div
        className="er-mobile-canvas er-mobile-canvas--unobserved"
        style={{
          position: "relative",
          ...(unobservedHeight != null ? { height: unobservedHeight } : {}),
        }}
      >
        <EternalReturnUnobservedCanvas
          ref={controller}
          inFlow
          controlled
          fitWidth
          cols={ER_MOBILE_COLS}
        />
        <EyeToggle triggered={triggered} onChange={setTriggered} />
      </div>
      {installSlide ? (
        <div className="er-mobile-image">
          <MobileImg src={installSlide.src} alt={installSlide.alt} />
        </div>
      ) : null}
      {grid2x2 ? (
        <div className="er-mobile-grid">
          {grid2x2.srcs.map((img, i) => (
            <MobileImg key={i} src={img.src} alt={img.alt} sizes="50vw" />
          ))}
        </div>
      ) : null}
      {grid2x1
        ? grid2x1.srcs.map((img, i) => (
            <div key={i} className="er-mobile-image">
              <MobileImg src={img.src} alt={img.alt} />
            </div>
          ))
        : null}
    </div>
  );
}

function EyeIcon({ type }: { type: "open" | "closed" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 22,
    height: 22,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (type === "open") {
    return (
      <svg {...common}>
        <path d="M2 12 C 5 5, 19 5, 22 12 C 19 19, 5 19, 2 12 Z" />
        <circle cx={12} cy={12} r={3} />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M2 10 C 5 17, 19 17, 22 10" />
      {/* Eyelashes — short strokes fanning down off the lid. */}
      <line x1={5} y1={13.5} x2={3.5} y2={16.5} />
      <line x1={8.5} y1={14.8} x2={7.5} y2={17.5} />
      <line x1={12} y1={15.3} x2={12} y2={18.2} />
      <line x1={15.5} y1={14.8} x2={16.5} y2={17.5} />
      <line x1={19} y1={13.5} x2={20.5} y2={16.5} />
    </svg>
  );
}

function EyeToggle({
  triggered,
  onChange,
}: {
  triggered: boolean;
  onChange: (v: boolean) => void;
}) {
  const wrap: CSSProperties = {
    position: "absolute",
    // Sit at the bottom of the canvas, centered horizontally between
    // the meta-carousel prev/next buttons (which are also at bottom:
    // 1rem). The toggle's own z-index (11) sits above the nav strip
    // (z-index: 10) so it's never occluded.
    bottom: "1rem",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 12,
    zIndex: 11,
    pointerEvents: "auto",
  };

  const button = (active: boolean): CSSProperties => ({
    width: 48,
    height: 48,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? "rgba(181, 136, 255, 0.22)" : "rgba(0, 0, 0, 0.45)",
    border: `1px solid ${active ? "rgba(181, 136, 255, 0.95)" : "rgba(255, 255, 255, 0.25)"}`,
    borderRadius: "999px",
    color: active ? "#fff" : "rgba(255, 255, 255, 0.65)",
    cursor: "pointer",
    padding: 0,
    transition: "background 150ms ease, border-color 150ms ease, color 150ms ease",
  });

  return (
    <div style={wrap}>
      <button
        type="button"
        onClick={() => onChange(false)}
        aria-label="Unobserved"
        aria-pressed={!triggered}
        style={button(!triggered)}
      >
        <EyeIcon type="closed" />
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        aria-label="Observed"
        aria-pressed={triggered}
        style={button(triggered)}
      >
        <EyeIcon type="open" />
      </button>
    </div>
  );
}

export function EternalReturnCarousel() {
  const controller = useRef<EternalReturnCanvasController | null>(null);
  const N = SLIDES.length;
  // pos: 0 = clone of last slide, 1..N = real slides, N+1 = clone of first slide
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const wrappingRef = useRef(false);
  const racingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Map a track position back to its logical slide index (0..N-1).
  const logicalIndex = (p: number): number => {
    if (p <= 0) return N - 1;
    if (p >= N + 1) return 0;
    return p - 1;
  };


  // Triggered (observed) state is tracked in React so the eye-toggle buttons
  // can both reflect it and drive it. Two effects keep things in sync:
  //   1. Slide changes flip triggered automatically (so swiping to the
  //      observed slide still works).
  //   2. Any triggered change is pushed down to the canvas controller.
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const slide = SLIDES[logicalIndex(pos)];
    setTriggered(slide.type === "observed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  useEffect(() => {
    controller.current?.setTriggered(triggered);
  }, [triggered]);

  // Pulse racing whenever we begin moving to a new slide. Holds racing on
  // long enough for the slide transition to finish.
  const pulseRacing = () => {
    controller.current?.setRacing(true);
    if (racingTimeoutRef.current) clearTimeout(racingTimeoutRef.current);
    racingTimeoutRef.current = setTimeout(() => {
      controller.current?.setRacing(false);
      racingTimeoutRef.current = null;
    }, TRANSITION_MS + 50);
  };

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
    pulseRacing();
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
    pulseRacing();
    setPos((p) => {
      if (p <= 1) {
        wrapAfterAnimation(N);
        return 0;
      }
      return p - 1;
    });
  };

  useReportCarouselState(logicalIndex(pos), N, prev, next);

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

  const renderedSlides = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];

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

  const slideBase: CSSProperties = {
    width: "100vw",
    height: "100vh",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
  };

  const slideForType = (t: Slide["type"]): CSSProperties => {
    if (t === "unobserved" || t === "observed") return { ...slideBase, position: "relative" };
    if (t === "image") return slideBase;
    return { ...slideBase, padding: "3vh 3vw" };
  };

  return (
    <>
      <EternalReturnUnobservedCanvas ref={controller} controlled />
      <EternalReturnMobileLayout />

      <div className="project-desktop-carousel" style={wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={track}>
          {renderedSlides.map((s, i) => (
            <div key={i} style={slideForType(s.type)}>
              {s.type === "unobserved" ? (
                <EyeToggle
                  triggered={triggered}
                  onChange={setTriggered}
                />
              ) : null}
              {s.type === "image" ? (
                (() => {
                  const dims = manifest[s.src];
                  const imgStyle: CSSProperties = {
                    maxWidth: "100%",
                    maxHeight: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  };
                  if (!dims) {
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img src={s.src} alt={s.alt ?? ""} style={imgStyle} />;
                  }
                  return (
                    <Image
                      src={s.src}
                      alt={s.alt ?? ""}
                      width={dims.width}
                      height={dims.height}
                      sizes="100vw"
                      loading="eager"
                      style={imgStyle}
                    />
                  );
                })()
              ) : s.type === "grid" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${s.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${s.rows}, 1fr)`,
                    gap: "1.5vh",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {s.srcs.map((img, j) => {
                    const dims = manifest[img.src];
                    const imgStyle: CSSProperties = {
                      maxWidth: "100%",
                      maxHeight: "100%",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                    };
                    return (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 0,
                          minHeight: 0,
                        }}
                      >
                        {dims ? (
                          <Image
                            src={img.src}
                            alt={img.alt ?? ""}
                            width={dims.width}
                            height={dims.height}
                            sizes="50vw"
                            loading="eager"
                            style={imgStyle}
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img.src} alt={img.alt ?? ""} style={imgStyle} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
