"use client";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;
// Last cell of the first row in the 9x9 grid (x=8, y=0).
const PETAL_X = 9;
const PETAL_Y = 1;
const AMP = 18;
const ANGLE_ADDER = 0.1;
const PCT_INCREMENT = 0.01;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let angle = 0;
  // Initial pct matches the original rose's initG/255 at this cell: 15*(8+0)/255.
  let pct = 120 / 255;
  let increment = PCT_INCREMENT;
  const theta = PETAL_X / PETAL_Y !== 1 ? 2 * PETAL_Y * 180 : 360;
  const ratio = PETAL_X / PETAL_Y;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(29);
  };

  p.draw = () => {
    p.background(0);

    if (angle <= 360) angle += ANGLE_ADDER;
    else angle = 0;
    pct += increment;
    if (pct > 1) { pct = 1; increment *= -1; }
    if (pct < 0) { pct = 0; increment *= -1; }

    const r = (1 - pct) * 255 + pct * 0;
    const g = (1 - pct) * 0 + pct * 255;
    const b = 255;

    p.noStroke();
    p.fill(r, g, b);
    const cx = THUMB_SIZE / 2;
    const cy = THUMB_SIZE / 2;
    for (let i = 0; i < theta; i += 10) {
      const radian = (Math.PI / 180) * (angle + i);
      const polar = AMP + AMP * Math.cos(ratio * radian);
      const x = cx + polar * Math.cos(radian);
      const y = cy + polar * Math.sin(radian);
      p.circle(x, y, 2.8);
    }
  };
};

export function RosesThumbnail() {
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
