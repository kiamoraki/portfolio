"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const GRID = 9;
const ANGLE_ADDER = 0.1;
const PCT_INCREMENT = 0.01;
const AMP_RATIO = 15 / 90; // amp / cellSize from original 810x810 / 9

// Rose curve shape depends on the *reduced* petal ratio n/d: 2/4 and
// 1/2 trace the same curve. The grid deliberately shows the FULL 9x9
// matrix rather than deduplicating, so a cell's position encodes its
// (n, d) directly and the axes are meaningful. Reducible pairs are
// still identified, and drawn white, so the repeats read as repeats.
function gcdRose(a: number, b: number): number {
  let x = Math.abs(a) || 1;
  let y = Math.abs(b) || 1;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  class Rose {
    origin: { x: number; y: number };
    petal: { x: number; y: number };
    angle = 0;
    pct: number;
    increment = PCT_INCREMENT;
    color: { r: number; g: number; b: number };
    theta: number;
    amp: number;
    // Reducible (n, d) pairs repeat a curve drawn elsewhere in the
    // matrix. They run the same pink-cyan sweep as everything else but
    // enter it half a cycle out of phase, so at any instant they sit on
    // the opposite side of the gradient from their coprime neighbours
    // and the repeats read as a distinct family.
    isDuplicate: boolean;

    constructor(
      ox: number,
      oy: number,
      px: number,
      py: number,
      initR: number,
      initG: number,
      initB: number,
      amp: number,
      isDuplicate = false
    ) {
      this.origin = { x: ox, y: oy };
      this.petal = { x: px, y: py };
      this.color = { r: initR, g: initG, b: initB };
      this.isDuplicate = isDuplicate;
      // `pct` is the position in the pink-cyan cycle. Seeding it from
      // the cell's gradient value keeps the sweep travelling across the
      // grid; duplicates are pushed half a cycle on so they read as
      // counter-phase to the coprime cells around them.
      this.pct = ((initG / 255) + (isDuplicate ? 0.5 : 0)) % 1;
      this.theta = this.petal.x / this.petal.y !== 1 ? 2 * this.petal.y * 180 : 360;
      this.amp = amp;
    }

    update() {
      if (this.angle <= 360) this.angle += ANGLE_ADDER;
      else this.angle = 0;

      this.pct += this.increment;
      if (this.pct > 1) {
        this.pct = 1;
        this.increment *= -1;
      }
      if (this.pct < 0) {
        this.pct = 0;
        this.increment *= -1;
      }

      // Interpolate between pink (255, 0, 255) and cyan (0, 255, 255).
      // Every rose sweeps, duplicates included: what sets them apart is
      // WHERE in the cycle they start (see the constructor), not
      // whether they animate.
      this.color.r = (1 - this.pct) * 255 + this.pct * 0;
      this.color.g = (1 - this.pct) * 0 + this.pct * 255;
      this.color.b = 255;
    }

    draw() {
      p.noStroke();
      p.fill(this.color.r, this.color.g, this.color.b);
      const ratio = this.petal.x / this.petal.y;
      const a = this.amp;
      const isMobile =
        typeof window !== "undefined" && window.innerWidth <= 720;
      // Smaller step = more sampled points along the curve. Bumped
      // mobile from 20 → 8 so the cells render with substantially
      // more particles and read as a continuous ring rather than
      // scattered specks.
      const step = isMobile ? 8 : 10;
      const dotSize = isMobile ? 1.0 : 1.6;
      for (let i = 0; i < this.theta; i += step) {
        const radian = (Math.PI / 180) * (this.angle + i);
        const polar = a + a * Math.cos(ratio * radian);
        const x = this.origin.x + polar * Math.cos(radian);
        const y = this.origin.y + polar * Math.sin(radian);
        p.circle(x, y, dotSize);
      }
    }
  }

  const roses: Rose[] = [];
  // Axis ticks, rebuilt by `layoutRoses` so they track any resize.
  // Per-cell n/d labels were replaced by these: with the full matrix
  // restored, position already encodes (n, d), so labelling all 81
  // cells would repeat what the axes say.
  type Tick = { x: number; y: number; text: string };
  let axisN: Tick[] = [];
  let axisD: Tick[] = [];
  let corner: Tick | null = null;
  let labelSize = 10;

  const layoutRoses = () => {
    // Fixed GRID x GRID matrix: column = n, row = d. Gutters on the top
    // and left hold the axis labels, so the cells start inset.
    const axis = Math.max(
      14,
      Math.min(26, Math.min(p.width, p.height) * 0.035),
    );
    labelSize = Math.max(8, Math.min(13, axis * 0.55));
    // The left gutter holds "d=9" (three glyphs) rather than a bare
    // digit, so it needs more room than the top one, which only has to
    // clear the text's height.
    const gridX = axis * 2.1;
    const gridY = axis;
    const cellW = (p.width - gridX) / GRID;
    const cellH = (p.height - gridY) / GRID;
    const amp = Math.min(cellW, cellH) * AMP_RATIO;

    roses.length = 0;
    axisN = [];
    axisD = [];

    for (let gx = 0; gx < GRID; gx++) {
      for (let gy = 0; gy < GRID; gy++) {
        const n = gx + 1;
        const d = gy + 1;
        const cx = gridX + cellW / 2 + cellW * gx;
        const cy = gridY + cellH / 2 + cellH * gy;
        // A reducible pair draws the same curve as its reduced form
        // elsewhere in the matrix. It takes the same positional gradient
        // as everything else; the flag only shifts its phase.
        const isDuplicate = gcdRose(n, d) > 1;
        const sum = gx + gy;
        const r = 255 - 15 * sum;
        const g = 0 + 15 * sum;
        const b = 255;
        roses.push(new Rose(cx, cy, n, d, r, g, b, amp, isDuplicate));
      }
    }

    // Corner key in the gutter intersection, naming the relationship
    // the two axes describe.
    corner = {
      x: gridX * 0.5,
      y: gridY * 0.5,
      text: "k=n/d",
    };

    // Axis ticks: n across the top, d down the left edge.
    for (let gx = 0; gx < GRID; gx++) {
      axisN.push({
        x: gridX + cellW / 2 + cellW * gx,
        y: gridY - labelSize * 0.4,
        text: `n=${gx + 1}`,
      });
    }
    for (let gy = 0; gy < GRID; gy++) {
      axisD.push({
        x: gridX * 0.5,
        y: gridY + cellH / 2 + cellH * gy,
        text: `d=${gy + 1}`,
      });
    }
  };

  const dims = (): [number, number] => {
    const parent = (p.canvas && p.canvas.parentElement) as HTMLElement | null;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      return [parent.clientWidth, parent.clientHeight];
    }
    return [window.innerWidth, window.innerHeight];
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = dims();
    const c = p.createCanvas(cw, ch);
    c.style("display", "block");
    p.frameRate(29);
    layoutRoses();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    layoutRoses();
  };

  p.draw = () => {
    const ctx = p.drawingContext;
    const cnv = p.canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000d19";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.restore();

    for (const r of roses) {
      r.update();
      r.draw();
    }

    // Axis ticks: n across the top, d down the left. Drawn last so no
    // curve paints over them, and dimmed so they read as annotation.
    p.push();
    p.noStroke();
    p.fill(255, 255, 255, 140);
    p.textSize(labelSize);
    p.textAlign(p.CENTER, p.BASELINE);
    for (const t of axisN) p.text(t.text, t.x, t.y);
    p.textAlign(p.CENTER, p.CENTER);
    for (const t of axisD) p.text(t.text, t.x, t.y);
    if (corner) {
      // Slightly brighter than the ticks: it's a key, not a value.
      p.fill(255, 255, 255, 190);
      p.text(corner.text, corner.x, corner.y);
    }
    p.pop();
  };
};

export function RoseGridCanvas() {
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
    <>
      <style>{`
        .rose-grid-fullbleed {
          width: 100vw;
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          margin-bottom: calc(-1 * var(--spacing-page));
          height: 100dvh;
          background: #000d19;
          overflow: hidden;
        }
        .rose-grid-fullbleed canvas {
          touch-action: auto !important;
          pointer-events: none;
        }
        @media (max-width: 720px) {
          /* Mobile: fill the full viewport (carousel slide + standalone
             project page both share this arrangement). Was a square
             (aspect-ratio: 1) which left empty space below the grid;
             the user prefers the grid to occupy the whole screen and
             let subsequent pieces scroll below on the standalone
             page. */
            .rose-grid-fullbleed {
              width: 100%;
              margin-left: 0;
              margin-right: 0;
              margin-bottom: 0;
              height: 100dvh;
              aspect-ratio: auto;
            }
        }
      `}</style>
      <div ref={containerRef} className="rose-grid-fullbleed" />
    </>
  );
}
