"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
    // Chrome Android fires neither `vv.resize` nor `vv.scroll` on
    // URL-bar transitions reliably — they only fire when the visible
    // viewport reaches its final state, leaving the bar slide
    // mid-transition with a stale chromeH. Listening to `window.scroll`
    // gives the formula a per-frame chance to recompute during the
    // bar's animation. `passive: true` so it doesn't block scrolling.
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
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

  // Tap-feedback flash. iOS Safari is unreliable about firing `:active`
  // on `<button>` for touch events, so we shadow the CSS pseudo with a
  // JS-driven `data-pressed` attribute that lights up the chip
  // immediately on the press and stays lit for 280ms — long enough for
  // the rainbow to register before SPA navigation completes. Tracked
  // per-button so the user can rapid-fire prev / next and see each
  // press confirmed.
  const [pressed, setPressed] = useState<"prev" | "next" | null>(null);
  const flash = (which: "prev" | "next") => {
    setPressed(which);
    window.setTimeout(() => setPressed((p) => (p === which ? null : p)), 280);
  };

  const handlePrev = () => {
    flash("prev");
    if (carouselActive) controlsRef.current?.prev();
    else router.push(`/projects/${activePrev.slug}${suffix}`);
  };
  const handleNext = () => {
    flash("next");
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
        data-pressed={pressed === "prev" ? "true" : undefined}
      >
        <span className="project-mobile-bottom-nav-link__chip">prev</span>
      </button>
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-next"
        onClick={handleNext}
        aria-label={ariaNext}
        data-pressed={pressed === "next" ? "true" : undefined}
      >
        <span className="project-mobile-bottom-nav-link__chip">next</span>
      </button>
    </nav>
  );
}
