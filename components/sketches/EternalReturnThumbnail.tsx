"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;
const NUM_PTS = 7;
const BOX = 60;
const AMP = 22;
const FRAMES_PER_CYCLE = 24 * 5;

// One eternal-return ring: points slide from a square outline to an inner
// ring and back, looping smoothly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;
  const tx = cx - BOX / 2;
  const ty = cy - BOX / 2;
  const inc = BOX / NUM_PTS;

  const sourcePts: { x: number; y: number }[] = [];
  for (let i = 0; i < NUM_PTS; i++) sourcePts.push({ x: i * inc + tx, y: ty });
  for (let j = 0; j < NUM_PTS; j++) sourcePts.push({ x: BOX + tx, y: j * inc + ty });
  for (let k = 0; k < NUM_PTS; k++) sourcePts.push({ x: BOX - k * inc + tx, y: BOX + ty });
  for (let l = 0; l < NUM_PTS; l++) sourcePts.push({ x: tx, y: BOX - l * inc + ty });

  const angleStep = (2 * Math.PI) / sourcePts.length;
  const innerRing: { x: number; y: number }[] = [];
  for (let n = 0; n < sourcePts.length; n++) {
    const ang = angleStep * n + (5 * Math.PI) / 4;
    innerRing.push({
      x: cx + Math.cos(ang) * AMP,
      y: cy + Math.sin(ang) * AMP,
    });
  }

  let frame = 0;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
  };

  p.draw = () => {
    p.clear();
    frame++;
    const phase = (frame % FRAMES_PER_CYCLE) / FRAMES_PER_CYCLE;
    const pct = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

    p.fill(181, 136, 255, 230);
    p.noStroke();
    for (let i = 0; i < sourcePts.length; i++) {
      const x = (1 - pct) * sourcePts[i].x + pct * innerRing[i].x;
      const y = (1 - pct) * sourcePts[i].y + pct * innerRing[i].y;
      p.circle(x, y, 2.8);
    }
  };
};

export function EternalReturnThumbnail() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let intersectionObserver: IntersectionObserver | null = null;

    (async () => {
      const P5 = await loadP5();
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
