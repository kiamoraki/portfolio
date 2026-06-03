"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { NavigableProject, Project } from "@/lib/projects";
import { useCarouselState } from "@/components/CarouselState";

type NavRef = { slug: string; title: string };

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

export function ProjectMobileBottomNav({
  slug,
  prev,
  next,
  navigableProjects,
}: {
  slug: string;
  prev: Project;
  next: Project;
  navigableProjects: NavigableProject[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { state: carouselState, controlsRef } = useCarouselState();

  // When a carousel has registered prev/next via
  // `useReportCarouselState` (e.g. on the animations meta page),
  // drive its paging directly. Otherwise PREV/NEXT navigates between
  // projects, honoring the `?tag=…` URL filter if present.
  const carouselActive = carouselState !== null && controlsRef.current !== null;
  const tag = params.get("tag") ?? undefined;
  const suffix = tag ? `?tag=${tag}` : "";

  const { prev: activePrev, next: activeNext } = useMemo(() => {
    if (!tag) return { prev, next };
    const filtered = navigableProjects.filter((p) => p.tags.includes(tag));
    return neighborsFromList(filtered, slug, { prev, next });
  }, [tag, slug, prev, next, navigableProjects]);

  const handlePrev = () => {
    if (carouselActive) controlsRef.current?.prev();
    else router.push(`/projects/${activePrev.slug}${suffix}`);
  };
  const handleNext = () => {
    if (carouselActive) controlsRef.current?.next();
    else router.push(`/projects/${activeNext.slug}${suffix}`);
  };

  const ariaPrev = carouselActive
    ? "Previous slide"
    : `Previous project: ${activePrev.title}`;
  const ariaNext = carouselActive
    ? "Next slide"
    : `Next project: ${activeNext.title}`;

  return (
    <nav
      className="project-mobile-bottom-nav"
      aria-label={carouselActive ? "Slide navigation" : "Project navigation"}
    >
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-prev"
        onClick={handlePrev}
        aria-label={ariaPrev}
      >
        prev
      </button>
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-next"
        onClick={handleNext}
        aria-label={ariaNext}
      >
        next
      </button>
    </nav>
  );
}
