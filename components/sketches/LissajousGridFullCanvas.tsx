"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

// Full-viewport variant of LissajousGridCanvas. The original grid is
// constrained to a centered square so it can sit inside a carousel
// slot; this variant extends the same per-cell logic across the entire
// viewport, so on a portrait phone you get the full 15 cells across
// the width and ~30 cells down the height. freqA / freqB keep their
// original `grid-index + 3` formula, so cells beyond the original
// 15×15 footprint render naturally-higher-frequency Lissajous figures.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
// Cell density — slightly looser than the original 15 per shortest
// axis so each cell (and the per-cell animation inside it) reads a
// bit bigger. amp scales with cellSize so the curve cluster grows
// proportionally.
const CELLS_ACROSS_SHORT_AXIS = 13;
// Original used freqA = gx + 3 (range 3..17). Same offset here.
const FREQ_OFFSET = 3;

function calculateGCD(a: number, b: number): number {
  let x = Math.abs(a) || 1;
  let y = Math.abs(b) || 1;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

type Curve = {
  originX: number;
  originY: number;
  amp: number;
  freqA: number;
  freqB: number;
  angle: number;
  angleAdder: number;
  theta: number;
  numDots: number;
  dotAdder: number;
  radius: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let curves: Curve[] = [];

  const buildCurves = () => {
    // cellSize keyed to the shorter axis (same density as the original
    // 15×15 grid), then tiled across the full canvas in both dims.
    const cellSize =
      Math.min(p.width, p.height) / CELLS_ACROSS_SHORT_AXIS;
    const cols = Math.max(1, Math.round(p.width / cellSize));
    const rows = Math.max(1, Math.round(p.height / cellSize));
    const totalW = cellSize * cols;
    const totalH = cellSize * rows;
    // Centre any small remainder so the grid sits flush — usually
    // sub-pixel, but worth it on viewports where width/height doesn't
    // divide evenly by cellSize.
    const offsetX = (p.width - totalW) / 2;
    const offsetY = (p.height - totalH) / 2;
    const amp = cellSize * 0.125;
    const radius = Math.max(1, cellSize * 0.06);

    curves = [];
    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const freqA = gx + FREQ_OFFSET;
        const freqB = gy + FREQ_OFFSET;
        const gcd = calculateGCD(freqA, freqB);
        const theta = (2 * Math.PI) / gcd;
        const numDots = 20;
        curves.push({
          originX: offsetX + cellSize / 2 + cellSize * gx,
          originY: offsetY + cellSize / 2 + cellSize * gy,
          amp,
          freqA,
          freqB,
          angle: 0,
          angleAdder: 0.02,
          theta,
          numDots,
          dotAdder: theta / numDots,
          radius,
        });
      }
    }
  };

  const dims = (): [number, number] => {
    // Canvas is sized to the live viewport so the grid fills the full
    // screen even when rendered inside a carousel slide (skip parent
    // measurement, which would otherwise constrain it).
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [800, 800];
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = dims();
    p.createCanvas(cw, ch);
    p.frameRate(29);
    buildCurves();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    buildCurves();
  };

  p.draw = () => {
    p.background(19, 12, 18);
    p.noStroke();

    for (const c of curves) {
      if (c.angle <= c.theta) c.angle += c.angleAdder;
      else c.angle = 0;

      const d = c.radius * 2;
      for (let k = 0; k < c.numDots; k++) {
        const arg = c.angle + c.dotAdder * k;
        const sa = Math.sin(c.freqA * arg) * c.amp;
        const sb = Math.sin(c.freqB * arg) * c.amp;

        p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
        p.circle(c.originX + sa, c.originY + sb, d);

        p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
        p.circle(c.originX - sa, c.originY - sb, d);
      }
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousGridFullCanvas({
  isActive = true,
}: CanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p5Ref = useRef<any>(null);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new P5(sketch as any, containerRef.current) as any;
      p5Ref.current = instance;
      if (!isActiveRef.current) instance.noLoop?.();
    })();
    return () => {
      cancelled = true;
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
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
