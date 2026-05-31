"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

type ProjectRef = { slug: string; title: string };

type ViewTransitionDocument = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

export function ProjectMobileHeaderNav({
  prev,
  next,
  theme = "light",
}: {
  prev: ProjectRef;
  next: ProjectRef;
  theme?: "dark" | "light";
}) {
  const router = useRouter();
  const dark = theme === "dark";

  const navigate =
    (href: string, direction: "prev" | "next") => (e: MouseEvent) => {
      e.preventDefault();
      const doc = document as ViewTransitionDocument;
      if (!doc.startViewTransition) {
        router.push(href);
        return;
      }
      document.documentElement.classList.add(`vt-${direction}`);
      const transition = doc.startViewTransition(() => {
        router.push(href);
      });
      transition.finished.finally(() => {
        document.documentElement.classList.remove(`vt-${direction}`);
      });
    };

  return (
    <nav
      className={`project-mobile-header-nav${dark ? " dark" : ""}`}
      aria-label="Project navigation"
    >
      <Link
        href={`/projects/${prev.slug}`}
        onClick={navigate(`/projects/${prev.slug}`, "prev")}
        className="project-mobile-header-nav-link"
        aria-label={`Previous project: ${prev.title}`}
      >
        prev
      </Link>
      <Link
        href={`/projects/${next.slug}`}
        onClick={navigate(`/projects/${next.slug}`, "next")}
        className="project-mobile-header-nav-link"
        aria-label={`Next project: ${next.title}`}
      >
        next
      </Link>
    </nav>
  );
}
