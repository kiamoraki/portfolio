/**
 * Content schema for the unified project + piece model.
 *
 * The mental model:
 *   - A `Piece` is the atomic unit of content. It carries its own tags,
 *     credit, and date. The actual visual it represents is one of the
 *     named `Layout` primitives.
 *   - A `Project` is metadata about a project (title, description,
 *     colorMode, etc.). Its pieces live in the MDX body of the project
 *     file as JSX, and are also extracted at build time into a flat
 *     content index keyed by project slug.
 *   - Meta pages render queries over the content index:
 *       activations = group by project (one slide per project)
 *       animations  = group by piece    (one slide per piece)
 *
 * This file is the single source of truth for shapes. The primitives,
 * the build script, and the renderers all import from here.
 */
export type ColorMode = "light" | "dark";

/** Project frontmatter (read from `content/projects/<slug>.mdx`). */
export type ProjectMeta = {
  slug: string;
  title: string;
  description: string;
  colorMode: ColorMode;
  /** Display year — single year, range ("2020-25"), or month ("2023-08"). */
  year: string;
  /** Project-default credit. Individual pieces may override. */
  credit?: string;
  location?: string;
  thumb?: string;
  /** Legacy path for the old static site, used by build-redirects. */
  legacyPath?: string;
};

/** A leaf image reference used inside grouping primitives. */
export type ImageRef = {
  src: string;
  alt?: string;
  /** Hide this image in the mobile rendering of its grouping. */
  hideOnMobile?: boolean;
  /** Vertical flip in mobile rendering. (Carried over from moon raves.) */
  flipY?: boolean;
};

/**
 * Layout primitives — the visual vocabulary. The renderer maps each
 * `kind` to a concrete React component (see `components/content/primitives.tsx`).
 *
 * Every primitive that draws a sketch carries an explicit `bg` so the
 * slide background + chrome color mode can derive from it.
 */
export type Layout =
  // --- Image leaves ---
  | { kind: "cover"; src: string; alt?: string }
  | { kind: "single"; src: string; alt?: string }
  // --- Grouping ---
  | { kind: "pair"; items: ImageRef[] }
  | { kind: "row"; items: ImageRef[] }
  | { kind: "rowCover"; items: ImageRef[] }
  | { kind: "grid"; cols: number; rows: number; items: ImageRef[] }
  | { kind: "grid2x2"; items: ImageRef[] }
  | { kind: "grid3x2"; items: ImageRef[] }
  | { kind: "stackPairSide"; items: ImageRef[] }
  | { kind: "stack3PairSide"; items: ImageRef[] }
  | {
      kind: "videoTopLeft";
      videoSrc: string;
      videoPoster?: string;
      items: ImageRef[];
    }
  // --- Media ---
  | { kind: "video"; src: string; poster?: string; fit?: "cover" | "contain" }
  | { kind: "iframe"; src: string; aspect?: number; title?: string }
  // --- Sketches ---
  | {
      kind: "sketch";
      /** Sketch id resolved against the sketch registry. */
      id: string;
      /** Hex bg color the sketch paints. Drives slide bg + derived colorMode. */
      bg: string;
      /** Optional override when bg luminance is ambiguous. */
      colorMode?: ColorMode;
    }
  | {
      kind: "sketchOverlay";
      /** Sketch id resolved against the sketch registry. */
      id: string;
    }
  // --- Text ---
  | { kind: "text"; body: string }
  | { kind: "credits"; body: string };

/**
 * The build-time content index entry. Emitted by
 * `scripts/build-content-index.mjs` for every `<Piece>` in every project
 * MDX. Meta pages query this array.
 *
 * Note: this doesn't carry rendered children — for actual rendering the
 * page reads the project's compiled MDX and uses a render context to
 * filter to the relevant `<Piece>`s.
 */
export type PieceIndexEntry = {
  projectSlug: string;
  /** Stable id: explicit `id` prop on `<Piece>`, or `<slug>-<index>`. */
  pieceId: string;
  /** Author-declared tags on the piece. */
  tags: string[];
  /** Optional per-piece credit (otherwise inherits project.credit). */
  credit?: string;
  /** Optional per-piece date (otherwise inherits project.year). */
  date?: string;
  /** 0-based position within the project body. Defines order. */
  indexInProject: number;
  /** Sketch-shaped pieces carry their bg for color-mode derivation. */
  sketch?: { id: string; bg: string; colorMode?: ColorMode };
};
