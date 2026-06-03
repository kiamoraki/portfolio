"use client";

/**
 * Sketch & SketchOverlay — render p5 canvases inside the unified
 * content model.
 *
 * `<Sketch id bg colorMode? />`
 *   - Full-area canvas slide. Sized to viewport. The slide bg is set
 *     to `bg` and the chrome `colorMode` derives from `bg` luminance
 *     (or an explicit override).
 *   - `id` resolves to a React component via the sketch registry.
 *
 * `<SketchOverlay id />`
 *   - Sticky, transparent canvas that sits over slide content (e.g.
 *     TOBRIT's falling Brad Pitt faces). Rendered via a portal into
 *     `document.body` so the canvas's `position: fixed; inset: 0`
 *     isn't trapped inside a transformed ancestor (the carousel
 *     track's `translateX` would otherwise re-anchor it).
 *   - CSS scopes its visibility per active slide via
 *     `body[data-meta-active-slug]`, and a media-query-driven opacity
 *     fades the canvas down on desktop so the photographs read as
 *     foreground without the canvas competing.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SKETCHES, OVERLAY_SKETCHES, deriveColorMode } from "@/lib/sketch-registry";
import type { ColorMode as ColorModeValue } from "@/lib/content-types";

type SketchProps = {
  id: string;
  bg?: string;
  colorMode?: ColorModeValue;
};

export function Sketch({ id, bg, colorMode }: SketchProps) {
  const entry = SKETCHES[id];
  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Sketch] unknown id "${id}" — check lib/sketch-registry.ts`);
    }
    return null;
  }
  const resolvedBg = bg ?? entry.bg;
  const resolvedMode: ColorModeValue =
    colorMode ?? entry.colorMode ?? deriveColorMode(resolvedBg);
  const Component = entry.Component;
  return (
    <div
      className="piece-sketch piece-layout piece-layout--single"
      data-color-mode={resolvedMode}
      data-sketch-id={id}
      style={{
        background: resolvedBg,
        width: "100vw",
        height: "100dvh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* inFlow tells canvases that default to `position: fixed` (e.g.
          RadialsCanvas, Lissajous*, EternalReturn*) to switch to
          `position: absolute; inset: 0` so they fill THIS wrapper —
          which itself sits inside the meta carousel's transformed
          track. Without it, position: fixed re-anchors to the
          transformed ancestor and slides off-screen as you page.
          Canvases that don't define an `inFlow` prop just ignore it. */}
      <Component inFlow />
    </div>
  );
}

export function SketchOverlay({ id }: { id: string }) {
  const entry = OVERLAY_SKETCHES[id];
  // Gate on `mounted` so SSR returns null and only the client renders
  // the portal — createPortal requires document.body to exist.
  const [mounted, setMounted] = useState(false);

  // Mirror viewport-class to body so CSS can target the canvas
  // differently on mobile vs desktop. This is the "switch that
  // detects if it's mobile or desktop" — the canvas stays portaled
  // to body, but the body class drives a CSS difference in how it
  // reads (e.g. opacity, blend mode).
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const apply = () => {
      const desktop = window.matchMedia("(min-width: 721px)").matches;
      document.body.classList.toggle("sketch-overlay-desktop", desktop);
    };
    apply();
    const mq = window.matchMedia("(min-width: 721px)");
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      if (typeof document !== "undefined") {
        document.body.classList.remove("sketch-overlay-desktop");
      }
    };
  }, []);

  if (!entry) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[SketchOverlay] unknown id "${id}" — check lib/sketch-registry.ts`,
      );
    }
    return null;
  }
  if (!mounted) return null;
  const Component = entry.Component;
  return createPortal(<Component />, document.body);
}
