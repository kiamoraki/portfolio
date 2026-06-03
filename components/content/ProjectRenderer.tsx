"use client";

/**
 * ProjectRenderer — the unified renderer for v2 projects.
 *
 * Individual project pages are a single long-scroll page now. Pieces
 * stack vertically in `.project-track-content` (column on both mobile
 * and desktop). Each piece is a viewport-tall block on desktop so the
 * scroll experience reads like a slide deck — the user moves through
 * pieces by scrolling, not by paging. Per-piece styling matches the
 * meta carousel's slide styling so a project's pieces render the
 * same way on its own page and when surfaced as slides on a meta
 * carousel page.
 *
 * The horizontal-paged carousel (translateX driven by `--project-pos`,
 * arrow-key + swipe handlers, slide-count → CarouselStateContext) has
 * been removed. Prev/next on the chrome now navigate between projects,
 * not between pieces inside a project — handled by `<ProjectNav>` via
 * plain `<Link>`s, so this renderer no longer needs to know piece
 * count or expose navigation handlers.
 *
 * `<SketchOverlay>`s portaled to document.body inside Sketch.tsx
 * remain pinned via `position: fixed` and aren't affected by the
 * page scroll.
 */
import type { ReactNode } from "react";
import type { Project } from "@/lib/projects";
import { ColorModeBody } from "./ColorMode";

type Props = {
  project: Project;
  children: ReactNode;
};

export function ProjectRenderer({ project, children }: Props) {
  const resolvedColorMode =
    project.colorMode ?? (project.theme === "dark" ? "dark" : "light");

  return (
    <>
      <ColorModeBody mode={resolvedColorMode} />
      {/* `.project-track` and `.project-track-content` mirror the
          meta carousel's per-slide DOM shape — TagCarousel emits the
          same pair with the same `data-slug` attribute on
          `.project-track-content`. Carrying `data-slug` here too lets
          per-project CSS overrides target a single selector
          (`.project-track-content[data-slug="..."]`) and have it
          apply in BOTH contexts (standalone project page + meta
          carousel slide) without separate `body:has(main[...])` and
          `.meta-carousel-track > .project-track:has(...)` rules.
          See `data-slug="fake-rekordz"` etc. in globals.css. */}
      {/* `.project-track` and `.project-track-content` are kept so the
          existing per-piece CSS rules (`.project-track .piece
          .piece-layout--*` etc. in globals.css) continue to match
          without needing to be rewritten. The desktop @media rules
          for these classes have been updated to stack pieces in a
          column instead of paging them horizontally. */}
      <div className="project-track">
        <div className="project-track-content" data-slug={project.slug}>
          {children}
        </div>
      </div>
    </>
  );
}
