"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { NavigableProject, Project } from "@/lib/projects";
import { useCarouselState } from "@/components/CarouselState";

type Props = {
  slug: string;
  title: string;
  /** Optional project description from MDX frontmatter. When present,
   *  the title chip becomes a clickable button with a downward-facing
   *  caret; clicking opens a dropdown panel below the title that
   *  shows this text. Same pattern the meta-carousel uses for per-
   *  slide descriptions. */
  description?: string;
  /** Build-time prev/next for the FULL ring (no tag filter). Used as
   *  the SSR/initial-render values; the client recomputes when a
   *  `?tag=…` URL param scopes the ring. */
  prev: Project;
  next: Project;
  /** Lightweight {slug, title, tags} of every navigable project, so
   *  ProjectNav can recompute neighbors client-side when a tag filter
   *  is active (static export precludes server-side searchParams). */
  navigableProjects: NavigableProject[];
};

type NavRef = { slug: string; title: string };

/** Walks `list` (already filtered + ordered) to find the prev/next
 *  entry around `slug` with wrap-around. Returns the build-time
 *  `fallback` pair if the slug isn't in the list (defensive — meta
 *  projects don't appear in `navigableProjects`). */
function neighborsFromList(
  list: NavigableProject[],
  slug: string,
  fallback: { prev: NavRef; next: NavRef },
): { prev: NavRef; next: NavRef } {
  const idx = list.findIndex((p) => p.slug === slug);
  if (idx === -1 || list.length === 0) {
    return { prev: fallback.prev, next: fallback.next };
  }
  return {
    prev: list[(idx - 1 + list.length) % list.length],
    next: list[(idx + 1) % list.length],
  };
}

export function ProjectNav({
  slug,
  title,
  description,
  prev,
  next,
  navigableProjects,
}: Props) {
  // `theme` prop kept on the type for API stability but no longer
  // applied as a `.dark` className — theming cascades from body via
  // the page's inline `<style>` block (see app/projects/[slug]/page.tsx).
  const router = useRouter();
  const params = useSearchParams();
  const { state: carouselState, controlsRef, infoState, infoControlsRef, activeSlide } =
    useCarouselState();

  // Dropdown state for project description. Only used when the project
  // frontmatter sets a `description`. Clicking the title chip toggles
  // the panel; clicking outside it closes.
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  // On meta-carousel pages, `MetaCarousel` pushes `{title, description}`
  // of the active slide into `CarouselStateContext`; prefer those over
  // the meta project's static title/description so the slide-out chip
  // tracks the current piece (e.g. "Lissajous") instead of always
  // reading "Animations".
  const displayTitle = activeSlide?.title || title;
  const displayDescription = activeSlide?.description ?? description;
  const hasDescription =
    !!displayDescription && displayDescription.trim().length > 0;

  // When a carousel is registered (MetaCarousel mounts and calls
  // `useReportCarouselState`), the chrome's PREV/NEXT chips drive its
  // paging instead of navigating between projects. The check is
  // reactive on `carouselState` so the chips re-render from <Link> to
  // <button> as soon as the carousel hydrates.
  const carouselActive = carouselState !== null && controlsRef.current !== null;

  const tag = params.get("tag") ?? undefined;
  const suffix = tag ? `?tag=${tag}` : "";

  // Recompute neighbors client-side when a tag filter is active.
  // Without the filter we use the SSR-provided `prev`/`next` as-is
  // (no `<Link>` href changes either, so prefetching still works).
  const { prev: activePrev, next: activeNext } = useMemo(() => {
    if (!tag) return { prev, next };
    const filtered = navigableProjects.filter((p) => p.tags.includes(tag));
    return neighborsFromList(filtered, slug, { prev, next });
  }, [tag, slug, prev, next, navigableProjects]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // When a carousel is active, swallow ArrowUp/Down (carousel keys
      // are ArrowLeft/Right, handled inside MetaCarousel).
      if (carouselActive) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        router.push(`/projects/${activePrev.slug}${suffix}`);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        router.push(`/projects/${activeNext.slug}${suffix}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, activePrev.slug, activeNext.slug, suffix, carouselActive]);

  return (
    <nav className="nav-projects">
      {/* Title chip — sits between Home/CV (left) and prev/next chips
          (right) on desktop. Renders as a bordered chip matching the
          meta-carousel title style. The inline carets, slide dots, and
          up/down project chevrons that used to live inside this title
          have been removed in favor of the explicit prev/next chips
          below (`.project-nav-buttons`), so the chrome reads as one
          consistent navbar row across project + meta pages. */}
      {/* Wrap title + description panel in a positioning container so
          on mobile the caret toggle (`.project-title-toggle`) can be
          positioned as a square button below CV, and the title +
          description can slide out to the right relative to it.
          Desktop chrome strip layout is untouched — `.project-title`
          stays `position: fixed` and the wrapper is transparent. */}
      <div className="project-title-wrapper">
      {/* Mobile-only caret toggle — sits as a square button below the
          CV chip. Click reveals the title (slides out horizontally to
          the right); if a description exists it also reveals below the
          title. Click anywhere in the open region (caret/title/
          description) toggles it back closed. Hidden on desktop where
          the title chip sits in the chrome strip with its own caret. */}
      <button
        type="button"
        className={`project-title-toggle${descriptionOpen ? " project-title-toggle--open" : ""}`}
        onClick={() => setDescriptionOpen((o) => !o)}
        aria-expanded={descriptionOpen}
        aria-controls="project-title project-description-panel"
        aria-label={
          descriptionOpen ? "Close project title" : "Open project title"
        }
      >
        <svg
          className="project-title-toggle__glyph"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>
      {hasDescription ? (
        <button
          type="button"
          id="project-title"
          className={`project-title project-title--has-description${descriptionOpen ? " project-title--open" : ""}`}
          aria-expanded={descriptionOpen}
          aria-controls="project-description-panel"
          onClick={() => setDescriptionOpen((o) => !o)}
        >
          <span className="project-title__text">{displayTitle}</span>
          {/* Downward-facing caret — 2px-stroke SVG mirroring the
              meta-carousel-active-title glyph. Rotates 180° via CSS
              when the dropdown is open (selector reads the parent's
              `.project-title--open` modifier). Hidden on mobile —
              the toggle button has its own caret. */}
          <svg
            className="project-title__glyph"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6,9 12,15 18,9" />
          </svg>
        </button>
      ) : (
        // No description — render as button so mobile can still click
        // to close the title slide-out. Desktop CSS suppresses the
        // pointer cursor for this no-description variant.
        <button
          type="button"
          id="project-title"
          className={`project-title${descriptionOpen ? " project-title--open" : ""}`}
          onClick={() => setDescriptionOpen((o) => !o)}
        >
          <span className="project-title__text">{displayTitle}</span>
          {infoState ? (
            <button
              type="button"
              className={`project-info-toggle${infoState.visible ? " active" : ""}`}
              onClick={() => infoControlsRef.current?.toggle()}
              aria-label={infoState.visible ? "Hide project info" : "Show project info"}
              aria-pressed={infoState.visible}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" className="info-ring" />
                <circle
                  cx="12"
                  cy="7.5"
                  r="1.2"
                  fill="currentColor"
                  stroke="none"
                />
                <line x1="12" y1="11" x2="12" y2="17" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
        </button>
      )}
      {hasDescription ? (
        <div
          id="project-description-panel"
          className="project-description-panel"
          data-open={descriptionOpen ? "true" : "false"}
          role="region"
          aria-label="Project description"
          onClick={() => setDescriptionOpen((o) => !o)}
        >
          {/* Inner div constrains the description text to a readable
              line-length (`max-width: 700px`) and centers it inside
              the full-width panel. */}
          <div className="project-description-panel__inner">
            {displayDescription}
          </div>
        </div>
      ) : null}
      </div>
      {/* Prev/next project navigation — bordered text chips on the
          top-right, mirroring the meta carousel's prev/next chips
          (`.meta-carousel-btn`). When `?tag=…` is in the URL the chips
          point at projects scoped to the same tag and preserve the
          query string so the user stays inside the filter. */}
      <div className="project-nav-buttons">
        {carouselActive ? (
          <>
            <button
              type="button"
              className="project-nav-btn project-nav-prev"
              onClick={() => controlsRef.current?.prev()}
              aria-label="Previous slide"
            >
              prev
            </button>
            <button
              type="button"
              className="project-nav-btn project-nav-next"
              onClick={() => controlsRef.current?.next()}
              aria-label="Next slide"
            >
              next
            </button>
          </>
        ) : (
          <>
            <Link
              href={`/projects/${activePrev.slug}${suffix}`}
              className="project-nav-btn project-nav-prev"
              aria-label={`Previous project: ${activePrev.title}`}
            >
              prev
            </Link>
            <Link
              href={`/projects/${activeNext.slug}${suffix}`}
              className="project-nav-btn project-nav-next"
              aria-label={`Next project: ${activeNext.title}`}
            >
              next
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
