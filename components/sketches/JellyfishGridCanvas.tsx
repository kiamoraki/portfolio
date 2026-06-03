"use client";

import { useEffect, useRef } from "react";

// Port of mshhllrk's "jellyfish-grid" p5 sketch
// (https://editor.p5js.org/mshhll.rk/sketches/ta3RXepbK):
// a 3×6 grid where each cell renders many concentric Lissajous "rings"
// of dots that shrink and respawn, color-lerping between magenta and
// blue. The combined effect is a column of pulsing jellyfish-like
// shapes. Adapted to fill the viewport on mobile and pause when
// off-screen.
const INCREMENT = 0.0091;
const NUM_PARTICLES = 5;
const RADIUS = 3;

const GRID_COLS = 3;
const GRID_ROWS = 6;

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
  originX: number;
  originY: number;
  amp: number;
  ampMax: number;
  ampAdder: number;
  freqA: number;
  freqB: number;
  theta: number;
  angle: number;
  angleAdder: number;
  phase: number;
  radius: number;
  k1: [number, number, number];
  k2: [number, number, number];
  kPct: number;
  pctAdder: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let lissas: Lissa[] = [];

  const dims = (): [number, number] => {
    // Canvas is sized to the live viewport so the 3×6 grid fills the
    // whole carousel slide on mobile. Falls back to the original
    // sketch's 452×803 portrait dims for SSR / no-window contexts.
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [452, 803];
  };

  const buildLissas = () => {
    lissas = [];
    const gridSquareW = p.width / GRID_COLS;
    const gridSquareH = p.height / GRID_ROWS;
    // Original used `grid_square_w / 2 - 35`, but the −35 margin is too
    // chunky on narrow viewports. Match the proportional spirit:
    // ampMax ≈ 35% of the min cell side so each jellyfish sits with
    // more breathing room inside its cell.
    const ampMax = Math.max(
      5,
      Math.min(gridSquareW, gridSquareH) * 0.35,
    );

    for (let xi = 0; xi < GRID_COLS; xi++) {
      for (let yi = 0; yi < GRID_ROWS; yi++) {
        let freqA = 1 + Math.floor(Math.random() * 9);
        let freqB = 1 + Math.floor(Math.random() * 9);
        while (freqA === freqB) {
          freqA = 1 + Math.floor(Math.random() * 9);
        }
        const g = gcd(freqA, freqB);
        const theta = (2 * Math.PI) / g;
        let angle = 0;
        const originX = gridSquareW / 2 + gridSquareW * xi;
        const originY = gridSquareH / 2 + gridSquareH * yi;

        const ampAdder = (INCREMENT / theta) * ampMax;
        const phase = theta / NUM_PARTICLES;

        // Each cell spawns a stack of concentric Lissajous rings from
        // amp = 0 outward to ampMax. They shrink in `update()` and
        // respawn when amp drops below 0 — producing the pulsing
        // jellyfish silhouette.
        for (let i = 0; i < ampMax; i += 2) {
          const amp = i;
          // Per-ring angle offset (matches original — gives each ring
          // its own phase along the Lissajous figure).
          angle += INCREMENT * ((i / ampMax) * theta);

          let cPct: number;
          if (i < ampMax / 2) {
            cPct = i / (ampMax / 2);
          } else {
            cPct = (i - ampMax / 2) / (ampMax / 2);
          }

          lissas.push({
            originX,
            originY,
            amp,
            ampMax,
            ampAdder,
            freqA,
            freqB,
            theta,
            angle,
            angleAdder: INCREMENT,
            phase,
            radius: RADIUS,
            k1: [255, 0, 255], // magenta
            k2: [0, 0, 255], // blue
            kPct: cPct,
            pctAdder: INCREMENT * 2,
          });
        }
      }
    }
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = dims();
    p.createCanvas(cw, ch);
    p.frameRate(24);
    buildLissas();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    buildLissas();
  };

  p.draw = () => {
    p.background(0, 0, 0);
    p.noStroke();

    for (const lissa of lissas) {
      // Update — matches the original's quirks: angle advances ONCE
      // unconditionally, then a SECOND time if it's still within
      // theta. Doubles the per-frame angular speed for most of the
      // period before snapping back to 0.
      lissa.angle += lissa.angleAdder;
      if (lissa.angle <= lissa.theta) {
        lissa.angle += lissa.angleAdder;
      } else {
        lissa.angle = 0;
      }

      // Color blend percent ping-pongs 0 → 1 → 0 → 1 …
      lissa.kPct += lissa.pctAdder;
      if (lissa.kPct > 1 || lissa.kPct < 0) {
        lissa.pctAdder *= -1;
      }

      // Ring radius shrinks; respawn at ampMax when it goes below 0.
      lissa.amp -= lissa.ampAdder;
      if (lissa.amp <= 0) {
        lissa.amp = lissa.ampMax;
      }

      // Lerp k1 → k2 by kPct.
      const t = Math.max(0, Math.min(1, lissa.kPct));
      const r = lissa.k1[0] + (lissa.k2[0] - lissa.k1[0]) * t;
      const g2 = lissa.k1[1] + (lissa.k2[1] - lissa.k1[1]) * t;
      const b = lissa.k1[2] + (lissa.k2[2] - lissa.k1[2]) * t;

      // Sine-modulated alpha — original used global angle/theta which
      // was a bug (read whatever the last init Lissa stored); using
      // each lissa's own here for a cleaner per-ring rhythm.
      let alpha = 80 + 275 * Math.sin(lissa.angle / lissa.theta);
      if (alpha < 0) alpha = 0;
      if (alpha > 255) alpha = 255;

      // Draw NUM_PARTICLES dots along the curve, then a mirrored copy
      // with freqA/freqB swapped (the original's distinctive
      // double-pattern that gives the jellyfish their character).
      for (let np = 0; np < NUM_PARTICLES; np++) {
        const ang = lissa.angle + lissa.phase * np;
        const sA = Math.sin(lissa.freqA * ang);
        const sB = Math.sin(lissa.freqB * ang);
        const x1 = lissa.originX + lissa.amp * sA;
        const y1 = lissa.originY + lissa.amp * sB;
        p.fill(r, g2, b, alpha);
        p.circle(x1, y1, lissa.radius);
        const x2 = lissa.originX + lissa.amp * sB;
        const y2 = lissa.originY + lissa.amp * sA;
        p.fill(r, g2, b, alpha);
        p.circle(x2, y2, lissa.radius);
      }
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function JellyfishGridCanvas({
  isActive = true,
}: CanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p5Ref = useRef<any>(null);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    let cancelled = false;
    let io: IntersectionObserver | null = null;
    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new P5(sketch as any, containerRef.current) as any;
      p5Ref.current = instance;
      // Start paused — IntersectionObserver flips it on when the slide
      // scrolls into view (matches RadialsCanvas / EternalReturn).
      instance.noLoop?.();
      if (containerRef.current) {
        io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) instance?.loop?.();
              else instance?.noLoop?.();
            }
          },
          { threshold: 0.05 },
        );
        io.observe(containerRef.current);
      }
    })();
    return () => {
      cancelled = true;
      io?.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Ref.current as any)?.remove?.();
    };
  }, []);

  useEffect(() => {
    const p5 = p5Ref.current;
    if (!p5) return;
    if (isActive) {
      p5.loop?.();
    } else {
      const timer = setTimeout(() => p5?.noLoop?.(), 550);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100dvh",
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}
