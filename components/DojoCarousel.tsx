"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { useReportCarouselState } from "@/components/CarouselState";
import { ProjectMobileStack, type MobileImage } from "@/components/ProjectMobileStack";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<
  string,
  { width: number; height: number }
>;

type Slide = { src: string; alt: string; bg: string };

const SLIDES: Slide[] = [
  { src: "/img/dojo/dojo_dragon.jpg", alt: "Dragon", bg: "#f8c3fb" },
  { src: "/img/dojo/dojo_leopard.jpg", alt: "Leopard", bg: "#91bafa" },
  { src: "/img/dojo/dojo_snake.jpg", alt: "Snake", bg: "#dff46d" },
  { src: "/img/dojo/dojo_tiger.jpg", alt: "Tiger", bg: "#fff76f" },
  { src: "/img/dojo/dojo_crane.jpg", alt: "Crane", bg: "#b28b2c" },
];

const MOBILE_IMAGES: MobileImage[] = SLIDES.map((s) => ({ src: s.src, alt: s.alt }));

const TRANSITION_MS = 500;

export function DojoCarousel() {
  const N = SLIDES.length;
  // pos: 0 = clone of last slide, 1..N = real slides, N+1 = clone of first slide
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const wrappingRef = useRef(false);
  const touchStartX = useRef<number | null>(null);

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

  const slide = (bg: string): CSSProperties => ({
    width: "100vw",
    height: "100vh",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: bg,
    padding: "4vh 4vw",
    boxSizing: "border-box",
  });

  const imgStyle: CSSProperties = {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
  };

  return (
    <>
      <ProjectMobileStack images={MOBILE_IMAGES} />
      <div className="project-desktop-carousel" style={wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={track}>
        {renderedSlides.map((s, i) => {
          const dims = manifest[s.src];
          return (
            <div key={i} style={slide(s.bg)}>
              {dims ? (
                <Image
                  src={s.src}
                  alt={s.alt}
                  width={dims.width}
                  height={dims.height}
                  sizes="100vw"
                  loading="eager"
                  style={imgStyle}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt={s.alt} style={imgStyle} />
              )}
            </div>
          );
        })}
        </div>
      </div>
    </>
  );
}
