"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const THUMB_SIZE = 90;

// A single jellyfish cell from JellyfishGridCanvas rendered at thumbnail
// scale — same magenta↔blue color-lerping Lissajous dot ring pattern
// as one of the 3×6 grid cells, scaled down to 90×90 with smaller
// amplitude. Identical render technique to its grid sibling but
// without the multi-cell setup.
const INCREMENT = 0.0091;
const NUM_PARTICLES = 5;
// Beefier dots — was 1.6px. At THUMB_SIZE 90×90, 1.6 reads as faint
// pixel dust on the grid card; 3 fills in nicely without smearing
// adjacent rings together.
const RADIUS = 3;

function gcd(a: number, b: number): number {
  let x = Math.abs(a) || 1;
  let y = Math.abs(b) || 1;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

type Lissa = {
  amp: number;
  ampMax: number;
  ampAdder: number;
  freqA: number;
  freqB: number;
  theta: number;
  angle: number;
  angleAdder: number;
  phase: number;
  kPct: number;
  pctAdder: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let lissas: Lissa[] = [];

  const buildLissas = () => {
    lissas = [];
    const ampMax = THUMB_SIZE * 0.35;
    // Pick a stable freqA/freqB combo that produces a recognisable
    // closed Lissajous figure at thumbnail scale. (Sampling randomly
    // every mount makes the cards twitchy across reloads.)
    const freqA = 3;
    const freqB = 5;
    const g = gcd(freqA, freqB);
    const theta = (2 * Math.PI) / g;
    let angle = 0;

    const ampAdder = (INCREMENT / theta) * ampMax;
    const phase = theta / NUM_PARTICLES;

    for (let i = 0; i < ampMax; i += 2) {
      const amp = i;
      angle += INCREMENT * ((i / ampMax) * theta);
      let cPct: number;
      if (i < ampMax / 2) cPct = i / (ampMax / 2);
      else cPct = (i - ampMax / 2) / (ampMax / 2);
      lissas.push({
        amp,
        ampMax,
        ampAdder,
        freqA,
        freqB,
        theta,
        angle,
        angleAdder: INCREMENT,
        phase,
        // All rings start at `kPct: 0` (magenta-pink end of the lerp)
        // so the first frame reads uniformly magenta on the grid card.
        // Per-ring `pctAdder` variation keeps them from ping-ponging
        // in lockstep as the animation runs.
        kPct: 0,
        pctAdder: INCREMENT * 2 * (1 + cPct),
      });
    }
  };

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
    buildLissas();
  };

  p.draw = () => {
    p.clear();
    p.noStroke();
    const cx = THUMB_SIZE / 2;
    const cy = THUMB_SIZE / 2;

    for (const lissa of lissas) {
      lissa.angle += lissa.angleAdder;
      if (lissa.angle <= lissa.theta) lissa.angle += lissa.angleAdder;
      else lissa.angle = 0;

      lissa.kPct += lissa.pctAdder;
      if (lissa.kPct > 1 || lissa.kPct < 0) lissa.pctAdder *= -1;

      lissa.amp -= lissa.ampAdder;
      if (lissa.amp <= 0) lissa.amp = lissa.ampMax;

      // Lerp magenta-pink (255, 0, 255) → blue (0, 0, 255) — the
      // original palette. Briefly tried the warmer (255, 105, 180)
      // hot-pink endpoint but the original magenta-pink reads
      // better against the black bg.
      const t = Math.max(0, Math.min(1, lissa.kPct));
      const r = 255 + (0 - 255) * t;
      const g = 0;
      const b = 255;

      let alpha = 80 + 275 * Math.sin(lissa.angle / lissa.theta);
      if (alpha < 0) alpha = 0;
      if (alpha > 255) alpha = 255;

      for (let np = 0; np < NUM_PARTICLES; np++) {
        const ang = lissa.angle + lissa.phase * np;
        const sA = Math.sin(lissa.freqA * ang);
        const sB = Math.sin(lissa.freqB * ang);
        p.fill(r, g, b, alpha);
        p.circle(cx + lissa.amp * sA, cy + lissa.amp * sB, RADIUS);
        p.fill(r, g, b, alpha);
        p.circle(cx + lissa.amp * sB, cy + lissa.amp * sA, RADIUS);
      }
    }
  };
};

export function JellyfishThumbnail() {
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
        { threshold: 0.05 },
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
