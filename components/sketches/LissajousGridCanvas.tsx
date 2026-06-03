"use client";

import { useEffect, useRef } from "react";

const GRID_COUNT = 15;
// Match the colors used by LissajousFullCanvas so both slides feel like
// the same project.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };

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
    // Constrain the grid to the same 80%-of-min-dimension footprint that
    // LissajousFullCanvas and LissajousPortraitsCanvas use (amp = 0.4 of
    // min, so curves span 0.8 of min), so all three slides read at the
    // same visual height.
    const sideRatio =
      typeof window !== "undefined" && window.innerWidth <= 720 ? 0.95 : 0.8;
    const side = Math.min(p.width, p.height) * sideRatio;
    const gridSize = side / GRID_COUNT;
    const offsetX = (p.width - side) / 2;
    const offsetY = (p.height - side) / 2;
    // Match the original sketch's proportions (amp ≈ 12.5% of gridSize,
    // dot radius ≈ 9.4%) so each cell holds a tight cluster of overlapping
    // dots with clear black padding between cells.
    const amp = gridSize * 0.125;
    const radius = Math.max(1, gridSize * 0.06);

    curves = [];
    for (let gx = 0; gx < GRID_COUNT; gx++) {
      for (let gy = 0; gy < GRID_COUNT; gy++) {
        const freqA = gx + 3;
        const freqB = gy + 3;
        const gcd = calculateGCD(freqA, freqB);
        const theta = (2 * Math.PI) / gcd;
        const numDots = 20;
        curves.push({
          originX: offsetX + gridSize / 2 + gridSize * gx,
          originY: offsetY + gridSize / 2 + gridSize * gy,
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
    // Read parent before createCanvas runs (p._userNode set by p5 ctor).
    const node =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((p as any)._userNode ||
        (p.canvas && p.canvas.parentElement)) as HTMLElement | null;
    if (node && node.clientWidth > 0 && node.clientHeight > 0) {
      return [node.clientWidth, node.clientHeight];
    }
    return [window.innerWidth, window.innerHeight];
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
    p.background(19, 12, 18); // matches LissajousFullCanvas bg
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

export function LissajousGridCanvas({
  isActive = true,
  inFlow = false,
}: CanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p5Ref = useRef<any>(null);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
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
        width: "100%",
        height: inFlow ? "100%" : "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
