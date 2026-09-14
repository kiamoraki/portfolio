"use client";

import { loadP5 } from "./loadP5";
import { setWaveBox } from "./waveLayout";

import { useEffect, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type P5 = any;

export function WaveCanvasShell({ sketch }: { sketch: (p: P5) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let instance: P5 = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;

    // Wrap the user sketch so we can pin pixelDensity and force a full
    // canvas-context clear each frame (avoiding any p5 background() quirks
    // that have been causing partial fills on mobile).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrappedSketch = (p: any) => {
      sketch(p);
      const originalSetup = p.setup;
      p.setup = () => {
        p.pixelDensity(1);
        originalSetup?.();
      };
      const originalDraw = p.draw;
      p.draw = () => {
        const ctx = p.drawingContext;
        const c = p.canvas;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.restore();
        originalDraw?.();
      };
    };

    // Publish the box the canvas actually occupies BEFORE p5 mounts,
    // so the very first `computeWaveLayout()` inside `p.setup` sizes
    // the pixel buffer to the display size instead of the 700px
    // fallback. `ro` then keeps it current: the split template's media
    // column changes height with the viewport, and the sketches only
    // re-derive their layout inside `p.windowResized`, which a pure
    // container resize (no window resize) never fires.
    const publish = () => {
      const el = ref.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      setWaveBox({ width: r.width, height: r.height });
      return true;
    };
    publish();

    let ro: ResizeObserver | null = null;

    (async () => {
      const P5Ctor = await loadP5();
      if (cancelled || !ref.current) return;
      publish();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance = new P5Ctor(wrappedSketch as any, ref.current) as any;
      if (typeof ResizeObserver !== "undefined") {
        ro = new ResizeObserver(() => {
          // `windowResized` is the sketches' one re-layout entry point;
          // calling it directly re-runs `computeWaveLayout()` against
          // the box just published and resizes the buffer to match.
          if (!publish()) return;
          instance?.windowResized?.();
          // p5's `resizeCanvas` rewrites the canvas element's INLINE
          // width/height to the new pixel dimensions, wiping the
          // `100%` sizing each sketch sets in `setup`. On mobile the
          // buffer is the viewport (375x800) while the box is a
          // 343x343 square, so losing those styles blew the canvas
          // out of its container. Re-assert them after every
          // re-layout.
          const c = instance?.canvas as HTMLCanvasElement | undefined;
          if (c) {
            c.style.display = "block";
            c.style.width = "100%";
            c.style.height = "100%";
          }
        });
        ro.observe(ref.current);
      }
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) instance?.loop?.();
            else instance?.noLoop?.();
          }
        },
        { threshold: 0.05 }
      );
      io.observe(ref.current);
    })();
    return () => {
      cancelled = true;
      ro?.disconnect();
      io?.disconnect();
      instance?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      // Layout aspect (1×1 on desktop, 1×2 on mobile) driven by CSS
      // media query in globals.css — see .wave-canvas-shell rules.
      // Going through a class avoids the SSR-vs-client hydration
      // mismatch that an inline `typeof window` check would cause.
      className="wave-canvas-shell"
      style={{
        width: "100%",
        background: "#000",
        display: "block",
      }}
    />
  );
}
