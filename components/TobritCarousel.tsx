"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Image from "next/image";
import { TobritCanvas } from "@/components/sketches/TobritCanvas";
import { useReportCarouselState } from "@/components/CarouselState";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<
  string,
  { width: number; height: number }
>;

type ImageRef = { src: string; alt?: string };
type Slide =
  | { type: "sketch" }
  | { type: "image"; src: string; alt?: string; cover?: boolean }
  | { type: "grid"; cols: number; rows: number; srcs: ImageRef[] }
  | { type: "row"; srcs: ImageRef[] }
  | { type: "text"; content: ReactNode };

const CREDITS_COL_1: Array<[string, string]> = [
  ["Director / Exec. Producer", "The Eye of Disorient"],
  ["Producer", "Ria R."],
  ["Design Advisor", "Lowroad"],
  ["Metal Fabrication", "Simas B."],
  ["Generative design", "Nick C."],
  ["BM Artery Liaison", "Ria R."],
  ["Engineer Liaison", "The Eye"],
];
const CREDITS_COL_2: Array<[string, string]> = [
  ["Purgatory Assembly Lead", "John F."],
  ["OH Assembly Lead", "Pinky"],
  ["Fresco", "Kirby"],
  ["Lights", "Solpix v.0.3 evolution"],
  ["Design", "The Eye"],
  ["Electronics", "Matt M."],
  ["Assembly", "Jacob J."],
];
const CREDITS_COL_3: Array<[string, string]> = [
  ["Burn Lead", "Johnny B."],
  ["Perimeter Leads", "Naim B., Brandon S."],
  ["Logistics", "So On It"],
  ["Purchasing", "Nitro"],
  ["Legal", "Jonny B. Bad"],
  ["Identity / Graphics", "The Eye"],
  ["Fundraising", "Jasmine Y."],
];

function CreditsColumn({ rows }: { rows: Array<[string, string]> }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {rows.map(([role, person]) => (
        <li key={role}>
          <strong>{role}:</strong> {person}
        </li>
      ))}
    </ul>
  );
}

const SLIDES: Slide[] = [
  {
    type: "image",
    src: "/img/TOBRIT/Kirby_TOBRIT_tobrit_dot_com-1.jpg",
    alt: "TOBRIT",
    cover: true,
  },
  {
    type: "grid",
    cols: 2,
    rows: 1,
    srcs: [
      { src: "/img/TOBRIT/Kirby_TOBRIT_sketch.jpg", alt: "Sketch" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_process.png", alt: "8-panel plan" },
    ],
  },
  {
    type: "grid",
    cols: 3,
    rows: 2,
    srcs: [
      { src: "/img/TOBRIT/Kirby_TOBRIT_jakob_markus_heer-1.jpg", alt: "Build" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_riafish-3.jpg", alt: "Build" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_jakob_markus_heer-2.jpg", alt: "Build" },
      
      { src: "/img/TOBRIT/Kirby_TOBRIT_disgaux-2.jpg", alt: "Build" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_jakob_markus_heer-3.jpg", alt: "Painting" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_disgaux-1.jpg", alt: "Build" },
    ],
  },
  { type: "image", src: "/img/TOBRIT/Kirby_TOBRIT_tobrit_dot_com-2.jpg", alt: "Become Brad" },
  {
    type: "row",
    srcs: [
      { src: "/img/TOBRIT/Kirby_TOBRIT_trevorburnzy.jpg", alt: "The Vessel" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_maruquevedo-2.jpg", alt: "TOBRIT" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_day___time-1.jpg", alt: "PORNJ Brad" },
    ],
  },
  {
    type: "grid",
    cols: 2,
    rows: 1,
    srcs: [
      { src: "/img/TOBRIT/Kirby_TOBRIT_geodesictemple.jpg", alt: "Release" },
      { src: "/img/TOBRIT/Kirby_TOBRIT_day___time-2.jpg", alt: "Relic" },
    ],
  },
  {
    type: "text",
    content: (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "2rem",
          fontSize: "0.9rem",
          maxWidth: 1000,
          padding: "0 1rem",
          lineHeight: 1.6,
        }}
      >
        <CreditsColumn rows={CREDITS_COL_1} />
        <CreditsColumn rows={CREDITS_COL_2} />
        <CreditsColumn rows={CREDITS_COL_3} />
      </div>
    ),
  },
];

const TRANSITION_MS = 500;

function renderSlideBody(s: Slide, imgStyle: CSSProperties): ReactNode {
  if (s.type === "sketch") return null;
  if (s.type === "image") {
    const dims = manifest[s.src];
    const style: CSSProperties = s.cover
      ? {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }
      : imgStyle;
    if (!dims) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={s.src} alt={s.alt ?? ""} style={style} />;
    }
    return (
      <Image
        src={s.src}
        alt={s.alt ?? ""}
        width={dims.width}
        height={dims.height}
        sizes="100vw"
        loading="eager"
        style={style}
      />
    );
  }
  if (s.type === "grid") {
    return (
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
    );
  }
  if (s.type === "row") {
    // Each image is set to fill the row's height; widths flow from each
    // image's native aspect ratio. The whole row is sized so that its
    // total width never exceeds the viewport: we cap the row's height by
    // both the available viewport height and the available viewport
    // width divided by the combined aspect ratio of every image.
    const ratios = s.srcs.map((img) => {
      const dims = manifest[img.src];
      if (!dims) return 1;
      return dims.width / dims.height;
    });
    const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
    const gapVw = 1.5;
    const totalGapVw = gapVw * (s.srcs.length - 1);
    // 94vw available width inside the slide (slide has 2vw side padding)
    const maxHeightFromWidth = `calc((96vw - ${totalGapVw}vw) / ${totalRatio})`;
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          gap: `${gapVw}vw`,
        }}
      >
        {s.srcs.map((img, j) => {
          const dims = manifest[img.src];
          const rowImgStyle: CSSProperties = {
            height: `min(94vh, ${maxHeightFromWidth})`,
            width: "auto",
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
          };
          return dims ? (
            <Image
              key={j}
              src={img.src}
              alt={img.alt ?? ""}
              width={dims.width}
              height={dims.height}
              sizes="33vw"
              loading="eager"
              style={rowImgStyle}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={j} src={img.src} alt={img.alt ?? ""} style={rowImgStyle} />
          );
        })}
      </div>
    );
  }
  return s.content;
}

export function TobritCarousel() {
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
    overflow: "hidden",
  };

  const slideForType = (t: Slide["type"]): CSSProperties => {
    if (t === "sketch") return slideBase;
    if (t === "image") return slideBase;
    if (t === "text") return { ...slideBase, padding: "8vh 4vw" };
    if (t === "row") return { ...slideBase, padding: "3vh 2vw" };
    return { ...slideBase, padding: "3vh 3vw" };
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
      <TobritCanvas />
      <div className="project-mobile-stack">
        {SLIDES.map((s, i) => (
          <MobileSlide key={i} slide={s} />
        ))}
      </div>
      <div
        className="project-desktop-carousel"
        style={wrapper}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div style={track}>
          {renderedSlides.map((s, i) => (
            <div key={i} style={slideForType(s.type)}>
              {renderSlideBody(s, imgStyle)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const MOBILE_HIDDEN_SRCS = new Set<string>([
  "/img/TOBRIT/Kirby_TOBRIT_maruquevedo-2.jpg",
]);

// Per-image overrides applied only in the mobile stack — e.g. swap a
// landscape desktop layout for a portrait-friendly variant.
const MOBILE_SRC_OVERRIDES: Record<string, string> = {};

function MobileImage({ src, alt, sizes }: { src: string; alt?: string; sizes: string }) {
  const finalSrc = MOBILE_SRC_OVERRIDES[src] ?? src;
  const dims = manifest[finalSrc];
  const style = { width: "100%", height: "auto", display: "block" };
  if (dims) {
    return (
      <Image
        src={finalSrc}
        alt={alt ?? ""}
        width={dims.width}
        height={dims.height}
        sizes={sizes}
        style={style}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={finalSrc} alt={alt ?? ""} style={style} />;
}

function MobileSlide({ slide }: { slide: Slide }) {
  if (slide.type === "sketch") return null;
  if (slide.type === "image") {
    if (slide.cover) {
      return (
        <div className="project-mobile-slide project-mobile-slide--cover">
          <MobileImage src={slide.src} alt={slide.alt} sizes="100vw" />
        </div>
      );
    }
    return (
      <div className="project-mobile-slide project-mobile-slide--single">
        <MobileImage src={slide.src} alt={slide.alt} sizes="100vw" />
      </div>
    );
  }
  if (slide.type === "grid") {
    const visible = slide.srcs.filter((img) => !MOBILE_HIDDEN_SRCS.has(img.src));
    if (visible.length === 0) return null;
    // The build-photo grid: arrange the first 4 as a 2x2 and stack any extras.
    const isBuildGrid =
      visible.length === 6 &&
      visible[0].src.includes("jakob_markus_heer-1");
    if (isBuildGrid) {
      const first4 = visible.slice(0, 4);
      const rest = visible.slice(4);
      return (
        <>
          <div className="project-mobile-slide project-mobile-slide--grid-2x2">
            {first4.map((img, j) => (
              <MobileImage key={j} src={img.src} alt={img.alt} sizes="50vw" />
            ))}
          </div>
          {rest.length > 0 ? (
            <div className="project-mobile-slide project-mobile-slide--stack">
              {rest.map((img, j) => (
                <MobileImage key={j} src={img.src} alt={img.alt} sizes="100vw" />
              ))}
            </div>
          ) : null}
        </>
      );
    }
    return (
      <div className="project-mobile-slide project-mobile-slide--stack">
        {visible.map((img, j) => (
          <MobileImage key={j} src={img.src} alt={img.alt} sizes="100vw" />
        ))}
      </div>
    );
  }
  if (slide.type === "row") {
    const visible = slide.srcs.filter((img) => !MOBILE_HIDDEN_SRCS.has(img.src));
    if (visible.length === 0) return null;
    return (
      <div className="project-mobile-slide project-mobile-slide--pair">
        {visible.map((img, j) => (
          <MobileImage key={j} src={img.src} alt={img.alt} sizes="50vw" />
        ))}
      </div>
    );
  }
  if (slide.type === "text") {
    return (
      <div className="project-mobile-slide project-mobile-slide--text">
        {slide.content}
      </div>
    );
  }
  return null;
}
