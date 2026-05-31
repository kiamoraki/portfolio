"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

const PROJECT_BLUE = { r: 42, g: 88, b: 255 };

// Dense enough that even the highest-gcd curves (theta = 2π) read as a smooth
// closed line rather than a polygon.
const NUM_PARTICLES = 600;
// Matches the grid slide's outermost-dot radius. On mobile the grid uses
// sideRatio 0.95, so amp = 0.475 here makes the visible diameter line up
// at the same width as the grid sketch.
const AMP_RATIO_DESKTOP = 0.38;
const AMP_RATIO_MOBILE = 0.45;
const ampRatio = () =>
  typeof window !== "undefined" && window.innerWidth <= 720
    ? AMP_RATIO_MOBILE
    : AMP_RATIO_DESKTOP;
const INCREMENT = 0.0021;
// Time spent holding each formation before starting the morph.
const HOLD_FRAMES = 2; // ~0.1s at 24fps
// Time spent transitioning particles to the next formation.
const MORPH_FRAMES = 72; // ~3s at 24fps
const MIN_FREQ = 1;
const MAX_FREQ = 9;

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

const getTheta = (a: number, b: number) =>
  (2 * Math.PI) / calculateGCD(a, b);

const pickFreq = () =>
  MIN_FREQ + Math.floor(Math.random() * (MAX_FREQ - MIN_FREQ + 1));

const pickFreqPair = (
  avoidA: number,
  avoidB: number,
): [number, number] => {
  for (let attempt = 0; attempt < 50; attempt++) {
    const a = pickFreq();
    const b = pickFreq();
    if (a !== b && !(a === avoidA && b === avoidB)) return [a, b];
  }
  return [2, 5];
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

  // The "current" formation is held in freqA/B Old; when a morph begins
  // we pick freqA/B New as the target. Once the morph completes, Old is
  // overwritten with New and the cycle repeats.
  let freqAOld = 2;
  let freqBOld = 5;
  let freqANew = 2;
  let freqBNew = 5;
  let isMorphing = false;
  let morphProgress = 0;
  let holdCounter = 0;

  const recomputeSize = () => {
    cx = p.width / 2;
    cy = p.height / 2;
    // Amp is computed from the viewport (not the canvas) so the visible
    // diameter is always proportional to what the user actually sees,
    // never overflowing because of an oversized container.
    const viewportMin =
      typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height);
    amp = viewportMin * ampRatio();
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
    p.frameRate(24);
    recomputeSize();
    [freqAOld, freqBOld] = pickFreqPair(0, 0);
    freqANew = freqAOld;
    freqBNew = freqBOld;
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    recomputeSize();
  };

  p.draw = () => {
    p.background(19, 12, 18);

    globalAngle += INCREMENT;
    // Keep the angle bounded so float precision stays clean over long runs.
    if (globalAngle > Math.PI * 200) globalAngle -= Math.PI * 200;

    if (isMorphing) {
      morphProgress += 1 / MORPH_FRAMES;
      if (morphProgress >= 1) {
        morphProgress = 1;
        isMorphing = false;
        freqAOld = freqANew;
        freqBOld = freqBNew;
        holdCounter = 0;
      }
    } else {
      holdCounter++;
      if (holdCounter >= HOLD_FRAMES) {
        const [a, b] = pickFreqPair(freqAOld, freqBOld);
        freqANew = a;
        freqBNew = b;
        isMorphing = true;
        morphProgress = 0;
      }
    }

    const thetaOld = getTheta(freqAOld, freqBOld);
    const thetaNew = getTheta(freqANew, freqBNew);
    const tEased = isMorphing ? easeInOutCubic(morphProgress) : 0;

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const phaseUnit = i / NUM_PARTICLES;
      const argOld = globalAngle + phaseUnit * thetaOld;
      const xOld = cx + amp * Math.sin(freqAOld * argOld);
      const yOld = cy + amp * Math.sin(freqBOld * argOld);
      if (isMorphing) {
        const argNew = globalAngle + phaseUnit * thetaNew;
        const xNew = cx + amp * Math.sin(freqANew * argNew);
        const yNew = cy + amp * Math.sin(freqBNew * argNew);
        xs[i] = xOld + (xNew - xOld) * tEased;
        ys[i] = yOld + (yNew - yOld) * tEased;
      } else {
        xs[i] = xOld;
        ys[i] = yOld;
      }
    }

    // Single uniform-weight closed string — no layer stack, no dot overlay,
    // so the curve reads as one continuous line of constant thickness
    // regardless of where particles fall along it.
    p.noFill();
    p.stroke(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b, 255);
    p.strokeWeight(LINE_WEIGHT);
    p.beginShape();
    for (let i = 0; i < NUM_PARTICLES; i++) p.vertex(xs[i], ys[i]);
    p.endShape(p.CLOSE);
  };
};

type CanvasProps = {
  isActive?: boolean;
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  inFlow?: boolean;
};

export function LissajousPortraitsCanvas({
  isActive = true,
  canvasRef,
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
      if (canvasRef) canvasRef.current = instance.canvas as HTMLCanvasElement;
      if (!isActiveRef.current) instance.noLoop?.();
    })();
    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Ref.current as any)?.remove?.();
      if (canvasRef) canvasRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
