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

// Grid orientation tracks the viewport aspect so the sketch fills the
// page edge-to-edge in either direction: a 3 wide × 6 tall portrait
// grid on phones, a 5 wide × 3 tall landscape grid on desktops.
// (Desktop was 6 × 3 = 18 cells; trimmed to 5 × 3 = 15 cells per request
// — slightly fewer, slightly larger jellyfish since `ampMax` derives
// from `min(cellW, cellH)` and the wider cells push that proportionally.
// Mobile portrait stays at 3 × 6.)
function gridDims(): [number, number] {
  if (typeof window !== "undefined" && window.innerWidth >= window.innerHeight) {
    return [5, 3];
  }
  return [3, 6];
}

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
    // Track the parent (`.piece-sketch` wrapper) so the canvas matches
    // the visible area exactly. Was reading the live viewport, which
    // worked when the wrapper was `100dvh` but overshoots the
    // `calc(100dvh - 1rem - 56px)` wrapper under the `below-nav`
    // pattern by 72px — the grid bottom row then sits noticeably
    // closer to the visible bottom edge than the top row is to the
    // visible top edge. Reading `_userNode.clientWidth/clientHeight`
    // makes the 3-row grid's cell centres land symmetrically inside
    // the visible wrapper. Falls back to the original sketch's
    // 452×803 portrait dims for SSR / no-window contexts.
    const node =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((p as any)._userNode ||
        (p.canvas && p.canvas.parentElement)) as HTMLElement | null;
    if (node && node.clientWidth > 0 && node.clientHeight > 0) {
      return [node.clientWidth, node.clientHeight];
    }
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [452, 803];
  };

  const buildLissas = () => {
    lissas = [];
    const [gridCols, gridRows] = gridDims();
    const gridSquareW = p.width / gridCols;
    const gridSquareH = p.height / gridRows;
    // Original used `grid_square_w / 2 - 35`, but the −35 margin is too
    // chunky on narrow viewports. Match the proportional spirit:
    // ampMax ≈ 25% of the min cell side so each jellyfish sits with
    // generous breathing room inside its cell. (Was 35%; the 28%
    // shrink reads as more refined, less crowded across both
    // portrait + landscape grids.)
    const ampMax = Math.max(
      5,
      Math.min(gridSquareW, gridSquareH) * 0.25,
    );

    for (let xi = 0; xi < gridCols; xi++) {
      for (let yi = 0; yi < gridRows; yi++) {
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
            k1: [255, 0, 255], // magenta-pink — original
            k2: [0, 0, 255], // blue
            // Pin all rings to `kPct: 0` (magenta-pink) at frame 0 so the
            // first frame reads uniformly magenta — was the per-ring
            // `cPct` (0→1 across rings), which left some rings already
            // blue on first paint.
            kPct: 0,
            // `pctAdder` is still shared, but multiplied by a per-ring
            // phase so the rings diverge as the lerp runs — without it
            // they'd ping-pong between magenta and blue in lockstep.
            pctAdder: INCREMENT * 2 * (1 + cPct),
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
  inFlow = false,
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
        // `inFlow` from `Sketch` → match the `.piece-sketch` wrapper
        // (`calc(100dvh - 1rem - 56px)` under `below-nav`) so the canvas
        // doesn't overshoot vertically. Falls back to `100vw × 100dvh`
        // for callers outside the carousel that want full-bleed.
        width: inFlow ? "100%" : "100vw",
        height: inFlow ? "100%" : "100dvh",
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}
