"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import {
  useReportCarouselState,
  useReportInfoState,
} from "@/components/CarouselState";
import { ProjectMobileStack, type MobileImage } from "@/components/ProjectMobileStack";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<
  string,
  { width: number; height: number }
>;

type ImageRef = { src: string; alt?: string; flipY?: boolean };
type Slide =
  | { kind: "video"; src: string }
  | {
      kind: "images";
      srcs: ImageRef[];
      layout?:
        | "stack-left"
        | "grid-3x2"
        | "video-top-left"
        | "stack-pair-side"
        | "stack3-pair-side"
        | "grid-2x2"
        | "row-cover";
      videoSrc?: string;
      videoPosterSrc?: string;
    };

const SLIDES: Slide[] = [
  {
    kind: "images",
    layout: "video-top-left",
    videoSrc:
      "https://www.youtube-nocookie.com/embed/tA_SuSP5bcA?rel=0&modestbranding=1&iv_load_policy=3&loop=1&playlist=tA_SuSP5bcA",
    videoPosterSrc: "/img/mars/23-zeva-live-1.jpg",
    srcs: [
      { src: "/img/mars/23-zeva-snays-3.jpg", alt: "Zeva snays" },
      { src: "/img/mars/23-zeva-snays-2.jpg", alt: "Zeva snays" },
      { src: "/img/mars/23-zeva-live-1.jpg", alt: "Zeva live" },
      { src: "/img/mars/23-zeva-live-2.jpg", alt: "Zeva live" },
      { src: "/img/mars/23-zeva-live-3.jpg", alt: "Zeva live" },
    ],
  },
  {
    kind: "images",
    layout: "stack-pair-side",
    srcs: [
      { src: "/img/mars/23-moon-raves/nico.jpg", alt: "Nico" },
      { src: "/img/mars/23-moon-raves/alejandro-4.jpg", alt: "Alejandro" },
      { src: "/img/mars/23-moon-raves/joaquin.jpg", alt: "Joaquin" },
      { src: "/img/mars/23-moon-raves/adam.jpg", alt: "Adam" },
    ],
  },
  {
    kind: "images",
    layout: "stack-left",
    srcs: [
      { src: "/img/mars/23-moon-raves/cody.jpg", alt: "Cody" },
      { src: "/img/mars/23-moon-raves/karo.jpg", alt: "Karo" },
    ],
  },
  {
    kind: "images",
    layout: "stack3-pair-side",
    srcs: [
      { src: "/img/mars/23-moon-raves/laz-1.jpg", alt: "Laz" },
      { src: "/img/mars/23-moon-raves/laz-2.jpg", alt: "Laz" },
      { src: "/img/mars/23-moon-raves/mason.jpg", alt: "Mason" },
      { src: "/img/mars/23-moon-raves/spanky.jpg", alt: "Spanky" },
      { src: "/img/mars/23-moon-raves/laz-sub.jpg", alt: "Laz" },
    ],
  },
  {
    kind: "images",
    layout: "stack-left",
    srcs: [
      { src: "/img/mars/23-moon-raves/dauwke-2.jpg", alt: "Dauwke" },
      { src: "/img/mars/23-moon-raves/dauwke-1.jpg", alt: "Dauwke" },
      { src: "/img/mars/23-moon-raves/dauwke-3.jpg", alt: "Dauwke" },
    ],
  },
  {
    kind: "images",
    layout: "row-cover",
    srcs: [
      { src: "/img/mars/23-moon-raves/quad-seva-day.jpg", alt: "Quad Seva Day" },
      { src: "/img/mars/23-moon-raves/quad-seva-night.jpg", alt: "Quad Seva Night" },
      { src: "/img/mars/23-moon-raves/quad-3.jpg", alt: "Quad" },
    ],
  },
  {
    kind: "images",
    srcs: [{ src: "/img/mars/23-moon-raves/quad.jpg", alt: "Quad" }],
  },
  {
    kind: "images",
    layout: "grid-2x2",
    srcs: [
      { src: "/img/mars/23-moon-raves/seva.jpg", alt: "Seva" },
      { src: "/img/mars/23-moon-raves/laz-3.jpg", alt: "Laz" },
      { src: "/img/mars/23-moon-raves/will.jpg", alt: "Will" },
      { src: "/img/mars/23-moon-raves/me-1.jpg", alt: "Me" },
    ],
  },
  {
    kind: "images",
    srcs: [
      { src: "/img/mars/23-moon-raves/me-2.jpg", alt: "Me" },
      { src: "/img/mars/23-moon-raves/me-3.jpg", alt: "Me" },
      { src: "/img/mars/23-moon-raves/me.jpg", alt: "Me" },
    ],
  },
  {
    kind: "images",
    srcs: [
      { src: "/img/mars/23-moon-raves/beach.jpg", alt: "Beach" },
    ],
  },
];

const MOBILE_IMAGES: MobileImage[] = SLIDES.flatMap((s) => {
  if (s.kind === "images") return s.srcs.map((i) => ({ src: i.src, alt: i.alt }));
  return [];
});

const TRANSITION_MS = 500;

export function MoonRavesCarousel() {
  const N = SLIDES.length;
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [videoStarted, setVideoStarted] = useState(false);
  const [infoVisible, setInfoVisible] = useState(true);
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
  useReportInfoState(infoVisible, () => setInfoVisible((v) => !v));

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
      {infoVisible ? (
        <aside
          style={{
            position: "fixed",
            top: "calc(var(--spacing-nav-h) - 16px)",
            left: "var(--spacing-nav-h)",
            width: "min(360px, 90vw)",
            padding: "1.25rem 1.5rem",
            color: "var(--color-light)",
            background: "rgba(0, 0, 0, 0.85)",
            fontSize: "16px",
            lineHeight: 1.5,
            zIndex: 4000,
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            onClick={() => setInfoVisible(false)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              padding: 0,
              border: 0,
              background: "transparent",
              color: "var(--color-light)",
              cursor: "pointer",
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <line x1="5" y1="5" x2="19" y2="19" strokeLinecap="round" />
              <line x1="19" y1="5" x2="5" y2="19" strokeLinecap="round" />
            </svg>
          </button>
          <p style={{ margin: 0 }}>
            Creating culture, expanding creative practices through collaboration.
            At Mars, I&apos;m surrounded by creatives — world class live music
            visualists, 3D modelers, and creators building the algorithmic music
            scene from the ground up. Leading with empathy, compassion, and
            carrots, I came into the Mars season on a mission to build a tight
            crew of performers, to create a platform for others&apos; creative
            expression. No barriers to entry, a safe space to shake off
            performance jitters and just do it. And we did it.
          </p>
          <p style={{ margin: "0.75em 0 0" }}>
            Everyone&apos;s fam in the club.
          </p>
        </aside>
      ) : null}
      <div style={track}>
        {renderedSlides.map((s, i) => (
          <div key={i} style={slide}>
            {s.kind === "video" ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "min(100%, calc((100vh - 6vh) * 16 / 9))",
                    aspectRatio: "16 / 9",
                  }}
                >
                  <iframe
                    src={s.src}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    style={{
                      width: "100%",
                      height: "100%",
                      border: 0,
                      display: "block",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div
                style={
                  s.layout === "stack-left" && s.srcs.length === 3
                    ? {
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gridTemplateRows: "1fr 1fr",
                        gap: "2vw",
                        width: "100%",
                        height: "100%",
                      }
                    : s.layout === "grid-3x2"
                      ? {
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gridTemplateRows: "repeat(3, 1fr)",
                          gap: "2vw",
                          width: "100%",
                          height: "100%",
                          placeItems: "center",
                          justifyContent: "center",
                          alignContent: "center",
                        }
                      : s.layout === "video-top-left"
                        ? {
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gridTemplateRows: "repeat(3, 1fr)",
                            rowGap: "1vh",
                            columnGap: "1vw",
                            width: "100%",
                            height: "100%",
                          }
                        : s.layout === "stack-pair-side" && s.srcs.length === 4
                          ? {
                              display: "grid",
                              gridTemplateColumns: "repeat(3, 1fr)",
                              gridTemplateRows: "1fr 1fr",
                              gap: "2vw",
                              width: "100%",
                              height: "100%",
                            }
                          : s.layout === "stack3-pair-side" && s.srcs.length === 5
                            ? {
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gridTemplateRows: "repeat(3, 1fr)",
                                rowGap: "0.25vh",
                                columnGap: "2vw",
                                width: "100%",
                                height: "100%",
                              }
                            : s.layout === "grid-2x2" && s.srcs.length === 4
                              ? {
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr",
                                  gridTemplateRows: "1fr 1fr",
                                  gap: "2vw",
                                  width: "100%",
                                  height: "100%",
                                }
                              : {
                                  display: "grid",
                                  gridTemplateColumns: `repeat(${s.srcs.length}, 1fr)`,
                                  gap: "2vw",
                                  width: "100%",
                                  height: "100%",
                                }
                }
              >
                {s.layout === "video-top-left" && s.videoSrc ? (
                  <div
                    style={{
                      gridColumn: "1 / span 2",
                      gridRow: "1 / span 2",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      position: "relative",
                      minWidth: 0,
                      minHeight: 0,
                    }}
                  >
                    {videoStarted ? (
                      <iframe
                        src={
                          s.videoSrc +
                          (s.videoSrc.includes("?") ? "&" : "?") +
                          "autoplay=1&mute=1"
                        }
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        style={{
                          position: "absolute",
                          top: "-12%",
                          left: 0,
                          width: "100%",
                          height: "112%",
                          border: 0,
                          display: "block",
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVideoStarted(true)}
                        aria-label="Play video"
                        style={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          padding: 0,
                          margin: 0,
                          border: 0,
                          background: "#000",
                          cursor: "pointer",
                          display: "block",
                        }}
                      >
                        {s.videoPosterSrc ? (
                          manifest[s.videoPosterSrc] ? (
                            <Image
                              src={s.videoPosterSrc}
                              alt=""
                              width={manifest[s.videoPosterSrc].width}
                              height={manifest[s.videoPosterSrc].height}
                              sizes="66vw"
                              loading="eager"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.videoPosterSrc}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          )
                        ) : null}
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: "rgba(0, 0, 0, 0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: 0,
                              height: 0,
                              borderTop: "16px solid transparent",
                              borderBottom: "16px solid transparent",
                              borderLeft: "24px solid #fff",
                              marginLeft: 4,
                            }}
                          />
                        </span>
                      </button>
                    )}
                  </div>
                ) : null}
                {s.srcs.map((img, j) => {
                  const dims = manifest[img.src];
                  const stackLeft = s.layout === "stack-left" && s.srcs.length === 3;
                  const videoTopLeft = s.layout === "video-top-left";
                  const videoTopLeftPos: CSSProperties =
                    videoTopLeft
                      ? j === 0
                        ? { gridColumn: "1", gridRow: "3" }
                        : j === 1
                          ? { gridColumn: "2", gridRow: "3" }
                          : j === 2
                            ? { gridColumn: "3", gridRow: "1" }
                            : j === 3
                              ? { gridColumn: "3", gridRow: "2" }
                              : j === 4
                                ? { gridColumn: "3", gridRow: "3" }
                                : {}
                      : {};
                  const stackPairSide =
                    s.layout === "stack-pair-side" && s.srcs.length === 4;
                  const stackPairSidePos: CSSProperties = stackPairSide
                    ? j === 0
                      ? { gridColumn: "1", gridRow: "1" }
                      : j === 1
                        ? { gridColumn: "2", gridRow: "1 / span 2" }
                        : j === 2
                          ? { gridColumn: "3", gridRow: "1 / span 2" }
                          : j === 3
                            ? { gridColumn: "1", gridRow: "2" }
                            : {}
                    : {};
                  const stack3PairSide =
                    s.layout === "stack3-pair-side" && s.srcs.length === 5;
                  const stack3PairSidePos: CSSProperties = stack3PairSide
                    ? j === 0
                      ? { gridColumn: "1", gridRow: "1 / span 3" }
                      : j === 1
                        ? { gridColumn: "3", gridRow: "1 / span 3" }
                        : j === 2
                          ? { gridColumn: "2", gridRow: "1" }
                          : j === 3
                            ? { gridColumn: "2", gridRow: "2" }
                            : j === 4
                              ? { gridColumn: "2", gridRow: "3" }
                              : {}
                    : {};
                  const cellStyle: CSSProperties = videoTopLeft
                    ? {
                        width: "100%",
                        height: "100%",
                        overflow: "hidden",
                        minWidth: 0,
                        minHeight: 0,
                        ...videoTopLeftPos,
                      }
                    : {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 0,
                        minHeight: 0,
                        ...(stackLeft && j === 0
                          ? { gridColumn: "1", gridRow: "1" }
                          : stackLeft && j === 1
                            ? { gridColumn: "2", gridRow: "1 / span 2" }
                            : stackLeft && j === 2
                              ? { gridColumn: "1", gridRow: "2" }
                              : {}),
                        ...stackPairSidePos,
                        ...stack3PairSidePos,
                      };
                  const grid2x2 = s.layout === "grid-2x2" && s.srcs.length === 4;
                  const rowCover = s.layout === "row-cover";
                  const cellImgStyle: CSSProperties = {
                    ...(videoTopLeft ||
                    stackPairSide ||
                    stack3PairSide ||
                    grid2x2 ||
                    rowCover
                      ? {
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }
                      : imgStyle),
                    ...(img.flipY ? { transform: "scaleY(-1)" } : {}),
                  };
                  return (
                    <div key={j} style={cellStyle}>
                      {dims ? (
                        <Image
                          src={img.src}
                          alt={img.alt ?? ""}
                          width={dims.width}
                          height={dims.height}
                          sizes="50vw"
                          loading="eager"
                          style={cellImgStyle}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img.src} alt={img.alt ?? ""} style={cellImgStyle} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
