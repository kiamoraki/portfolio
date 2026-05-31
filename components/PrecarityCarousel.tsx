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

type ImageRef = { src: string; alt?: string };
type Slide = { srcs: ImageRef[] };

const SLIDES: Slide[] = [
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-peekinside.jpg",
        alt: "Peek inside",
      },
    ],
  },
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-09.png",
        alt: "Precarity",
      },
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-11.png",
        alt: "Precarity",
      },
    ],
  },
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-01.png",
        alt: "Precarity",
      },
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-04.png",
        alt: "Precarity",
      },
    ],
  },
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-05.png",
        alt: "Precarity",
      },
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-02.png",
        alt: "Precarity",
      },
    ],
  },
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-06.png",
        alt: "Precarity",
      },
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-07.png",
        alt: "Precarity",
      },
    ],
  },
  {
    srcs: [
      {
        src: "/img/precarity_a_domestic_tale/2015-kirby-precarity_a_domestic_tale-sketch.jpg",
        alt: "Sketch",
      },
    ],
  },
];

const MOBILE_IMAGES: MobileImage[] = SLIDES.flatMap((s) => s.srcs);

const TRANSITION_MS = 500;

export function PrecarityCarousel() {
  const N = SLIDES.length;
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
    padding: "3vh 3vw",
    boxSizing: "border-box",
  };

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
        {renderedSlides.map((s, i) => (
          <div key={i} style={slide}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${s.srcs.length}, 1fr)`,
                gap: "2vw",
                width: "100%",
                height: "100%",
              }}
            >
              {s.srcs.map((img, j) => {
                const dims = manifest[img.src];
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
                        sizes="80vw"
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
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
