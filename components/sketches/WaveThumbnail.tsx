"use client";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;

// Wave 5 sq7 (bottom-left cell) rendered as a thumbnail.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const square = 80;
  const cx = square / 2;
  const cy = square / 2;
  const amp = square / 2;
  const angleAdder = 0.008;
  const dot = 3;
  let angle = 0;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
  };

  p.draw = () => {
    p.clear();
    angle += angleAdder;
    const a = angle;

    p.stroke(181, 136, 255, 220);
    p.strokeWeight(1.8);

    p.push();
    p.translate((THUMB_SIZE - square) / 2, (THUMB_SIZE - square) / 2);

    const interval_2 = (2 * Math.PI) / 20;
    const interval = (2 * Math.PI) / 4;
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k < 4; k++) {
      const r = Math.cos((5 * (a + interval_2 * k)) / 3) * amp;
      for (let m = 0; m < 2; m++) {
        pts.push({
          x: cx + r * Math.sin(a + interval * m),
          y: cy + r * Math.cos(a + interval * k),
        });
      }
    }

    p.fill(181, 136, 255, 220);
    p.beginShape();
    for (const pt of pts) p.vertex(pt.x, pt.y);
    p.endShape();

    p.pop();
  };
};

export function WaveThumbnail() {
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
      p5Instance = new P5(sketch as any, containerRef.current) as any;

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
