import type { ComponentType, CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { AnimationsCarousel } from "@/components/AnimationsCarousel";
import { TobritCanvas } from "@/components/sketches/TobritCanvas";
import { LissajousCanvas } from "@/components/sketches/LissajousCanvas";
import { RadialsCanvas } from "@/components/sketches/RadialsCanvas";
import { EternalReturnUnobservedCanvas } from "@/components/sketches/EternalReturnUnobservedCanvas";
import { EternalReturnObservedCanvas } from "@/components/sketches/EternalReturnObservedCanvas";
import { Wave1Canvas } from "@/components/sketches/Wave1Canvas";
import { Wave2Canvas } from "@/components/sketches/Wave2Canvas";
import { Wave3Canvas } from "@/components/sketches/Wave3Canvas";
import { Wave4Canvas } from "@/components/sketches/Wave4Canvas";
import { Wave5Canvas } from "@/components/sketches/Wave5Canvas";
import { Wave6Canvas } from "@/components/sketches/Wave6Canvas";
import { MultiverseCanvas } from "@/components/sketches/MultiverseCanvas";
import { RoseGridCanvas } from "@/components/sketches/RoseGridCanvas";
import { RosePortraitsCanvas } from "@/components/sketches/RosePortraitsCanvas";
import { LissajousFullCanvas } from "@/components/sketches/LissajousFullCanvas";
import { LissajousGridCanvas } from "@/components/sketches/LissajousGridCanvas";
import { LissajousGridFullCanvas } from "@/components/sketches/LissajousGridFullCanvas";
import { LissajousGridLabelledCanvas } from "@/components/sketches/LissajousGridLabelledCanvas";
import { LissajousLatticeCanvas } from "@/components/sketches/LissajousLatticeCanvas";
import { LissajousCousinsCanvas } from "@/components/sketches/LissajousCousinsCanvas";
import { LissajousAliasingCompareCanvas } from "@/components/sketches/LissajousAliasingCompareCanvas";
import { LissajousPairLinesCanvas } from "@/components/sketches/LissajousPairLinesCanvas";
// Dev-only variant of PairLines that predicts the rotation drift over
// the upcoming morph and matches particles to where slots *will be*
// at morph end (vs. the production sketch which matches to where slots
// are at morph start). Lives only on /projects/dev-animations.
import { LissajousPairLinesPredictCanvas } from "@/components/sketches/LissajousPairLinesPredictCanvas";
// Lives on the /projects/dev-animations dev page rather than in the
// public animations carousel.
import { LissajousAssignmentCompareCanvas } from "@/components/sketches/LissajousAssignmentCompareCanvas";
import { LissajousSmoothGridCanvas } from "@/components/sketches/LissajousSmoothGridCanvas";
import { LissajousUniqueGridCanvas } from "@/components/sketches/LissajousUniqueGridCanvas";
import { LissajousPortraitsCanvas } from "@/components/sketches/LissajousPortraitsCanvas";
import { JellyfishGridCanvas } from "@/components/sketches/JellyfishGridCanvas";
import { ShapeOfTime } from "@/components/ShapeOfTime";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<string, { width: number; height: number }>;

type FigureProps = {
  src: string;
  alt?: string;
  caption?: ReactNode;
  style?: CSSProperties;
  className?: string;
  priority?: boolean;
};

export function Figure({ src, alt = "", caption, style, className, priority }: FigureProps) {
  const dims = manifest[src];
  return (
    <figure className={["image", className].filter(Boolean).join(" ")} style={style}>
      {dims ? (
        <Image
          src={src}
          alt={alt}
          width={dims.width}
          height={dims.height}
          sizes="(max-width: 720px) 100vw, (max-width: 1200px) 80vw, 1200px"
          priority={priority}
          loading={priority ? undefined : "eager"}
          unoptimized={src.endsWith(".gif")}
        />
      ) : (
        // Fallback for any image not in the manifest (animations, externally-named refs)
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} />
      )}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

type RowProps = {
  children: ReactNode;
  center?: boolean;
  equalHeights?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Row({ children, center, equalHeights, className, style }: RowProps) {
  const cls = [
    "row",
    center ? "center" : "",
    equalHeights ? "equal-heights" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}

export function Text({ children }: { children: ReactNode }) {
  return <div className="text">{children}</div>;
}

type VideoProps = {
  src: string;
  vertical?: boolean;
  aspect?: string;
  caption?: ReactNode;
};

export function Video({ src, vertical = false, aspect, caption }: VideoProps) {
  const iframeStyle = aspect ? { aspectRatio: aspect } : undefined;
  const inner = (
    <div className={vertical ? "video-vertical" : "video"}>
      <iframe
        src={src}
        allow="autoplay; fullscreen"
        allowFullScreen
        style={iframeStyle}
      />
    </div>
  );
  if (!caption) return inner;
  return (
    <div className="video_w_caption">
      {inner}
      <label>{caption}</label>
    </div>
  );
}

export function Credits({ children }: { children: ReactNode }) {
  return <div className="row credits">{children}</div>;
}

type BandProps = { bg: string; children: ReactNode };
export function Band({ bg, children }: BandProps) {
  return (
    <div style={{ background: bg, padding: "40px 20px" }}>{children}</div>
  );
}

type BandStackProps = { gap?: number; children: ReactNode };
export function BandStack({ gap = 0, children }: BandStackProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width: "100%" }}>
      {children}
    </div>
  );
}

export function SoundCloud({ trackId }: { trackId: string }) {
  const url = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
  return (
    <iframe
      width="100%"
      height="300"
      scrolling="no"
      frameBorder="no"
      allow="autoplay"
      src={url}
      style={{ display: "block", margin: "1.5rem 0" }}
    />
  );
}

// MetaExclude wraps content that should be visible on a project's own
// page but stripped when that project is aggregated into a meta page
// (e.g. /projects/design). The normal mdxComponents map below renders
// the children; the mdxComponentsForMeta map overrides it to render
// nothing.
export function MetaExclude({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const mdxComponents = {
  Figure,
  Row,
  Text,
  Video,
  Credits,
  SoundCloud,
  MetaExclude,
  AnimationsCarousel,
  TobritCanvas,
  LissajousCanvas,
  RadialsCanvas,
  EternalReturnUnobservedCanvas,
  EternalReturnObservedCanvas,
  MultiverseCanvas,
  RoseGridCanvas,
  LissajousFullCanvas,
  LissajousAssignmentCompareCanvas,
  LissajousPairLinesPredictCanvas,
  LissajousLatticeCanvas,
  LissajousCousinsCanvas,
  LissajousAliasingCompareCanvas,
  LissajousGridLabelledCanvas,
  LissajousSmoothGridCanvas,
  Band,
  BandStack,
  ShapeOfTime,
};

