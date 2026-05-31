"use client";

import { useEffect, useRef } from "react";

// Side-by-side comparison sketch: identical Lissajous pair cycle in
// both halves, but the top half uses the nearest-slot assignment
// (particles pick the closest free target slot on every rollover, so
// each one moves the least possible distance) while the bottom half
// uses the original identity assignment (particle k always heads to
// slot k of the next pair). Same rotation, same morph timing in
// lockstep — the only thing that differs is the assignment strategy.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
const NUM_DOTS = 20;
const MORPH_FRAMES = 150; // ~5s per pair-to-pair transition
const TRAIL_LENGTH = 90;

const PAIRS: Array<[number, number]> = [
  [1, 7],
  [3, 7],
  [7, 9],
  [1, 9],
  [9, 7],
  [3, 1],
  [9, 1],
  [7, 3],
];

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Greedy best-matching-first assignment, same algorithm as in
// LissajousPairLinesCanvas. Locks in the (source, target) pair with the
// smallest squared distance each step.
function computeAssignment(
  srcX: number[],
  srcY: number[],
  tgtX: number[],
  tgtY: number[],
): number[] {
  const n = srcX.length;
  const assignment = new Array<number>(n).fill(-1);
  const srcUsed = new Array<boolean>(n).fill(false);
  const tgtUsed = new Array<boolean>(n).fill(false);
  for (let step = 0; step < n; step++) {
    let bestSrc = -1;
    let bestTgt = -1;
    let bestD = Infinity;
    for (let i = 0; i < n; i++) {
      if (srcUsed[i]) continue;
      const sx = srcX[i];
      const sy = srcY[i];
      for (let j = 0; j < n; j++) {
        if (tgtUsed[j]) continue;
        const dx = sx - tgtX[j];
        const dy = sy - tgtY[j];
        const d = dx * dx + dy * dy;
        if (d < bestD) {
          bestD = d;
          bestSrc = i;
          bestTgt = j;
        }
      }
    }
    assignment[bestSrc] = bestTgt;
    srcUsed[bestSrc] = true;
    tgtUsed[bestTgt] = true;
  }
  return assignment;
}

type HalfState = {
  sourceSlot: number[];
  targetSlot: number[];
  trailBlueX: number[][];
  trailBlueY: number[][];
  trailPinkX: number[][];
  trailPinkY: number[][];
};

function makeHalfState(): HalfState {
  return {
    sourceSlot: Array.from({ length: NUM_DOTS }, (_, i) => i),
    targetSlot: Array.from({ length: NUM_DOTS }, (_, i) => i),
    trailBlueX: Array.from({ length: NUM_DOTS }, () => []),
    trailBlueY: Array.from({ length: NUM_DOTS }, () => []),
    trailPinkX: Array.from({ length: NUM_DOTS }, () => []),
    trailPinkY: Array.from({ length: NUM_DOTS }, () => []),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  // Top and bottom centres — set in recomputeSize().
  let cyTop = 0;
  let cyBottom = 0;
  let ampX = 0;
  let ampY = 0; // per-half (so each half fits inside its half of viewport height)
  let rotation = 0;
  let pairIdx = 0;
  let nextPairIdx = 1;
  let frameCounter = 0;
  let assignmentReady = false;

  const topState = makeHalfState();
  const bottomState = makeHalfState(); // identity mode — sourceSlot == targetSlot == identity always

  const dims = (): [number, number] => {
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [800, 800];
  };

  const recomputeSize = () => {
    cx = p.width / 2;
    cyTop = p.height / 4;
    cyBottom = (p.height * 3) / 4;
    const vw =
      typeof window !== "undefined" ? window.innerWidth : p.width;
    const vh =
      typeof window !== "undefined" ? window.innerHeight : p.height;
    ampX = (vw / 2) * 0.92;
    // Each half gets half the viewport height. ampY is the half-height
    // of one half, scaled in slightly so there's room for labels.
    ampY = (vh / 4) * 0.82;
  };

  // Recompute target slots for the top half using nearest-slot
  // assignment. Bottom half stays identity (no-op).
  const recomputeTopAssignment = () => {
    const [a1, b1] = PAIRS[pairIdx];
    const [a2, b2] = PAIRS[nextPairIdx];
    const srcX = new Array<number>(NUM_DOTS);
    const srcY = new Array<number>(NUM_DOTS);
    const tgtX = new Array<number>(NUM_DOTS);
    const tgtY = new Array<number>(NUM_DOTS);
    for (let i = 0; i < NUM_DOTS; i++) {
      const theta =
        rotation + (topState.sourceSlot[i] * 2 * Math.PI) / NUM_DOTS;
      srcX[i] = Math.sin(a1 * theta) * ampX;
      srcY[i] = Math.sin(b1 * theta) * ampY;
    }
    for (let k = 0; k < NUM_DOTS; k++) {
      const theta = rotation + (k * 2 * Math.PI) / NUM_DOTS;
      tgtX[k] = Math.sin(a2 * theta) * ampX;
      tgtY[k] = Math.sin(b2 * theta) * ampY;
    }
    const σ = computeAssignment(srcX, srcY, tgtX, tgtY);
    for (let i = 0; i < NUM_DOTS; i++) topState.targetSlot[i] = σ[i];
  };

  // Per-half draw helper — renders dot trails, current dots, label
  // strip. Takes the centre y for the half and the half's state.
  const drawHalf = (
    cy: number,
    state: HalfState,
    a1: number,
    b1: number,
    a2: number,
    b2: number,
    tEased: number,
  ) => {
    // Pre-compute interpolated (sa, sb) for each particle in this half.
    const sas = new Array<number>(NUM_DOTS);
    const sbs = new Array<number>(NUM_DOTS);
    for (let i = 0; i < NUM_DOTS; i++) {
      const srcTheta =
        rotation + (state.sourceSlot[i] * 2 * Math.PI) / NUM_DOTS;
      const tgtTheta =
        rotation + (state.targetSlot[i] * 2 * Math.PI) / NUM_DOTS;
      const sa1 = Math.sin(a1 * srcTheta) * ampX;
      const sb1 = Math.sin(b1 * srcTheta) * ampY;
      const sa2 = Math.sin(a2 * tgtTheta) * ampX;
      const sb2 = Math.sin(b2 * tgtTheta) * ampY;
      sas[i] = sa1 + (sa2 - sa1) * tEased;
      sbs[i] = sb1 + (sb2 - sb1) * tEased;
    }

    const ampMin = Math.min(ampX, ampY);
    const dotR = Math.max(2, ampMin * 0.012);

    // Trail dots (older = fainter, quadratic falloff).
    p.noStroke();
    for (let k = 0; k < NUM_DOTS; k++) {
      const histLen = state.trailBlueX[k].length;
      for (let i = 0; i < histLen; i++) {
        const t = (i + 1) / TRAIL_LENGTH;
        const a = 220 * t * t;
        p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b, a);
        p.circle(state.trailBlueX[k][i], state.trailBlueY[k][i], dotR * 2);
        p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b, a);
        p.circle(state.trailPinkX[k][i], state.trailPinkY[k][i], dotR * 2);
      }
    }

    // Current dots + history push.
    for (let k = 0; k < NUM_DOTS; k++) {
      const sa = sas[k];
      const sb = sbs[k];
      const blueX = cx + sa;
      const blueY = cy + sb;
      const pinkX = cx - sa;
      const pinkY = cy - sb;
      p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
      p.circle(blueX, blueY, dotR * 2);
      p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
      p.circle(pinkX, pinkY, dotR * 2);

      state.trailBlueX[k].push(blueX);
      state.trailBlueY[k].push(blueY);
      state.trailPinkX[k].push(pinkX);
      state.trailPinkY[k].push(pinkY);
      if (state.trailBlueX[k].length > TRAIL_LENGTH) {
        state.trailBlueX[k].shift();
        state.trailBlueY[k].shift();
        state.trailPinkX[k].shift();
        state.trailPinkY[k].shift();
      }
    }
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

    // Bootstrap top-half assignment once amps are ready.
    if (!assignmentReady) {
      recomputeTopAssignment();
      assignmentReady = true;
    }

    rotation += 0.0015;

    const [a1, b1] = PAIRS[pairIdx];
    const [a2, b2] = PAIRS[nextPairIdx];
    const tEased = easeInOutCubic(frameCounter / MORPH_FRAMES);

    // Draw both halves in lockstep using their respective state.
    drawHalf(cyTop, topState, a1, b1, a2, b2, tEased);
    drawHalf(cyBottom, bottomState, a1, b1, a2, b2, tEased);

    // Faint divider between the two halves to make the split explicit.
    p.noFill();
    p.stroke(220, 220, 230, 35);
    p.strokeWeight(1);
    p.line(0, p.height / 2, p.width, p.height / 2);
    p.noStroke();

    // Per-half method labels at the top of each half.
    const ampMin = Math.min(ampX, ampY);
    const methodLabelSize = Math.max(12, ampMin * 0.05);
    p.fill(220, 220, 230, 200);
    p.textFont("monospace");
    p.textSize(methodLabelSize);
    p.textAlign(p.LEFT, p.TOP);
    p.text("nearest slot", methodLabelSize * 0.6, methodLabelSize * 0.6);
    p.text(
      "fixed identity",
      methodLabelSize * 0.6,
      p.height / 2 + methodLabelSize * 0.6,
    );

    // Shared pair label centred at the very bottom.
    const pairLabelSize = Math.max(16, ampMin * 0.08);
    p.textSize(pairLabelSize);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(
      `${a1}:${b1}  →  ${a2}:${b2}`,
      cx,
      p.height - pairLabelSize * 0.5,
    );

    // Roll over both halves simultaneously. Top half recomputes its
    // assignment; bottom half keeps identity (sourceSlot==targetSlot
    // by construction, so just refresh sourceSlot from targetSlot which
    // is a no-op but kept here for symmetry).
    frameCounter++;
    if (frameCounter >= MORPH_FRAMES) {
      for (let i = 0; i < NUM_DOTS; i++) {
        topState.sourceSlot[i] = topState.targetSlot[i];
        bottomState.sourceSlot[i] = bottomState.targetSlot[i];
      }
      pairIdx = nextPairIdx;
      nextPairIdx = (nextPairIdx + 1) % PAIRS.length;
      frameCounter = 0;
      recomputeTopAssignment();
      // bottomState target stays identity — no recompute.
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousAssignmentCompareCanvas({
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
        height: "100vh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
