"use client";

import { useEffect, useRef } from "react";
import { loadP5 } from "./loadP5";

type SketchFn = (p: unknown) => void;

type Options = {
  /** IntersectionObserver root margin. Defaults to "150px" so a
   *  sketch starts mounting just before the user scrolls it into
   *  view — buys time for the p5 chunk to load + the canvas to do
   *  its first draw before the user actually sees it. */
  rootMargin?: string;
  /** Fires once when the p5 instance is created and `setup()` has
   *  run. Hook for callers that want to swap out a static
   *  placeholder image for the live canvas. */
  onReady?: () => void;
};

/**
 * Shared hook for the homepage thumbnails. Behaviour:
 *
 *  1. Mounts an `IntersectionObserver` on the container ref.
 *  2. On FIRST intersection: dynamically loads p5 (via the shared
 *     singleton `loadP5()` cache), instantiates the sketch, calls
 *     the optional `onReady` callback.
 *  3. On subsequent intersections: `loop()` / `noLoop()` to pause
 *     the draw loop when the sketch scrolls off-screen and resume
 *     when it returns.
 *
 * Why this matters: without lazy-mount, every homepage sketch
 * pulls the ~1MB p5 chunk + runs its first draw immediately on
 * page load — even the ones below the fold the user hasn't
 * scrolled to yet. With lazy-mount, off-screen sketches don't
 * pay any CPU/network cost until the user actually arrives.
 *
 * Earlier version of these thumbnails mounted p5 eagerly and only
 * used the observer for pause/resume — that's now consolidated
 * into one path here.
 */
export function useLazySketch(sketch: SketchFn, options: Options = {}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let p5Instance: any = null;
    let mounting = false;

    const el = containerRef.current;
    if (!el) return;

    const mount = async () => {
      if (mounting || p5Instance || cancelled) return;
      mounting = true;
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new (P5 as any)(sketch, containerRef.current);
      mounting = false;
      options.onReady?.();
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!p5Instance) {
              void mount();
            } else {
              p5Instance.loop?.();
            }
          } else if (p5Instance) {
            p5Instance.noLoop?.();
          }
        }
      },
      {
        threshold: 0,
        rootMargin: options.rootMargin ?? "150px",
      },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer?.disconnect();
      p5Instance?.remove?.();
      p5Instance = null;
    };
    // The sketch function is module-level in every caller (defined
    // outside the component), so the reference is stable across
    // renders. Same for the `onReady` callback — passing inline is
    // fine because the effect only watches the deps list, and any
    // useEffect re-run would tear down + re-mount, which is OK.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return containerRef;
}
