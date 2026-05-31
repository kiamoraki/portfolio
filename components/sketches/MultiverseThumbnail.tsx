"use client";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;
const NUM_ORBITS = 4;

// One molecule from the multiverse grid, static-sized (no breathing), on black.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;

  const angle: number[] = [];
  const angleAdder: number[] = [];
  const orbitAngle: number[] = [];
  const orbitAngleAdder = 0.01;
  const electrons: number[] = [];
  const electronInterval: number[] = [];
  const ampA = [22, 22, -22, -22];
  const ampB = [22, -22, 22, -22];

  for (let i = 0; i < NUM_ORBITS; i++) {
    angle.push(0);
    angleAdder.push(0.01 + Math.random() * 0.04);
    orbitAngle.push(-2 * Math.PI + Math.random() * 4 * Math.PI);
    const n = 2 + 2 * i;
    electrons.push(n);
    electronInterval.push((2 * Math.PI) / n);
  }

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
  };

  p.draw = () => {
    p.background(0);
    p.fill(42, 88, 255);
    p.noStroke();

    for (let j = 0; j < NUM_ORBITS; j++) {
      if (orbitAngle[j] > 2 * Math.PI) orbitAngle[j] = 0;
      orbitAngle[j] += orbitAngleAdder;
      if (angle[j] > 2 * Math.PI) angle[j] = 0;
      angle[j] += angleAdder[j];

      const so = Math.sin(orbitAngle[j]);
      const co = Math.cos(orbitAngle[j]);
      const n = electrons[j];
      const interval = electronInterval[j];
      const aA = ampA[j];
      const aB = ampB[j];

      for (let i = 0; i < n; i++) {
        const a = angle[j] + i * interval;
        const sa = Math.sin(a);
        const ca = Math.cos(a);
        const px = cx + aA * ca * co - aB * sa * so;
        const py = cy + aA * sa * so + aB * sa * co;
        p.circle(px, py, 2.8);
      }
    }
  };
};

export function MultiverseThumbnail() {
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
