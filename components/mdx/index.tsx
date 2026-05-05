import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { TobritCanvas } from "@/components/sketches/TobritCanvas";
import { LissajousCanvas } from "@/components/sketches/LissajousCanvas";
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
  caption?: ReactNode;
};

export function Video({ src, vertical = false, caption }: VideoProps) {
  const inner = (
    <div className={vertical ? "video-vertical" : "video"}>
      <iframe src={src} allow="autoplay; fullscreen" allowFullScreen />
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

export const mdxComponents = {
  Figure,
  Row,
  Text,
  Video,
  Credits,
  SoundCloud,
  TobritCanvas,
  LissajousCanvas,
};
