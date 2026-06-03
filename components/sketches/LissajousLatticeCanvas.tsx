"use client";

import { useEffect, useRef } from "react";

// Visualises the discrete-sampling lattice. With numDots = 20, every
// possible dot position must lie at (sin(i·π/10), sin(j·π/10)) for some
// integers i, j — and those sin values only take 11 distinct values
// each, giving an 11×11 = 121-point lattice. The sketch draws the full
// lattice faintly, then highlights the 20 points selected by the
// current Lissajous pair. Cycling through pairs shows different
// "selections" from the same fixed point cloud.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
const LATTICE_GRAY = { r: 100, g: 100, b: 110 };
const NUM_DOTS = 20;
const HOLD_FRAMES = 90; // ~3s @ 30fps per pair

// Cycle through pairs in the coprime-to-20 family ({1, 3, 7, 9}). All
// of these share the same x/y coordinate set on the lattice, so the
// difference is purely which lattice points get paired.
const PAIRS: Array<[number, number]> = [
  [1, 7],
  [3, 7],
  [7, 9],
  [1, 9],
  [9, 7],
  [7, 3],
  [1, 3],
  [3, 9],
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  let cy = 0;
  let amp = 0;
  let pairIdx = 0;
  let frameCounter = 0;

  // Precompute the 11 distinct sin values: {0, ±sin(π/10), ±sin(2π/10),
  // ±sin(3π/10), ±sin(4π/10), ±1}.
  const distinctSin: number[] = (() => {
    const set = new Set<string>();
    const out: number[] = [];
    for (let k = 0; k < NUM_DOTS; k++) {
      const v = Math.sin((k * Math.PI) / 10);
      const key = v.toFixed(6);
      if (!set.has(key)) {
        set.add(key);
        out.push(v);
      }
    }
    return out;
  })();

  const dims = (): [number, number] => {
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [800, 800];
  };

  const recomputeSize = () => {
    cx = p.width / 2;
    cy = p.height / 2;
    const viewportMin =
      typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height);
    amp = viewportMin * 0.38;
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = dims();
    p.createCanvas(cw, ch);
    p.frameRate(30);
    recomputeSize();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    recomputeSize();
  };

  p.draw = () => {
    p.background(19, 12, 18);
    p.noStroke();

    // Lattice background — every possible (sin(iπ/10), sin(jπ/10)) point.
    const latticeR = Math.max(2, amp * 0.012);
    p.fill(LATTICE_GRAY.r, LATTICE_GRAY.g, LATTICE_GRAY.b, 110);
    for (const sx of distinctSin) {
      for (const sy of distinctSin) {
        p.circle(cx + sx * amp, cy + sy * amp, latticeR * 2);
      }
    }

    // Current pair's selection (highlighted in blue + pink, with the
    // origin-mirror as usual).
    const [a, b] = PAIRS[pairIdx];
    const highlightR = Math.max(4, amp * 0.025);
    for (let k = 0; k < NUM_DOTS; k++) {
      const theta = (k * Math.PI) / 10;
      const sa = Math.sin(a * theta) * amp;
      const sb = Math.sin(b * theta) * amp;
      p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
      p.circle(cx + sa, cy + sb, highlightR * 2);
      p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
      p.circle(cx - sa, cy - sb, highlightR * 2);
    }

    // Pair label below the lattice.
    p.fill(220, 220, 230, 230);
    p.textFont("monospace");
    p.textSize(Math.max(18, amp * 0.12));
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${a}:${b}`, cx, cy + amp + amp * 0.08);

    // Advance through pairs on a fixed cadence.
    frameCounter++;
    if (frameCounter >= HOLD_FRAMES) {
      frameCounter = 0;
      pairIdx = (pairIdx + 1) % PAIRS.length;
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousLatticeCanvas({
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
        height: "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
