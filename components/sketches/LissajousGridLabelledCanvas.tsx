"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

// Duplicate of LissajousGridCanvas with axis labels added along the
// top + left edges (freqA across the top, freqB down the left). Used as
// the first slide in the animations meta carousel while we iterate on
// labelled grid layouts.
// 10×10 grid running from FREQ_MIN..FREQ_MIN+GRID_COUNT-1 on both axes
// (so values run 1..10 in both directions).
const GRID_COUNT = 10;
const FREQ_MIN = 1;
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
// Repeat-colors: cells whose reduced (a/gcd, b/gcd) ratio was already
// drawn at a lower-index cell get rendered with these instead, so the
// duplicates pop visually.
const REPEAT_GREEN = { r: 50, g: 200, b: 80 };
const REPEAT_RED = { r: 230, g: 60, b: 50 };

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
  // True when this cell's reduced ratio matched an earlier (lower-index)
  // cell — rendered in the repeat-colour palette instead of blue/pink.
  isRepeat: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let curves: Curve[] = [];
  let cellSizePx = 0;
  let gridOffsetX = 0;
  let gridOffsetY = 0;

  const buildCurves = () => {
    // Same 80%/95% footprint as LissajousGridCanvas, but the grid now
    // shares that footprint with a one-cell label gutter on the top +
    // left edges (GRID_COUNT + 1 cells along the longer axis).
    const sideRatio =
      typeof window !== "undefined" && window.innerWidth <= 720 ? 0.95 : 0.8;
    const side = Math.min(p.width, p.height) * sideRatio;
    const gridSize = side / (GRID_COUNT + 1);
    const labelGutter = gridSize;
    const totalW = gridSize * GRID_COUNT + labelGutter;
    const totalH = gridSize * GRID_COUNT + labelGutter;
    const offsetX = (p.width - totalW) / 2 + labelGutter;
    const offsetY = (p.height - totalH) / 2 + labelGutter;
    const amp = gridSize * 0.125;
    const radius = Math.max(1, gridSize * 0.06);

    cellSizePx = gridSize;
    gridOffsetX = offsetX;
    gridOffsetY = offsetY;

    curves = [];
    // Track reduced ratios so any cell whose (freqA/gcd, freqB/gcd) was
    // already drawn at an earlier-iterated cell is flagged as a repeat.
    // We iterate column-major (gx outer, gy inner) — same as the
    // original LissajousGridCanvas — so the first cell encountered for
    // each reduced ratio is the "canonical" one and gets blue/pink.
    const seenReduced = new Set<string>();
    for (let gx = 0; gx < GRID_COUNT; gx++) {
      for (let gy = 0; gy < GRID_COUNT; gy++) {
        const freqA = gx + FREQ_MIN;
        const freqB = gy + FREQ_MIN;
        const gcd = calculateGCD(freqA, freqB);
        const theta = (2 * Math.PI) / gcd;
        const numDots = 20;
        const reducedKey = `${freqA / gcd},${freqB / gcd}`;
        const isRepeat = seenReduced.has(reducedKey);
        seenReduced.add(reducedKey);
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
          isRepeat,
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
    p.background(19, 12, 18);
    p.noStroke();

    for (const c of curves) {
      if (c.angle <= c.theta) c.angle += c.angleAdder;
      else c.angle = 0;

      const d = c.radius * 2;
      const colA = c.isRepeat ? REPEAT_GREEN : PROJECT_BLUE;
      const colB = c.isRepeat ? REPEAT_RED : PROJECT_PINK;
      for (let k = 0; k < c.numDots; k++) {
        const arg = c.angle + c.dotAdder * k;
        const sa = Math.sin(c.freqA * arg) * c.amp;
        const sb = Math.sin(c.freqB * arg) * c.amp;

        p.fill(colA.r, colA.g, colA.b);
        p.circle(c.originX + sa, c.originY + sb, d);

        p.fill(colB.r, colB.g, colB.b);
        p.circle(c.originX - sa, c.originY - sb, d);
      }
    }

    // Perimeter axis labels: freqA across the top edge, freqB down the
    // left edge. Values run FREQ_MIN..FREQ_MIN+GRID_COUNT-1 (i.e. 3..17).
    if (cellSizePx > 0) {
      const fontSize = cellSizePx * 0.4;
      p.fill(220, 220, 230, 220);
      p.textFont("monospace");
      p.textSize(fontSize);
      p.textAlign(p.CENTER, p.CENTER);
      // Top edge: freqA above each column.
      const topY = gridOffsetY - cellSizePx / 2;
      for (let i = 0; i < GRID_COUNT; i++) {
        const x = gridOffsetX + cellSizePx / 2 + cellSizePx * i;
        p.text(`${FREQ_MIN + i}`, x, topY);
      }
      // Left edge: freqB beside each row.
      const leftX = gridOffsetX - cellSizePx / 2;
      for (let j = 0; j < GRID_COUNT; j++) {
        const y = gridOffsetY + cellSizePx / 2 + cellSizePx * j;
        p.text(`${FREQ_MIN + j}`, leftX, y);
      }
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousGridLabelledCanvas({
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
        width: "100%",
        height: inFlow ? "100%" : "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
