import type { ComponentType, CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllProjects } from "@/lib/projects";
import { MetaCarousel } from "@/components/MetaCarousel";
import { TobritCanvas } from "@/components/sketches/TobritCanvas";
import { LissajousCanvas } from "@/components/sketches/LissajousCanvas";
import { RadialsCanvas } from "@/components/sketches/RadialsCanvas";
import { EternalReturnUnobservedCanvas } from "@/components/sketches/EternalReturnUnobservedCanvas";
import { EternalReturnObservedCanvas } from "@/components/sketches/EternalReturnObservedCanvas";
import { WaveGrids } from "@/components/WaveGrids";
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
// Lives on the /projects/dev-animations dev page rather than in the
// public animations carousel.
import { LissajousAssignmentCompareCanvas } from "@/components/sketches/LissajousAssignmentCompareCanvas";
import { LissajousSmoothGridCanvas } from "@/components/sketches/LissajousSmoothGridCanvas";
import { LissajousUniqueGridCanvas } from "@/components/sketches/LissajousUniqueGridCanvas";
import { LissajousPortraitsCanvas } from "@/components/sketches/LissajousPortraitsCanvas";
import { JellyfishGridCanvas } from "@/components/sketches/JellyfishGridCanvas";
import { EternalReturnCarousel } from "@/components/EternalReturnCarousel";
import { DojoCarousel } from "@/components/DojoCarousel";
import { FakeRekordzCarousel } from "@/components/FakeRekordzCarousel";
import { RosesCarousel } from "@/components/RosesCarousel";
import { TobritCarousel } from "@/components/TobritCarousel";
import { ArtificialConsciousnessCarousel } from "@/components/ArtificialConsciousnessCarousel";
import { LissajousCarousel } from "@/components/LissajousCarousel";
import { MoonRavesCarousel } from "@/components/MoonRavesCarousel";
import { PrecarityCarousel } from "@/components/PrecarityCarousel";
import { RadioactiviTeaCarousel } from "@/components/RadioactiviTeaCarousel";
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

// TagContent is the heart of the meta-page system. On a meta page
// (e.g. /projects/design.mdx), `<TagContent tag="design" />` pulls
// every non-meta project tagged "design" — in the curated CUSTOM_ORDER
// supplied by getAllProjects() — and re-renders each project's MDX
// content using mdxComponentsForMeta so any `<MetaExclude>` blocks
// inside those projects collapse out. The `exclude` prop accepts an
// array of slugs to skip for one-off omissions.
export function TagContent({
  tag,
  exclude = [],
}: {
  tag: string;
  exclude?: string[];
}) {
  const excludeSet = new Set(exclude);
  const projects = getAllProjects().filter(
    (p) =>
      !p.meta &&
      !excludeSet.has(p.slug) &&
      (p.tags ?? []).includes(tag),
  );
  return (
    <>
      {projects.map((p) => (
        <section key={p.slug} className="meta-project" data-slug={p.slug}>
          <MDXRemote source={p.content} components={mdxComponentsForMeta} />
        </section>
      ))}
    </>
  );
}

export const mdxComponents = {
  Figure,
  Row,
  Text,
  Video,
  Credits,
  SoundCloud,
  MetaExclude,
  TagContent,
  TagCarousel,
  TobritCanvas,
  LissajousCanvas,
  RadialsCanvas,
  EternalReturnUnobservedCanvas,
  EternalReturnObservedCanvas,
  WaveGrids,
  MultiverseCanvas,
  RoseGridCanvas,
  LissajousFullCanvas,
  LissajousAssignmentCompareCanvas,
  LissajousLatticeCanvas,
  LissajousCousinsCanvas,
  LissajousAliasingCompareCanvas,
  LissajousGridLabelledCanvas,
  LissajousSmoothGridCanvas,
  Band,
  BandStack,
  EternalReturnCarousel,
  DojoCarousel,
  FakeRekordzCarousel,
  RosesCarousel,
  TobritCarousel,
  ArtificialConsciousnessCarousel,
  LissajousCarousel,
  MoonRavesCarousel,
  PrecarityCarousel,
  RadioactiviTeaCarousel,
  ShapeOfTime,
};

// Wrapper for full-bleed background canvases (RadialsCanvas, etc.) so
// they sit inside their meta-page section instead of escaping to
// position:fixed, inset:0 (which would make the canvas the page
// background for the entire meta page). Sized to fill its parent
// section / carousel slide — the carousel is now full 100vh, so the
// wrapper matches it.
function ContainedRadialsCanvas() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <RadialsCanvas inFlow />
    </div>
  );
}

// Used by TagContent / TagCarousel when re-rendering aggregated project
// MDX. Strips MetaExclude content, prevents recursive aggregation, and
// confines full-bleed background canvases to their meta section so they
// don't take over the whole meta page.
export const mdxComponentsForMeta = {
  ...mdxComponents,
  MetaExclude: () => null,
  TagContent: () => null,
  TagCarousel: () => null,
  RadialsCanvas: ContainedRadialsCanvas,
};

// TagCarousel is the paged variant of TagContent. Instead of stacking
// every tag-matched project's content vertically, it renders each one
// as its own carousel slide inside a `<MetaCarousel>` — the user pages
// through animations with the prev/next buttons or by swiping.
//
// Some projects expand into multiple slides — e.g. the lissajous project
// renders its three constituent canvases (full / grid / portraits) as
// individual slides instead of a single stacked entry.
export function TagCarousel({
  tag,
  exclude = [],
}: {
  tag: string;
  exclude?: string[];
}) {
  const excludeSet = new Set(exclude);
  const projects = getAllProjects().filter(
    (p) =>
      !p.meta &&
      !excludeSet.has(p.slug) &&
      (p.tags ?? []).includes(tag),
  );

  const slides: ReactNode[] = projects.flatMap((p) => {
    if (p.slug === "lissajous") {
      return [
        // TEMP order while we iterate on the sampling/aliasing study:
        //   1. pair lines (pinned first while iterating on the planes effect)
        //   2. labelled grid (aliased, in-cell labels)
        //   3. lattice (shows the shared 11×11 sample point cloud)
        //   4. cousins (single curve morphing through the coprime family)
        //   5. aliasing compare (same pair: 20 vs 200 samples)
        //   6. smooth grid (10×10 grid rendered with 200-vertex curves)
        //   7. unique grid (random + curated pairs)
        //   8..N. original full / grid / portraits
        // Restore the canonical order (full → grid → portraits) when done.
        <section
          key="lissajous-pair-lines"
          className="meta-project meta-carousel-project"
          data-slug="lissajous-pair-lines"
        >
          <LissajousPairLinesCanvas inFlow />
        </section>,
        // Hidden — the assignment-compare slide is kept around for
        // future debugging but currently excluded from the carousel.
        // Uncomment to surface it again.
        // <section
        //   key="lissajous-assignment-compare"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-assignment-compare"
        // >
        //   <LissajousAssignmentCompareCanvas inFlow />
        // </section>,
        // Hidden — moved to the /projects/dev-animations dev page.
        // <section
        //   key="lissajous-grid-labelled"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-grid-labelled"
        // >
        //   <div className="meta-carousel-canvas-square">
        //     <LissajousGridLabelledCanvas inFlow />
        //   </div>
        // </section>,
        // Hidden — lattice / cousins / aliasing-compare slides moved
        // to the /projects/dev-animations dev page. Uncomment to
        // re-surface them in the public carousel.
        // <section
        //   key="lissajous-lattice"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-lattice"
        // >
        //   <LissajousLatticeCanvas inFlow />
        // </section>,
        // <section
        //   key="lissajous-cousins"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-cousins"
        // >
        //   <LissajousCousinsCanvas inFlow />
        // </section>,
        // <section
        //   key="lissajous-aliasing-compare"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-aliasing-compare"
        // >
        //   <LissajousAliasingCompareCanvas inFlow />
        // </section>,
        // Hidden — moved to the /projects/dev-animations dev page.
        // <section
        //   key="lissajous-smooth-grid"
        //   className="meta-project meta-carousel-project"
        //   data-slug="lissajous-smooth-grid"
        // >
        //   <div className="meta-carousel-canvas-square">
        //     <LissajousSmoothGridCanvas inFlow />
        //   </div>
        // </section>,
        <section
          key="lissajous-unique"
          className="meta-project meta-carousel-project"
          data-slug="lissajous-unique"
        >
          <LissajousUniqueGridCanvas inFlow />
        </section>,
        // Re-ordered: grid-full was 4th, promoted to 3rd. Portraits
        // (was 5th) bumps to 4th. lissajous-full (was 3rd) moves to
        // the end, after portraits.
        <section
          key="lissajous-grid"
          className="meta-project meta-carousel-project"
          data-slug="lissajous-grid"
        >
          {/* Full-viewport variant — the 15×15 cell pattern continues
              to fill the whole screen (≈15×30 on portrait mobile)
              instead of being constrained to a centered square. */}
          <LissajousGridFullCanvas inFlow />
        </section>,
        <section
          key="lissajous-portraits"
          className="meta-project meta-carousel-project"
          data-slug="lissajous-portraits"
        >
          <div className="meta-carousel-canvas-square">
            <LissajousPortraitsCanvas inFlow />
          </div>
        </section>,
        <section
          key="lissajous-full"
          className="meta-project meta-carousel-project"
          data-slug="lissajous-full"
        >
          <div className="meta-carousel-canvas-square">
            <LissajousFullCanvas inFlow />
          </div>
        </section>,
      ];
    }
    if (p.slug === "wave") {
      // Each of the six wave grids becomes its own meta-carousel slide
      // instead of being aggregated into the internal WaveGrids
      // sub-carousel. Order matches GRIDS in WaveGrids.tsx
      // (1 → 6 → 2 → 3 → 4 → 5).
      const waves: Array<[string, ComponentType]> = [
        ["wave-1", Wave1Canvas],
        ["wave-6", Wave6Canvas],
        ["wave-2", Wave2Canvas],
        ["wave-3", Wave3Canvas],
        ["wave-4", Wave4Canvas],
        ["wave-5", Wave5Canvas],
      ];
      return waves.map(([slug, Canvas]) => (
        <section
          key={slug}
          className="meta-project meta-carousel-project"
          data-slug={slug}
        >
          <div className="meta-carousel-canvas-square">
            <Canvas />
          </div>
        </section>
      ));
    }
    if (p.slug === "roses") {
      // RosesCarousel stacks the rose grid + rose portraits canvases
      // into one meta-carousel slide. Split them into two distinct
      // slides here so each canvas gets its own page in the meta
      // carousel (matches how lissajous + wave handle their sub-canvases).
      return [
        <section
          key="roses-grid"
          className="meta-project meta-carousel-project"
          data-slug="roses-grid"
        >
          {/* No .meta-carousel-canvas-square wrapper — the grid fills
              the full viewport (CSS override below resets the inner
              wrapper's mobile aspect-ratio: 1). */}
          <RoseGridCanvas />
        </section>,
        <section
          key="roses-portraits"
          className="meta-project meta-carousel-project"
          data-slug="roses-portraits"
        >
          <div className="meta-carousel-canvas-square">
            <RosePortraitsCanvas inFlow />
          </div>
        </section>,
      ];
    }
    return [
      <section
        key={p.slug}
        className="meta-project meta-carousel-project"
        data-slug={p.slug}
      >
        <MDXRemote source={p.content} components={mdxComponentsForMeta} />
      </section>,
    ];
  });

  // Tail slide — not tied to any project, just appended at the end of
  // the meta animations carousel.
  slides.push(
    <section
      key="jellyfish-grid"
      className="meta-project meta-carousel-project"
      data-slug="jellyfish-grid"
    >
      <JellyfishGridCanvas inFlow />
    </section>,
  );

  return <MetaCarousel slides={slides} />;
}
