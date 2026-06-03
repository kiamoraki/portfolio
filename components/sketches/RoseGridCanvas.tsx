"use client";

import { useEffect, useRef } from "react";

const GRID = 9;
const ANGLE_ADDER = 0.1;
const PCT_INCREMENT = 0.01;
const AMP_RATIO = 15 / 90; // amp / cellSize from original 810x810 / 9

// Rose curve shape depends on the *reduced* petal ratio p/q (e.g., 2:4
// and 1:2 trace the same curve). Build the deduplicated list of pairs
// from the full 9×9 source — gives 55 unique shapes — so the grid
// shows each rose exactly once with no visual repeats.
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
const UNIQUE_ROSE_PAIRS: Array<[number, number]> = (() => {
  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  for (let x = 1; x <= GRID; x++) {
    for (let y = 1; y <= GRID; y++) {
      const g = gcdRose(x, y);
      const key = `${x / g},${y / g}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push([x / g, y / g]);
    }
  }
  return out;
})();

// Pick the grid (cols, rows) that holds at least `count` cells AND has
// cells as close to square as possible for the given viewport aspect.
// Lightly penalises unused cells so we prefer factorisations that fill
// exactly (e.g. 5×11 = 55 for the rose set on portrait viewports).
function pickRoseGridShape(
  count: number,
  w: number,
  h: number,
): [number, number] {
  let bestCols = 1;
  let bestRows = count;
  let bestScore = Infinity;
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    if (cols * rows < count) continue;
    const cellW = w / cols;
    const cellH = h / rows;
    const aspectDiff = Math.abs(cellW / cellH - 1);
    const unused = cols * rows - count;
    const score = aspectDiff + unused * 0.05;
    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }
  return [bestCols, bestRows];
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

    constructor(
      ox: number,
      oy: number,
      px: number,
      py: number,
      initR: number,
      initG: number,
      initB: number,
      amp: number
    ) {
      this.origin = { x: ox, y: oy };
      this.petal = { x: px, y: py };
      this.color = { r: initR, g: initG, b: initB };
      this.pct = initG / 255;
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

      // Interpolate between pink (255, 0, 255) and cyan (0, 255, 255)
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

  const layoutRoses = () => {
    // Lay out only the 55 visually-unique rose shapes (no repeats), in
    // a grid sized so cells are as close to square as possible for the
    // current viewport aspect — fills the canvas evenly.
    const [cols, rows] = pickRoseGridShape(
      UNIQUE_ROSE_PAIRS.length,
      p.width,
      p.height,
    );
    const cellW = p.width / cols;
    const cellH = p.height / rows;
    const amp = Math.min(cellW, cellH) * AMP_RATIO;

    roses.length = 0;
    for (let i = 0; i < UNIQUE_ROSE_PAIRS.length; i++) {
      const [px, py] = UNIQUE_ROSE_PAIRS[i];
      const gx = i % cols;
      const gy = Math.floor(i / cols);
      const cx = cellW / 2 + cellW * gx;
      const cy = cellH / 2 + cellH * gy;
      // Color gradient keyed to grid position — preserves the original
      // sketch's pink → cyan sweep across the grid.
      const sum = gx + gy;
      const r = 255 - 15 * sum;
      const g = 0 + 15 * sum;
      const b = 255;
      roses.push(new Rose(cx, cy, px, py, r, g, b, amp));
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
  };
};

export function RoseGridCanvas() {
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
          .rose-grid-fullbleed {
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            margin-bottom: 0;
            height: auto;
            aspect-ratio: 1;
          }
        }
      `}</style>
      <div ref={containerRef} className="rose-grid-fullbleed" />
    </>
  );
}
