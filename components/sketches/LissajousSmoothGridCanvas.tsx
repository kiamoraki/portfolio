"use client";

import { useEffect, useRef } from "react";

// Smooth-curve companion to LissajousGridLabelledCanvas. Same 10×10
// grid (freqA × freqB ∈ [1..10]²) and same axis labels along the top
// and left edges, but each cell renders the Lissajous figure as a
// 200-vertex closed curve instead of 20 sampled dots. With aliasing
// gone, every pair shows its true continuous shape — the cousin pairs
// that look identical in the aliased grid are now obviously distinct.
const GRID_COUNT = 10;
const FREQ_MIN = 1;
const NUM_VERTS = 200;
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
// Repeat colours: cells whose reduced (a/gcd, b/gcd) ratio was already
// drawn at a lower-index cell get rendered with these instead, matching
// LissajousGridLabelledCanvas.
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
  // Angle range covered by NUM_VERTS vertices — = 2π / gcd, which is
  // one full closed period of the Lissajous curve.
  theta: number;
  isRepeat: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let curves: Curve[] = [];
  let cellSizePx = 0;
  let gridOffsetX = 0;
  let gridOffsetY = 0;
  let globalAngle = 0;

  const buildCurves = () => {
    const sideRatio =
      typeof window !== "undefined" && window.innerWidth <= 720 ? 0.95 : 0.8;
    const side = Math.min(p.width, p.height) * sideRatio;
    const gridSize = side / (GRID_COUNT + 1);
    const labelGutter = gridSize;
    const totalW = gridSize * GRID_COUNT + labelGutter;
    const totalH = gridSize * GRID_COUNT + labelGutter;
    const offsetX = (p.width - totalW) / 2 + labelGutter;
    const offsetY = (p.height - totalH) / 2 + labelGutter;
    const amp = gridSize * 0.4; // curve nearly fills its cell

    cellSizePx = gridSize;
    gridOffsetX = offsetX;
    gridOffsetY = offsetY;

    curves = [];
    const seenReduced = new Set<string>();
    for (let gx = 0; gx < GRID_COUNT; gx++) {
      for (let gy = 0; gy < GRID_COUNT; gy++) {
        const freqA = gx + FREQ_MIN;
        const freqB = gy + FREQ_MIN;
        const gcd = calculateGCD(freqA, freqB);
        const theta = (2 * Math.PI) / gcd;
        const reducedKey = `${freqA / gcd},${freqB / gcd}`;
        const isRepeat = seenReduced.has(reducedKey);
        seenReduced.add(reducedKey);
        curves.push({
          originX: offsetX + gridSize / 2 + gridSize * gx,
          originY: offsetY + gridSize / 2 + gridSize * gy,
          amp,
          freqA,
          freqB,
          theta,
          isRepeat,
        });
      }
    }
  };

  const dims = (): [number, number] => {
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
    p.frameRate(30);
    buildCurves();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    buildCurves();
  };

  p.draw = () => {
    p.background(19, 12, 18);

    // Slow global rotation — the curve shape is closed and static
    // without it, so this gives a sense of motion across the grid.
    globalAngle += 0.006;
    if (globalAngle > Math.PI * 200) globalAngle -= Math.PI * 200;

    p.noFill();
    p.strokeWeight(1.3);
    for (const c of curves) {
      const colMain = c.isRepeat ? REPEAT_GREEN : PROJECT_BLUE;
      const colMirror = c.isRepeat ? REPEAT_RED : PROJECT_PINK;

      // Main closed curve.
      p.stroke(colMain.r, colMain.g, colMain.b);
      p.beginShape();
      for (let i = 0; i < NUM_VERTS; i++) {
        const arg = globalAngle + (i / NUM_VERTS) * c.theta;
        const sa = Math.sin(c.freqA * arg) * c.amp;
        const sb = Math.sin(c.freqB * arg) * c.amp;
        p.vertex(c.originX + sa, c.originY + sb);
      }
      p.endShape(p.CLOSE);

      // Origin-mirrored curve (matches the blue+pink mirror pairing of
      // the other Lissajous sketches).
      p.stroke(colMirror.r, colMirror.g, colMirror.b);
      p.beginShape();
      for (let i = 0; i < NUM_VERTS; i++) {
        const arg = globalAngle + (i / NUM_VERTS) * c.theta;
        const sa = Math.sin(c.freqA * arg) * c.amp;
        const sb = Math.sin(c.freqB * arg) * c.amp;
        p.vertex(c.originX - sa, c.originY - sb);
      }
      p.endShape(p.CLOSE);
    }
    p.noStroke();

    // Axis labels — freqA across the top edge, freqB down the left.
    if (cellSizePx > 0) {
      p.fill(220, 220, 230, 220);
      p.textFont("monospace");
      p.textSize(cellSizePx * 0.4);
      p.textAlign(p.CENTER, p.CENTER);
      const topY = gridOffsetY - cellSizePx / 2;
      for (let i = 0; i < GRID_COUNT; i++) {
        const x = gridOffsetX + cellSizePx / 2 + cellSizePx * i;
        p.text(`${FREQ_MIN + i}`, x, topY);
      }
      const leftX = gridOffsetX - cellSizePx / 2;
      for (let j = 0; j < GRID_COUNT; j++) {
        const y = gridOffsetY + cellSizePx / 2 + cellSizePx * j;
        p.text(`${FREQ_MIN + j}`, leftX, y);
      }
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousSmoothGridCanvas({
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
        height: inFlow ? "100%" : "100vh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
