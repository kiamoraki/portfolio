"use client";

import { useEffect, useRef } from "react";

const WAVE_PURPLE = { r: 181, g: 136, b: 255 };
// Higher alpha than the main sketch — trails fade faster so the simplified
// per-cell curves stay legible at small size.
const FEEDBACK_ALPHA = 15;
const PARTICLE_DIAMETER = 2;
const AMP_RATIO = 0.4;
// Bigger step than the main sketch (was 0.8) → fewer particles per cell.
// With 27 cells on screen, total stays light.
const AMP_STEP = 3;
const LOOP_FRAMES = 720; // ~30s at 24fps — same as the main page's default.

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

// The 27 visually distinct coprime (a, b) pairs with 1 ≤ a < b ≤ 9.
const COPRIME_PAIRS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = a + 1; b <= 9; b++) {
      if (gcd(a, b) === 1) out.push([a, b]);
    }
  }
  return out;
})();

type Particle = {
  amp: number;
  angle: number;
  alpha: number;
};

type Cell = {
  cx: number;
  cy: number;
  ampMax: number;
  freqA: number;
  freqB: number;
  theta: number;
  particles: Particle[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cells: Cell[] = [];

  const buildCells = () => {
    const isLandscape = p.width >= p.height;
    const cols = isLandscape ? 9 : 3;
    const rows = isLandscape ? 3 : 9;
    const cellW = p.width / cols;
    const cellH = p.height / rows;
    const cellSize = Math.min(cellW, cellH);
    const ampMax = cellSize * AMP_RATIO;

    cells = [];
    for (let i = 0; i < COPRIME_PAIRS.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const [freqA, freqB] = COPRIME_PAIRS[i];
      const theta = (2 * Math.PI) / gcd(freqA, freqB);

      const particles: Particle[] = [];
      for (let j = 0; j <= ampMax; j += AMP_STEP) {
        const t = j / ampMax;
        const alpha =
          t < 0.5
            ? Math.floor(70 + (t / 0.5) * (255 - 70))
            : Math.floor(255 - ((t - 0.5) / 0.5) * (255 - 70));
        particles.push({ amp: j, angle: t * theta, alpha });
      }

      cells.push({
        cx: col * cellW + cellW / 2,
        cy: row * cellH + cellH / 2,
        ampMax,
        freqA,
        freqB,
        theta,
        particles,
      });
    }
  };

  p.setup = () => {
    p.pixelDensity(1);
    p.createCanvas(window.innerWidth, window.innerHeight);
    p.frameRate(24);
    buildCells();
    p.background(19, 12, 18);
  };

  p.windowResized = () => {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    buildCells();
    p.background(19, 12, 18);
  };

  p.draw = () => {
    // Single feedback rect over the whole canvas — fades all 27 cells'
    // trails uniformly per frame.
    p.noStroke();
    p.fill(0, 0, 0, FEEDBACK_ALPHA);
    p.rect(0, 0, p.width, p.height);

    for (const cell of cells) {
      const angleAdder = cell.theta / LOOP_FRAMES;
      const ampDecay = cell.ampMax / LOOP_FRAMES;

      for (const particle of cell.particles) {
        particle.angle += angleAdder;
        if (particle.angle > cell.theta) particle.angle -= cell.theta;
        particle.amp -= ampDecay;
        if (particle.amp < 0) particle.amp += cell.ampMax;

        const x = cell.cx - particle.amp * Math.sin(cell.freqA * particle.angle);
        const y = cell.cy - particle.amp * Math.sin(cell.freqB * particle.angle);
        p.fill(WAVE_PURPLE.r, WAVE_PURPLE.g, WAVE_PURPLE.b, particle.alpha);
        p.circle(x, y, PARTICLE_DIAMETER);
      }
    }
  };
};

type CanvasProps = { isActive?: boolean };

export function ShapeOfTimeGridCanvas({ isActive = true }: CanvasProps = {}) {
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
    if (isActive) p5.loop?.();
    else p5?.noLoop?.();
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
