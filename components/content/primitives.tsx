"use client";

/**
 * Layout primitives — the visual vocabulary the author writes in MDX.
 *
 * For Phase 2 pilot scope, the primitives emit the SAME mobile-stack
 * DOM that today's per-project carousels produce (the
 * `.piece-layout--*` classes), so the existing CSS continues
 * to apply unchanged. That gives us pixel parity on mobile — the
 * primary target — without writing any new CSS.
 *
 * Desktop in Phase 2 pilot falls back to the same stacked DOM (looks
 * "fine, vertical, full width"). A proper paged desktop carousel is a
 * follow-up.
 *
 * Pixel-parity mapping (from TobritCarousel.MobileSlide):
 *   Cover         → .piece-layout--cover
 *   Single        → .piece-layout--single
 *   Pair          → .piece-layout--pair (2-col grid)
 *   Row           → .piece-layout--pair (TobritCarousel uses
 *                   the same --pair class for its "row" type)
 *   RowCover      → .piece-layout--pair (cover-fit children)
 *   Grid / Grid2x2/ Grid3x2 / StackPairSide / Stack3PairSide:
 *                   .piece-layout--stack (vertical) + special
 *                   case for Grid3x2 (2×2 of first 4 + stack of rest,
 *                   matching TobritCarousel's "build photos" branch)
 *   Credits       → .piece-layout--text
 *   VideoTopLeft  → mobile flattens it: iframe at top, images stacked
 *                   below (mirrors the moon raves mobile layout I
 *                   already authored)
 */
import Image from "next/image";
import { Children, isValidElement, type ReactNode } from "react";
import imageManifest from "@/lib/image-manifest.json";
import type { ImageRef } from "@/lib/content-types";

const manifest = imageManifest as Record<string, { width: number; height: number }>;

// ─────────────────────────────────────────────────────────────────────
// Img — leaf element used inside grouping primitives. `hideOnMobile`
// is honoured by grouping primitives via a filter — see
// `filterMobileChildren` below.
// ─────────────────────────────────────────────────────────────────────

type ImgProps = ImageRef & { sizes?: string; className?: string };

/**
 * Build the AVIF / WebP sibling paths for a JPG/PNG source. The
 * `emit-modern-image-formats.mjs` build script writes these siblings
 * alongside the source (`foo.jpg` → `foo.avif` + `foo.webp`).
 * Returns null for non-JPG/PNG sources (gifs, mp4 posters, etc.) —
 * the caller skips emitting `<source>` tags in that case.
 */
function modernSources(src: string): { avif: string; webp: string } | null {
  const m = src.match(/\.(jpe?g|png)$/i);
  if (!m) return null;
  const base = src.slice(0, -m[0].length);
  return { avif: `${base}.avif`, webp: `${base}.webp` };
}

export function Img({ src, alt, sizes = "100vw", className }: ImgProps) {
  const dims = manifest[src];
  const modern = modernSources(src);
  // `<picture>` lets the browser pick the first supported format
  // (AVIF → WebP → original JPG/PNG fallback in `<img>`). Browsers
  // without AVIF/WebP support skip the `<source>` tags via the
  // `type` attribute, no network request fired. If the modern
  // sibling files don't exist (script not yet run, or very small
  // image the script skipped), the browser 404s the `<source>` and
  // falls through to the next one — graceful degradation, no
  // visible breakage.
  if (dims) {
    return (
      <picture>
        {modern && <source type="image/avif" srcSet={modern.avif} />}
        {modern && <source type="image/webp" srcSet={modern.webp} />}
        <Image
          src={src}
          alt={alt ?? ""}
          width={dims.width}
          height={dims.height}
          sizes={sizes}
          className={className}
          // Eager-load so paged-off-screen pieces have their images ready
          // when the user navigates to them. The default `lazy` strategy
          // uses an intersection observer rooted at the viewport, which
          // doesn't fire reliably for transform-translated content.
          loading="eager"
        />
      </picture>
    );
  }
  return (
    <picture>
      {modern && <source type="image/avif" srcSet={modern.avif} />}
      {modern && <source type="image/webp" srcSet={modern.webp} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? ""} className={className} />
    </picture>
  );
}

/**
 * Strip out children that carry `hideOnMobile={true}` (matching the
 * existing TobritCarousel MOBILE_HIDDEN_SRCS behaviour). Used by the
 * grouping primitives below so author intent is honoured.
 */
function filterMobileChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children).filter((child) => {
    if (!isValidElement(child)) return true;
    const props = child.props as { hideOnMobile?: boolean } | null;
    return !props?.hideOnMobile;
  });
}

// ─────────────────────────────────────────────────────────────────────
// Cover — full-bleed hero. Existing CSS for .piece-layout--cover
// renders this at 45vh on mobile (recently changed from 65vh).
// ─────────────────────────────────────────────────────────────────────

export function Cover({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="piece-layout piece-layout--cover">
      <Img src={src} alt={alt} sizes="100vw" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Single — one full-width image, contained.
// ─────────────────────────────────────────────────────────────────────

export function Single({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="piece-layout piece-layout--single">
      <Img src={src} alt={alt} sizes="100vw" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Hero — viewport-tall, uncropped, centered image. NOT full-bleed
// (unlike Cover) — keeps the image's natural aspect at max-height
// 100dvh and centers it horizontally on the slide, leaving slide
// background visible on either side when the image is narrower than
// the viewport. Used to open a project / activations slide with a
// commanding image that doesn't have to be physically large enough
// to fill 100vw without upscale/crop. CSS lives at
// `.piece-layout--hero` in globals.css.
// ─────────────────────────────────────────────────────────────────────

export function Hero({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="piece-layout piece-layout--hero">
      <Img src={src} alt={alt} sizes="100vw" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pair — 2 images side-by-side. CSS: grid-template-columns 1fr 1fr.
// ─────────────────────────────────────────────────────────────────────

export function Pair({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--pair">
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Row — N images side-by-side, contained. Sets `grid-template-columns`
// inline based on the visible child count so a 3-image Row renders as
// 1fr 1fr 1fr instead of wrapping on the default `--pair` 1fr 1fr.
// ─────────────────────────────────────────────────────────────────────

export function Row({ children }: { children: ReactNode }) {
  const visible = filterMobileChildren(children);
  return (
    <div
      className="piece-layout piece-layout--pair"
      style={{ gridTemplateColumns: `repeat(${visible.length}, 1fr)` }}
    >
      {visible}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// RowCover — N images side-by-side, cover-fitting. Sets the grid
// `grid-template-columns` inline based on the visible child count so
// 3-item rows (e.g. moon raves quad-seva) get three equal columns
// instead of inheriting the default `1fr 1fr` from .--pair.
// ─────────────────────────────────────────────────────────────────────

export function RowCover({ children }: { children: ReactNode }) {
  const visible = filterMobileChildren(children);
  return (
    <div
      className="piece-layout piece-layout--pair piece-layout--cover-fit"
      style={{ gridTemplateColumns: `repeat(${visible.length}, 1fr)` }}
    >
      {visible}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Grid — generic cols × rows grid. Mobile (today): stacks vertically
// in --stack, matching TobritCarousel's grid → stack behaviour.
// ─────────────────────────────────────────────────────────────────────

export function Grid({ children }: { cols?: number; rows?: number; children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--stack">
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Grid2x2 — 4-img 2×2 cover-fit. (Used for moon raves quad-portraits.)
// ─────────────────────────────────────────────────────────────────────

export function Grid2x2({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--grid-2x2">
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Grid3x2 — 6-img desktop 3×2. Mobile auto-splits into 2×2 of first 4
// + stack of remaining 2 — exact match for TobritCarousel.MobileSlide's
// `isBuildGrid` branch.
// ─────────────────────────────────────────────────────────────────────

export function Grid3x2({ children }: { children: ReactNode }) {
  const visible = filterMobileChildren(children);
  const first4 = visible.slice(0, 4);
  const rest = visible.slice(4);
  return (
    <>
      <div className="piece-layout piece-layout--grid-2x2">
        {first4}
      </div>
      {rest.length > 0 ? (
        <div className="piece-layout piece-layout--stack">
          {rest}
        </div>
      ) : null}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// StackPairSide — moon raves 4-img desktop layout. Mobile stacks.
// ─────────────────────────────────────────────────────────────────────

export function StackPairSide({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--stack">
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stack3PairSide — moon raves 5-img desktop layout. Mobile stacks.
// ─────────────────────────────────────────────────────────────────────

export function Stack3PairSide({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--stack">
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// VideoTopLeft — moon raves' video-top-left desktop layout. Mobile
// renders iframe at top followed by images stacked. Mirrors the
// MoonRavesCarousel mobile layout I authored earlier.
// ─────────────────────────────────────────────────────────────────────

export function VideoTopLeft({
  videoSrc,
  videoPoster,
  children,
}: {
  videoSrc: string;
  videoPoster?: string;
  children: ReactNode;
}) {
  // Wrap the iframe + images in a single container so a flex parent
  // (e.g. the project-track piece) can vertically centre the block; CSS
  // arranges this container as a 3x3 grid with the video at top-left
  // 2x2 and the images cycling around the third column / third row.
  return (
    <div
      className="piece-video-top-left"
      data-poster={videoPoster ?? ""}
    >
      <div className="piece-video-top-left__video">
        <iframe
          src={videoSrc}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
          }}
          title="Embedded video"
        />
      </div>
      {filterMobileChildren(children)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Video — MP4 file. Auto-plays, muted, loops, plays inline.
// ─────────────────────────────────────────────────────────────────────

export function Video({
  src,
  poster,
  fit = "contain",
}: {
  src: string;
  poster?: string;
  fit?: "cover" | "contain";
}) {
  return (
    <div className="piece-layout piece-layout--single">
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        style={{
          width: "100%",
          height: "auto",
          objectFit: fit,
          display: "block",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Iframe — YouTube / Vimeo. Aspect-ratio'd container, fills width.
// ─────────────────────────────────────────────────────────────────────

export function Iframe({
  src,
  // `aspect` accepts a CSS aspect-ratio string ("9 / 16", "1.7777") or
  // a number — strings are required because `next-mdx-remote` v6 drops
  // JSX expression attributes (`aspect={9/16}`) silently, so MDX has to
  // pass `aspect="9 / 16"` and have us pipe it through. CSS aspect-
  // ratio happily accepts both syntaxes.
  aspect = "16 / 9",
  title = "Embedded video",
}: {
  src: string;
  aspect?: string | number;
  title?: string;
}) {
  return (
    <div
      className="piece-layout piece-layout--single"
      style={{ aspectRatio: aspect }}
    >
      <iframe
        src={src}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
      />
    </div>
  );
}
