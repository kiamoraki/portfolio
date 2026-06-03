"use client";

/**
 * `<Piece>` — the atomic unit of content. Wraps a layout primitive and
 * carries metadata (id, tags, credit, date).
 *
 * Rendering contexts:
 *   1. Project page: render every piece in order. Plain pass-through.
 *   2. Meta by-piece (animations carousel): render the project's MDX
 *      inside `<PieceFilter onlyPieceId="lissajous-pair-lines">`. Each
 *      `<Piece>` checks `id === onlyPieceId` and returns null
 *      otherwise.
 *
 * The previous `visibleTag` filter mode was removed when the
 * activations + design meta routes moved from a tag-grouped carousel
 * to a TagIndex thumbnail grid.
 *
 * `id` is required. The build script reads it to build the content
 * index, and the by-piece renderer uses it to pick the right piece.
 * Convention: `<projectSlug>-<short-name>`, e.g. `tobrit-cover`,
 * `tobrit-build`, `lissajous-pair-lines`.
 *
 * `credit` and `date` are optional — when omitted, the renderer falls
 * back to the project frontmatter (`project.credit`, `project.year`).
 */
import { createContext, useContext, type ReactNode } from "react";

type PieceFilterValue = {
  onlyPieceId?: string;
};

const PieceFilterContext = createContext<PieceFilterValue>({});

export function PieceFilter({
  onlyPieceId,
  children,
}: PieceFilterValue & { children: ReactNode }) {
  return (
    <PieceFilterContext.Provider value={{ onlyPieceId }}>
      {children}
    </PieceFilterContext.Provider>
  );
}

type PieceProps = {
  id: string;
  /**
   * Tags can be authored two ways in MDX:
   *   - Array literal: `tags={["activation", "process"]}` — natural to
   *     read, but next-mdx-remote/rsc's JSX-expression handling drops
   *     it on the floor in this project (the prop arrives as undefined,
   *     so the default `[]` wins and filters everything out).
   *   - Comma-separated string: `tags="activation,process"` — always
   *     reaches the component intact.
   * Accept both shapes here.
   */
  tags?: string[] | string;
  credit?: string;
  date?: string;
  children: ReactNode;
};

export function Piece({ id, tags = [], children }: PieceProps) {
  const { onlyPieceId } = useContext(PieceFilterContext);

  const tagList: string[] = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  if (onlyPieceId !== undefined && id !== onlyPieceId) return null;

  return (
    <section className="piece" data-piece-id={id} data-piece-tags={tagList.join(",")}>
      {children}
    </section>
  );
}
