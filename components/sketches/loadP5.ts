/**
 * Shared p5 dynamic-import loader.
 *
 * Every sketch component used to do `await import("p5")` independently
 * in its `useEffect`. Webpack/Turbopack dedupes the module-graph entry,
 * but each `await import()` is still a separate microtask that the
 * bundler can't collapse — and the very first canvas to mount still
 * pays the synchronous dynamic-import cost. Multiple canvases mounting
 * in the same frame (e.g. the meta-carousel's neighbour-mount window,
 * or a project page with several stacked sketches) used to fire 3+
 * concurrent `await import("p5")` calls; they all resolve to the same
 * module instance, but the chunk loader queues them rather than
 * sharing the in-flight promise.
 *
 * This singleton caches the promise on first call so subsequent
 * callers receive the SAME pending import. Once resolved, every
 * subsequent caller gets the cached constructor synchronously (well,
 * via a resolved promise — still microtask-deferred, but no chunk
 * loader involvement).
 *
 * Usage:
 *   const P5 = await loadP5();
 *   const instance = new P5(sketch, containerRef.current);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function loadP5(): Promise<any> {
  if (cached) return cached;
  cached = import("p5").then((mod) => mod.default);
  return cached;
}
