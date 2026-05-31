"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCarouselState } from "@/components/CarouselState";

// Pages whose project page hosts its own internal carousel (the
// component published its controls via useReportCarouselState). On
// these pages the bottom nav drives the carousel's prev/next instead
// of navigating between projects.
const PAGES_WITH_MOBILE_CAROUSEL = new Set<string>([
  "/projects/lissajous",
  "/projects/wave",
]);

type ProjectRef = { slug: string; title: string };

export function ProjectMobileBottomNav({
  prev,
  next,
  isMeta,
}: {
  prev: ProjectRef;
  next: ProjectRef;
  // Meta pages (e.g. /projects/animations) use MetaCarousel, which
  // ships its own visible prev/next + counter at the bottom of each
  // slide — we render nothing here on those so they don't double up.
  isMeta: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { controlsRef } = useCarouselState();

  if (isMeta) return null;

  const normalizedPath = (pathname ?? "").replace(/\/$/, "");
  const useCarouselControls =
    PAGES_WITH_MOBILE_CAROUSEL.has(normalizedPath);

  const handlePrev = () => {
    if (useCarouselControls && controlsRef.current) {
      controlsRef.current.prev();
    } else {
      router.push(`/projects/${prev.slug}`);
    }
  };
  const handleNext = () => {
    if (useCarouselControls && controlsRef.current) {
      controlsRef.current.next();
    } else {
      router.push(`/projects/${next.slug}`);
    }
  };

  const ariaPrev = useCarouselControls
    ? "Previous slide"
    : `Previous project: ${prev.title}`;
  const ariaNext = useCarouselControls
    ? "Next slide"
    : `Next project: ${next.title}`;

  return (
    <nav
      className="project-mobile-bottom-nav"
      aria-label={useCarouselControls ? "Slide navigation" : "Project navigation"}
    >
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-prev"
        onClick={handlePrev}
        aria-label={ariaPrev}
      >
        <svg
          className="project-mobile-bottom-nav-arrow"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="15,4 7,12 15,20" />
        </svg>
      </button>
      <button
        type="button"
        className="project-mobile-bottom-nav-link project-mobile-bottom-nav-link--slide-next"
        onClick={handleNext}
        aria-label={ariaNext}
      >
        <svg
          className="project-mobile-bottom-nav-arrow"
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9,4 17,12 9,20" />
        </svg>
      </button>
    </nav>
  );
}
