"use client";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;
const CYCLE_SECONDS = 6;
const FPS = 30;

export function MoonRavesThumbnail() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let intersectionObserver: IntersectionObserver | null = null;

    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        const cx = THUMB_SIZE / 2;
        const cy = THUMB_SIZE / 2;
        const r = THUMB_SIZE * 0.4;

        const drawMoonPhase = (phaseT: number) => {
          const theta = phaseT * 2 * Math.PI;
          const fLit = 0.5 * (1 - Math.cos(theta));
          const litRight = Math.sin(theta) >= 0;

          if (fLit < 0.001) return;

          p.noStroke();
          p.fill(0);

          if (fLit > 0.999) {
            p.circle(cx, cy, r * 2);
            return;
          }

          const e = r * (1 - 2 * fLit);
          const sign = litRight ? 1 : -1;

          p.beginShape();
          const seg = 48;
          for (let i = 0; i <= seg; i++) {
            const a = -Math.PI / 2 + (Math.PI * i) / seg;
            p.vertex(
              cx + sign * Math.cos(a) * r,
              cy + Math.sin(a) * r
            );
          }
          for (let i = seg; i >= 0; i--) {
            const a = -Math.PI / 2 + (Math.PI * i) / seg;
            p.vertex(
              cx + sign * Math.cos(a) * e,
              cy + Math.sin(a) * r
            );
          }
          p.endShape(p.CLOSE);
        };

        p.setup = () => {
          const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
          c.style("display", "block");
          p.frameRate(FPS);
        };

        p.draw = () => {
          p.clear();
          const cycleFrames = CYCLE_SECONDS * FPS;
          const phaseT = (p.frameCount % cycleFrames) / cycleFrames;
          drawMoonPhase(phaseT);
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, containerRef.current) as any;

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inst = p5Instance as any;
            if (!inst) continue;
            if (entry.isIntersecting) inst.loop?.();
            else inst.noLoop?.();
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      intersectionObserver?.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
