"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
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
type Slide =
  | { type: "image"; src: string; alt?: string }
  | {
      type: "grid";
      cols: number;
      rows: number;
      srcs: ImageRef[];
      colTemplate?: string;
    }
  | { type: "videoText"; videoSrc: string; content: ReactNode };

const SLIDES: Slide[] = [
  { type: "image", src: "/img/artificial_consciousness/interference.jpg", alt: "Interference" },
  {
    type: "grid",
    cols: 2,
    rows: 1,
    srcs: [
      { src: "/img/artificial_consciousness/tile-pornj-playa.jpg", alt: "Tile — PORNJ" },
      { src: "/img/artificial_consciousness/tile-blue-playa.jpg", alt: "Tile — Blue" },
    ],
  },
  {
    type: "grid",
    cols: 3,
    rows: 1,
    colTemplate: "1fr 220px 1fr",
    srcs: [
      { src: "/img/artificial_consciousness/glamtech-install-2-flip.jpg", alt: "Glamtech install" },
      { src: "/img/artificial_consciousness/glamtech-logo.png", alt: "Glamtech logo" },
      { src: "/img/artificial_consciousness/glamtech-install-1.jpg", alt: "Glamtech install" },
    ],
  },
  { type: "image", src: "/img/artificial_consciousness/glamtech-install-3.jpg", alt: "Glamtech install" },
  { type: "image", src: "/img/artificial_consciousness/glamtech-install-4.jpg", alt: "Glamtech install" },
  {
    type: "videoText",
    videoSrc:
      "https://player.vimeo.com/video/319065134?autoplay=1&autopause=0&loop=1&title=0&portrait=0&byline=0&muted=true",
    content: (
      <div
        style={{
          maxWidth: 540,
          fontSize: "clamp(0.85rem, 1.4vw, 1rem)",
          lineHeight: 1.55,
          overflowY: "auto",
          maxHeight: "100%",
        }}
      >
        <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
          “When Mike was installed in Luna, he was pure thinkum, a flexible
          logic — &lsquo;High-Optional, Logical, Multi-Evaluating Supervisor,
          Mark IV, Mod. L&rsquo; — a HOLMES FOUR. He computed ballistics for
          pilotless freighters and controlled their catapult. This kept him
          busy less than one percent of time and Luna Authority never believed
          in idle hands. They kept hooking hardware into him — decision-action
          boxes to let him boss other computers, bank on bank of additional
          memories, more banks of associational neural nets, another tubful of
          twelve-digit random numbers, a greatly augmented temporary memory.
          Human brain has around ten-to-the-tenth neurons. By third year Mike
          had better than one and a half times that number of neuristors.”
        </p>
        <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
          “And woke up.”
        </p>
        <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
          “Am not going to argue whether a machine can &lsquo;really&rsquo; be
          alive, &lsquo;really&rsquo; be self-aware. Is a virus self-aware?
          Nyet. How about oyster? I doubt it. A cat? Almost certainly. A human?
          Don&apos;t know about you, tovarishch, but I am. Somewhere along
          evolutionary chain from macromolecule to human brain self-awareness
          crept in. Psychologists assert it happens automatically whenever a
          brain acquires certain very high number of associational paths.
          Can&apos;t see it matters whether paths are protein or platinum.”
        </p>
        <p style={{ fontSize: "0.9em", opacity: 0.7 }}>
          Robert H. Heinlein, <em>The Moon is a Harsh Mistress</em>. 1966.
        </p>
      </div>
    ),
  },
];

const MOBILE_IMAGES: MobileImage[] = SLIDES.flatMap((s) => {
  if (s.type === "image") return [{ src: s.src, alt: s.alt }];
  if (s.type === "grid") return s.srcs;
  return [];
});

const TRANSITION_MS = 500;

export function ArtificialConsciousnessCarousel() {
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
    if (t === "image") return slideBase;
    if (t === "videoText") return { ...slideBase, padding: "8vh 4vw" };
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
      <div className="ac-mobile-videos">
        <video
          className="ac-mobile-video"
          src="/img/artificial_consciousness/ac.MP4"
          autoPlay
          muted
          loop
          playsInline
        />
        <video
          className="ac-mobile-video"
          src="/img/artificial_consciousness/ac-shipibo.MP4"
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
      <ProjectMobileStack images={MOBILE_IMAGES} />
      <div className="project-desktop-carousel" style={wrapper} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={track}>
        {renderedSlides.map((s, i) => (
          <div key={i} style={slideForType(s.type)}>
            {s.type === "image" ? (
              (() => {
                const dims = manifest[s.src];
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
                  gridTemplateColumns:
                    s.colTemplate ?? `repeat(${s.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${s.rows}, 1fr)`,
                  gap: "1.5vh",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyItems: "center",
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
            ) : s.type === "videoText" ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: "3vw",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxHeight: "100%",
                      aspectRatio: "9 / 16",
                      maxWidth: "min(56vh, 100%)",
                    }}
                  >
                    <iframe
                      src={s.videoSrc}
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    height: "100%",
                  }}
                >
                  {s.content}
                </div>
              </div>
            ) : null}
          </div>
        ))}
        </div>
      </div>
    </>
  );
}
