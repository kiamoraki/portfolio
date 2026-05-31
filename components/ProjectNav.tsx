"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Project } from "@/lib/projects";
import { useCarouselState } from "@/components/CarouselState";

type Props = {
  title: string;
  prev: Project;
  next: Project;
  theme?: "dark" | "light";
};

export function ProjectNav({ title, prev, next, theme = "light" }: Props) {
  const dark = theme === "dark";
  const router = useRouter();
  const {
    state: carousel,
    controlsRef,
    infoState,
    infoControlsRef,
  } = useCarouselState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        router.push(`/projects/${prev.slug}`);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        router.push(`/projects/${next.slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev.slug, next.slug]);

  return (
    <nav className={`nav-projects ${dark ? "dark" : ""}`}>
      <p className="project-title">
        <span>{title}</span>
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
        {carousel ? (
          <span className="slide-indicators">
            <button
              type="button"
              className="slide-nav-caret"
              onClick={() => controlsRef.current?.prev()}
              aria-label="Previous slide"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                width="16"
                height="16"
              >
                <polyline
                  points="15,4 9,12 15,20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {Array.from({ length: carousel.total }).map((_, i) => (
              <span
                key={i}
                className={`slide-indicator${i === carousel.pos ? " active" : ""}`}
                aria-hidden="true"
              />
            ))}
            <button
              type="button"
              className="slide-nav-caret"
              onClick={() => controlsRef.current?.next()}
              aria-label="Next slide"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                width="16"
                height="16"
              >
                <polyline
                  points="9,4 15,12 9,20"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </span>
        ) : null}
        <span className="project-nav-arrows">
          <Link
            href={`/projects/${prev.slug}`}
            className="project-nav-arrow"
            aria-label={`Previous: ${prev.title}`}
            style={{
              width: "auto",
              height: "auto",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "inherit",
              lineHeight: 0,
              textDecoration: "none",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              width="16"
              height="16"
            >
              <polyline
                points="4,15 12,9 20,15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="project-nav-arrow"
            aria-label={`Next: ${next.title}`}
            style={{
              width: "auto",
              height: "auto",
              margin: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "inherit",
              lineHeight: 0,
              textDecoration: "none",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              width="16"
              height="16"
            >
              <polyline
                points="4,9 12,15 20,9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </span>
      </p>
    </nav>
  );
}
