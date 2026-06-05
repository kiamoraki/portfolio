"use client";

import { loadP5 } from "./loadP5";

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

    (async () => {
      const P5Ctor = await loadP5();
      if (cancelled || !ref.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instance = new P5Ctor(wrappedSketch as any, ref.current) as any;
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
