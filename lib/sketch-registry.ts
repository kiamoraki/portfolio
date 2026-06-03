"use client";

/**
 * Sketch registry — single source of truth for what `id` references
 * which sketch React component and what background color it paints.
 *
 * The renderer:
 *   - `<Sketch id="..."/>` looks up the component and the bg.
 *   - Slide background, slide colorMode (derived from bg luminance),
 *     and chrome ink color all read from this registry entry.
 *
 * Sketches are imported statically (not via `dynamic({ ssr: false })`)
 * so the meta carousel doesn't pay the cost of an RSC bail-out per
 * slide. Every sketch file already declares `"use client"`, so static
 * imports here are safe — `window` / p5 only initialise at mount, not
 * at import time.
 */
import type { ComponentType } from "react";
import type { ColorMode } from "./content-types";

import { ShapeOfTimeCanvas } from "@/components/sketches/ShapeOfTimeCanvas";
import { ShapeOfTimeGridCanvas } from "@/components/sketches/ShapeOfTimeGridCanvas";
import { RadialsCanvas } from "@/components/sketches/RadialsCanvas";
import { LissajousCanvas } from "@/components/sketches/LissajousCanvas";
import { LissajousPairLinesCanvas } from "@/components/sketches/LissajousPairLinesCanvas";
import { LissajousLatticeCanvas } from "@/components/sketches/LissajousLatticeCanvas";
import { LissajousCousinsCanvas } from "@/components/sketches/LissajousCousinsCanvas";
import { LissajousAliasingCompareCanvas } from "@/components/sketches/LissajousAliasingCompareCanvas";
import { LissajousAssignmentCompareCanvas } from "@/components/sketches/LissajousAssignmentCompareCanvas";
import { LissajousGridLabelledCanvas } from "@/components/sketches/LissajousGridLabelledCanvas";
import { LissajousSmoothGridCanvas } from "@/components/sketches/LissajousSmoothGridCanvas";
import { LissajousUniqueGridCanvas } from "@/components/sketches/LissajousUniqueGridCanvas";
import { LissajousGridCanvas } from "@/components/sketches/LissajousGridCanvas";
import { LissajousGridFullCanvas } from "@/components/sketches/LissajousGridFullCanvas";
import { LissajousPortraitsCanvas } from "@/components/sketches/LissajousPortraitsCanvas";
import { LissajousFullCanvas } from "@/components/sketches/LissajousFullCanvas";
import { Wave1Canvas } from "@/components/sketches/Wave1Canvas";
import { Wave2Canvas } from "@/components/sketches/Wave2Canvas";
import { Wave3Canvas } from "@/components/sketches/Wave3Canvas";
import { Wave4Canvas } from "@/components/sketches/Wave4Canvas";
import { Wave5Canvas } from "@/components/sketches/Wave5Canvas";
import { Wave6Canvas } from "@/components/sketches/Wave6Canvas";
import { JellyfishGridCanvas } from "@/components/sketches/JellyfishGridCanvas";
import { RoseGridCanvas } from "@/components/sketches/RoseGridCanvas";
import { RosePortraitsCanvas } from "@/components/sketches/RosePortraitsCanvas";
import { EternalReturnObservedCanvas } from "@/components/sketches/EternalReturnObservedCanvas";
import { EternalReturnUnobservedCanvas } from "@/components/sketches/EternalReturnUnobservedCanvas";
import { MultiverseCanvas } from "@/components/sketches/MultiverseCanvas";
import { MirrorCanvas } from "@/components/sketches/MirrorCanvas";
import { TobritCanvas } from "@/components/sketches/TobritCanvas";

type SketchEntry = {
  Component: ComponentType<Record<string, unknown>>;
  bg: string;
  colorMode?: ColorMode;
};

// Cast through `unknown` because the per-canvas prop signatures vary
// (some accept `inFlow`, some don't) — the Sketch primitive passes
// `inFlow` defensively and unknown props are ignored.
const C = <T,>(x: T) => x as unknown as ComponentType<Record<string, unknown>>;

export const SKETCHES: Record<string, SketchEntry> = {
  // ─── Animations: shape-of-time ───
  "shape-of-time": { Component: C(ShapeOfTimeCanvas), bg: "#000" },
  "shape-of-time-grid": { Component: C(ShapeOfTimeGridCanvas), bg: "#130c12" },

  // ─── Animations: emergence (RadialsCanvas) ───
  emergence: { Component: C(RadialsCanvas), bg: "#fff" },

  // ─── Animations: lissajous family ───
  "lissajous-canvas": { Component: C(LissajousCanvas), bg: "#000" },
  "lissajous-pair-lines": { Component: C(LissajousPairLinesCanvas), bg: "#130c12" },
  "lissajous-lattice": { Component: C(LissajousLatticeCanvas), bg: "#130c12" },
  "lissajous-cousins": { Component: C(LissajousCousinsCanvas), bg: "#130c12" },
  "lissajous-aliasing-compare": {
    Component: C(LissajousAliasingCompareCanvas),
    bg: "#130c12",
  },
  "lissajous-assignment-compare": {
    Component: C(LissajousAssignmentCompareCanvas),
    bg: "#130c12",
  },
  "lissajous-grid-labelled": {
    Component: C(LissajousGridLabelledCanvas),
    bg: "#130c12",
  },
  "lissajous-smooth-grid": {
    Component: C(LissajousSmoothGridCanvas),
    bg: "#130c12",
  },
  "lissajous-unique": { Component: C(LissajousUniqueGridCanvas), bg: "#130c12" },
  "lissajous-grid": { Component: C(LissajousGridCanvas), bg: "#130c12" },
  "lissajous-grid-full": { Component: C(LissajousGridFullCanvas), bg: "#130c12" },
  "lissajous-portraits": { Component: C(LissajousPortraitsCanvas), bg: "#130c12" },
  "lissajous-full": { Component: C(LissajousFullCanvas), bg: "#130c12" },

  // ─── Animations: wave family ───
  "wave-1": { Component: C(Wave1Canvas), bg: "#000" },
  "wave-2": { Component: C(Wave2Canvas), bg: "#000" },
  "wave-3": { Component: C(Wave3Canvas), bg: "#000" },
  "wave-4": { Component: C(Wave4Canvas), bg: "#000" },
  "wave-5": { Component: C(Wave5Canvas), bg: "#000" },
  "wave-6": { Component: C(Wave6Canvas), bg: "#000" },
  "jellyfish-grid": { Component: C(JellyfishGridCanvas), bg: "#000" },

  // ─── Animations: roses, eternal return, multiverse, mirror ───
  "roses-grid": { Component: C(RoseGridCanvas), bg: "#000d19" },
  "roses-portraits": { Component: C(RosePortraitsCanvas), bg: "#000d19" },
  "eternal-return-observed": {
    Component: C(EternalReturnObservedCanvas),
    bg: "#000",
  },
  "eternal-return-unobserved": {
    Component: C(EternalReturnUnobservedCanvas),
    bg: "#000",
  },
  multiverse: { Component: C(MultiverseCanvas), bg: "#00001c" },
  mirror: { Component: C(MirrorCanvas), bg: "#130c12" },
};

/**
 * Overlay sketches — paint transparent and sit on top of slide content.
 * They don't drive slide bg or colorMode; the project's frontmatter
 * `colorMode` still applies.
 */
type OverlayEntry = {
  Component: ComponentType<Record<string, unknown>>;
};

export const OVERLAY_SKETCHES: Record<string, OverlayEntry> = {
  "tobrit-faces": { Component: C(TobritCanvas) },
};

/**
 * Derive colorMode from a hex bg.
 *   - Luminance > ~0.55 → "light" (light bg, dark ink)
 *   - else → "dark" (dark bg, light ink)
 *
 * Author can override via the explicit `colorMode` prop on a Sketch
 * piece for ambiguous mid-luma backgrounds.
 */
export function deriveColorMode(bg: string): ColorMode {
  let r = 0,
    g = 0,
    b = 0;
  const hex = bg.trim().toLowerCase();
  if (hex.startsWith("#")) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
  } else if (hex.startsWith("rgb")) {
    const m = hex.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
      r = parseInt(m[1], 10);
      g = parseInt(m[2], 10);
      b = parseInt(m[3], 10);
    }
  }
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.55 ? "light" : "dark";
}
