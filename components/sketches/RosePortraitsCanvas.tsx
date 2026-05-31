"use client";

import { useEffect, useRef } from "react";

const ROSE_PINK = { r: 255, g: 0, b: 255 };

// Dense enough that even high-k rose curves read as a smooth closed line.
const NUM_PARTICLES = 800;

// The rose formula `r = amp + amp·cos(k·θ)` is a limaçon — its max
// distance from origin is 2·amp, not amp. Halve the Lissajous AMP_RATIOs
// so the rose curve's visible diameter matches the lissajous portraits
// instead of overflowing to ~1.9× container size.
const AMP_RATIO_DESKTOP = 0.19;
const AMP_RATIO_MOBILE = 0.22;
const ampRatio = () =>
  typeof window !== "undefined" && window.innerWidth <= 720
    ? AMP_RATIO_MOBILE
    : AMP_RATIO_DESKTOP;

const INCREMENT = 0.0021; // slow global rotation
const HOLD_FRAMES = 2;
const MORPH_FRAMES = 72;

// Choose petal counts the way the Rose grid does — small integer ratios
// produce the most legible rose shapes. p and q are kept ≤ 7 so the
// closed-curve approximation with NUM_PARTICLES stays smooth.
const MIN_P = 1;
const MAX_P = 7;

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

const pickPair = (avoidA: number, avoidB: number): [number, number] => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const a = MIN_P + Math.floor(Math.random() * (MAX_P - MIN_P + 1));
    const b = MIN_P + Math.floor(Math.random() * (MAX_P - MIN_P + 1));
    if (a === b) continue; // ratio 1 = circle, boring
    if (a === avoidA && b === avoidB) continue;
    return [a, b];
  }
  return [3, 2];
};

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const LINE_WEIGHT = 3;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  let cy = 0;
  let amp = 100;
  let globalAngle = 0;

  const xs: number[] = new Array(NUM_PARTICLES);
  const ys: number[] = new Array(NUM_PARTICLES);

  // Each rose is parameterised by k = p / q (the petal ratio). The full
  // closed curve sweeps θ ∈ [0, 2π · q / gcd(p,q)].
  let pOld = 3;
  let qOld = 2;
  let pNew = 3;
  let qNew = 2;
  let isMorphing = false;
  let morphProgress = 0;
  let holdCounter = 0;

  const recomputeSize = () => {
    cx = p.width / 2;
    cy = p.height / 2;
    // Amp from the live viewport so the curve diameter is always sized
     // relative to what the user actually sees, never overflowing because
     // of an oversized container.
    amp =
      (typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height)) * ampRatio();
  };

  const dims = (): [number, number] => {
    const parent = (p.canvas && p.canvas.parentElement) as HTMLElement | null;
    if (parent && parent.clientWidth > 0 && parent.clientHeight > 0) {
      return [parent.clientWidth, parent.clientHeight];
    }
    return [window.innerWidth, window.innerHeight];
  };

  // Walk θ across the full closed period and write a point at phaseUnit
  // i/NUM_PARTICLES into out.x/out.y. Uses the limaçon-style rose
  // formula r = a + a·cos(k·θ) so the curve always wraps around the
  // origin (no zero-crossings that would make the morph snap inside-out).
  const computePoint = (
    i: number,
    pp: number,
    qq: number,
    out: { x: number; y: number },
  ) => {
    const g = gcd(pp, qq);
    const period = (2 * Math.PI * qq) / g;
    const theta = globalAngle + (i / NUM_PARTICLES) * period;
    const k = pp / qq;
    const polar = amp + amp * Math.cos(k * theta);
    out.x = cx + polar * Math.cos(theta);
    out.y = cy + polar * Math.sin(theta);
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = dims();
    p.createCanvas(cw, ch);
    p.frameRate(24);
    recomputeSize();
    [pOld, qOld] = pickPair(0, 0);
    pNew = pOld;
    qNew = qOld;
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    recomputeSize();
  };

  p.draw = () => {
    p.background(0, 13, 25); // #000d19 — same teal-black as the grid sketch

    globalAngle += INCREMENT;
    if (globalAngle > Math.PI * 200) globalAngle -= Math.PI * 200;

    if (isMorphing) {
      morphProgress += 1 / MORPH_FRAMES;
      if (morphProgress >= 1) {
        morphProgress = 1;
        isMorphing = false;
        pOld = pNew;
        qOld = qNew;
        holdCounter = 0;
      }
    } else {
      holdCounter++;
      if (holdCounter >= HOLD_FRAMES) {
        const [a, b] = pickPair(pOld, qOld);
        pNew = a;
        qNew = b;
        isMorphing = true;
        morphProgress = 0;
      }
    }

    const tEased = isMorphing ? easeInOutCubic(morphProgress) : 0;
    const old = { x: 0, y: 0 };
    const nu = { x: 0, y: 0 };

    for (let i = 0; i < NUM_PARTICLES; i++) {
      computePoint(i, pOld, qOld, old);
      if (isMorphing) {
        computePoint(i, pNew, qNew, nu);
        xs[i] = old.x + (nu.x - old.x) * tEased;
        ys[i] = old.y + (nu.y - old.y) * tEased;
      } else {
        xs[i] = old.x;
        ys[i] = old.y;
      }
    }

    p.noFill();
    p.stroke(ROSE_PINK.r, ROSE_PINK.g, ROSE_PINK.b, 255);
    p.strokeWeight(LINE_WEIGHT);
    p.beginShape();
    for (let i = 0; i < NUM_PARTICLES; i++) p.vertex(xs[i], ys[i]);
    p.endShape(p.CLOSE);
  };
};

type CanvasProps = {
  isActive?: boolean;
  inFlow?: boolean;
};

export function RosePortraitsCanvas({
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
        background: "#000d19",
        overflow: "hidden",
      }}
    />
  );
}
