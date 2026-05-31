"use client";

import { useEffect, useRef } from "react";

// Same colors as LissajousGridCanvas / LissajousFullCanvas so the slide
// reads as part of the same project.
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

// Frequencies are picked randomly per-cell from [1..9], EXCEPT for any
// pair listed in CURATED_PAIRS — those fill cells from the top-left in
// row-major order so the picks we like are always pinned and easy to
// spot while we evaluate more pairs in the remaining (random) cells.
const FREQ_MIN = 1;
const FREQ_MAX = 9;

const CURATED_PAIRS: Array<[number, number]> = [
  [4, 5],
  [5, 4],
  [4, 8],
  [8, 9],
  [3, 4],
  [9, 1],
  [1, 9],
  [8, 1],
  [5, 1],
  [9, 8],
  [3, 10],
  [10, 3],
  [3, 7],
  [7, 3],
];

const pickFreq = () =>
  FREQ_MIN + Math.floor(Math.random() * (FREQ_MAX - FREQ_MIN + 1));

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
    // Target cell size is ~3× the previous 10×10 layout (which had
    // cellSize ≈ viewport_min × 0.95 / 11 ≈ 0.086 × viewport_min on
    // mobile). 3× ≈ 0.26 × viewport_min.
    const viewportMin =
      typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height);
    // Target cell size, capped so the grid is always at least 3 cells
    // wide regardless of viewport — narrower viewports just get smaller
    // cells rather than a 1×N or 2×N strip.
    const MIN_COLS = 3;
    const desiredTarget = viewportMin * 0.5;
    const targetCell = Math.min(desiredTarget, p.width / MIN_COLS);
    const cols = Math.max(MIN_COLS, Math.round(p.width / targetCell));

    // For square cells with EQUAL gaps on all four sides we need:
    //   (p.width  - cellSize · cols) / 2 = (p.height - cellSize · rows) / 2
    // → cellSize = (p.width - p.height) / (cols - rows)
    // Try a few row counts (the natural one first, then bumped up so we
    // can add another row if it tightens the layout) and pick the
    // first that fits within both dimensions. If nothing works, fall
    // back to the original axis-min cellSize with unequal gaps.
    const naturalRows = Math.max(1, Math.round(p.height / targetCell));
    let cellSize = 0;
    let rows = naturalRows;
    for (const rTry of [naturalRows, naturalRows + 1, naturalRows + 2]) {
      if (rTry === cols) continue; // formula would divide by zero
      const cs = (p.width - p.height) / (cols - rTry);
      if (cs <= 0) continue;
      // Tiny epsilon so floating-point sub-pixel overshoots don't reject
      // an otherwise-valid solution.
      if (cs * cols > p.width + 0.5) continue;
      if (cs * rTry > p.height + 0.5) continue;
      cellSize = cs;
      rows = rTry;
      break;
    }
    if (cellSize === 0) {
      cellSize = Math.min(p.width / cols, p.height / rows);
    }
    const totalW = cellSize * cols;
    const totalH = cellSize * rows;
    const offsetX = (p.width - totalW) / 2;
    const offsetY = (p.height - totalH) / 2;
    // amp = cellSize × 0.12 — curve diameter ≈ 24% of the cell.
    const amp = cellSize * 0.12;
    // 0.05× cellSize.
    const radius = Math.max(1.5, cellSize * 0.05);

    curves = [];
    // Dedup by *reduced* form: 10:4, 5:2, and 15:6 all reduce to 5:2 and
    // produce visually-equivalent curves, so we treat them as the same
    // pair when checking for repeats. Random cells output the reduced
    // form ("default to the lower number"); curated pairs stay as the
    // user typed them but contribute their reduced form to the used set.
    const reducedKey = (a: number, b: number) => {
      const g = calculateGCD(a, b);
      return `${a / g},${b / g}`;
    };
    const used = new Set<string>(
      CURATED_PAIRS.map(([a, b]) => reducedKey(a, b)),
    );
    // All (a, a) pairs render as the same straight diagonal line (since
    // sin(a·t) = sin(a·t)), so only ever show one same-frequency cell
    // across the whole grid.
    let samePairPlaced = CURATED_PAIRS.some(([a, b]) => a === b);
    const pickUnique = (): [number, number] => {
      // 81 total possible pairs in [1..9]² — ample headroom even for
      // dense grids, so 200 attempts is plenty before giving up.
      for (let attempt = 0; attempt < 200; attempt++) {
        const a = pickFreq();
        const b = pickFreq();
        if (a === b && samePairPlaced) continue;
        const key = reducedKey(a, b);
        if (used.has(key)) continue;
        used.add(key);
        if (a === b) samePairPlaced = true;
        // Return the reduced form — the "lower number" canonical pair —
        // so duplicates under reduction are visually impossible.
        const g = calculateGCD(a, b);
        return [a / g, b / g];
      }
      // Fallback (should never hit) — return a fresh pick even if it
      // duplicates, just to keep the grid filled.
      return [pickFreq(), pickFreq()];
    };

    // Scatter the curated pairs across random cells in the grid instead
    // of pinning them to the top-left in row-major order. Build a
    // shuffled list of every cell index, then drop the curated pairs
    // into the first N positions of that shuffle.
    const totalCells = cols * rows;
    const cellOrder = Array.from({ length: totalCells }, (_, i) => i);
    for (let i = cellOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellOrder[i], cellOrder[j]] = [cellOrder[j], cellOrder[i]];
    }
    const curatedAt = new Map<number, [number, number]>();
    for (
      let i = 0;
      i < CURATED_PAIRS.length && i < totalCells;
      i++
    ) {
      curatedAt.set(cellOrder[i], CURATED_PAIRS[i]);
    }

    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const idx = gy * cols + gx;
        const curated = curatedAt.get(idx);
        const [freqA, freqB] = curated ? curated : pickUnique();
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
    // Canvas is sized to the viewport — ignores the parent wrapper so the
    // grid fills the full screen even when rendered inside a carousel
    // slide that would otherwise constrain it to a square.
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

    // (Per-cell frequency debug labels removed.)
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousUniqueGridCanvas({
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
        width: "100vw",
        height: "100vh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
