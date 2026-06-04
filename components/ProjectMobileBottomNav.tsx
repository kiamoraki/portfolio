"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
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

  // Track the iOS Safari / Android Chrome bottom URL bar via the
  // VisualViewport API. When the bar is visible, the visual viewport
  // is shorter than the layout viewport at the bottom; `bottom: 0` on a
  // `position: fixed` element lands BEHIND that bar. Writing
  // `--browser-chrome-bottom-h` onto `<html>` lets the CSS rule for
  // `.project-mobile-bottom-nav` raise the nav by exactly that much,
  // and the value updates as the bar shows / hides on scroll.
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const root = document.documentElement;
    const vv = window.visualViewport;
    const update = () => {
      const layoutH = window.innerHeight;
      // `vv.offsetTop` covers virtual-keyboard offsets; subtracting it
      // leaves just the chrome bar's height at the bottom.
      const chromeH = Math.max(0, layoutH - vv.height - vv.offsetTop);
      root.style.setProperty("--browser-chrome-bottom-h", `${chromeH}px`);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.style.removeProperty("--browser-chrome-bottom-h");
    };
  }, []);

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
      {/* Each PREV / NEXT button is the FULL chrome-bar hit area
          (56px tall on mobile via CSS), but the visible chip is the
          inner `__chip` span at 44px — so taps land on the surrounding
          12px of padding too. This trades a denser-looking chrome
          rail (44px chip) for an iOS-HIG-friendly hit target (56px).
          The chip is `pointer-events: none` so clicks always resolve
          to the `<button>`. */}
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-prev"
        onClick={handlePrev}
        aria-label={ariaPrev}
      >
        <span className="project-mobile-bottom-nav-link__chip">prev</span>
      </button>
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-next"
        onClick={handleNext}
        aria-label={ariaNext}
      >
        <span className="project-mobile-bottom-nav-link__chip">next</span>
      </button>
    </nav>
  );
}
