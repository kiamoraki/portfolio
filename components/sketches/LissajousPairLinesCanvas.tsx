"use client";

import { useEffect, useRef } from "react";

// Companion to LissajousAliasingCompareCanvas: takes the top
// (20-dot aliased) animation and adds a gradient connector between
// every pink dot and its paired blue dot. Because the pink dot at k is
// the origin-mirror of the blue dot at k, every connector passes
// through the canvas center — so the union of the 20 lines forms a
// rotating asterisk that traces out the underlying Lissajous structure.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
const NUM_DOTS = 20;
// Same breakpoint the global CSS uses to flip lissajous layouts
// between the desktop and mobile patterns — kept in sync so the
// JS amp ratio switches at the same width the CSS wrapper does.
const MOBILE_BREAKPOINT = 720;
// No hold phase — the animation is continuous interpolation: the moment
// particles reach the target pair, they immediately begin morphing
// toward the next pair in the cycle. The motion never settles.
const MORPH_FRAMES = 150; // ~5s @ 30fps for each pair-to-pair transition
const TRAIL_LENGTH = 90; // ~3s @ 30fps — only the endpoint dots leave trails

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Hungarian algorithm (Jonker-Volgenant shortest-augmenting-path
// variant) — provably-minimum total squared-distance assignment of
// `srcX/Y → tgtX/Y` particles. Builds the n×n cost matrix from
// squared Euclidean distances, then runs O(n³) augmenting passes
// with row/column potentials to find the minimum-cost perfect
// matching. Replaces the previous greedy "best-matching first" pass
// which was near-optimal for n=20 but occasionally missed pairs
// where a small swap would lower the total — Hungarian catches
// those. Internal arrays are 1-indexed (Hungarian convention) and
// converted back to 0-indexed on return.
function computeAssignment(
  srcX: number[],
  srcY: number[],
  tgtX: number[],
  tgtY: number[],
): number[] {
  const n = srcX.length;
  // Squared-distance cost matrix.
  const cost: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = srcX[i] - tgtX[j];
      const dy = srcY[i] - tgtY[j];
      cost[i][j] = dx * dx + dy * dy;
    }
  }

  // Row + column potentials (`u`, `v`) and the assignment record
  // `p[j] = i` meaning column j is assigned to row i (1-indexed; 0
  // means "unassigned"). `way[j]` tracks the predecessor column in
  // the augmenting path used after each iteration to actually perform
  // the swap.
  const INF = Infinity;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(INF);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = -1;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) {
          minv[j] = cur;
          way[j] = j0;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          j1 = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    // Augment along the path: swap assignments back through `way`.
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0);
  }

  // Convert the column→row record into the row→column assignment.
  const assignment = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    if (p[j] > 0) assignment[p[j] - 1] = j - 1;
  }
  return assignment;
}

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  let cy = 0;
  // amp is split per-axis now so the figure stretches to fill the
  // viewport in both directions instead of fitting inside a square.
  let ampX = 0;
  let ampY = 0;
  let rotation = 0;
  let pairIdx = 0;
  let nextPairIdx = 1;
  let frameCounter = 0;
  // Per-particle slot assignment. sourceSlot[i] / targetSlot[i] are the
  // slot indices (0..NUM_DOTS-1) the i-th particle interpolates between
  // in the current morph. Default identity at startup; recomputed each
  // rollover so the new target slot is whichever one minimises the
  // distance the particle has to travel.
  const sourceSlot: number[] = Array.from(
    { length: NUM_DOTS },
    (_, i) => i,
  );
  const targetSlot: number[] = Array.from(
    { length: NUM_DOTS },
    (_, i) => i,
  );
  let assignmentReady = false;

  // Recompute targetSlot[] for the current (pairIdx → nextPairIdx)
  // morph based on the live rotation. Called once per rollover (and
  // once at first draw to bootstrap the very first morph).
  const recomputeAssignment = () => {
    const [a1, b1] = PAIRS[pairIdx];
    const [a2, b2] = PAIRS[nextPairIdx];
    const srcX = new Array<number>(NUM_DOTS);
    const srcY = new Array<number>(NUM_DOTS);
    const tgtX = new Array<number>(NUM_DOTS);
    const tgtY = new Array<number>(NUM_DOTS);
    // Source positions: where each particle currently sits — at the
    // slot it was assigned to in the morph that just finished.
    for (let i = 0; i < NUM_DOTS; i++) {
      const theta = rotation + (sourceSlot[i] * 2 * Math.PI) / NUM_DOTS;
      srcX[i] = Math.sin(a1 * theta) * ampX;
      srcY[i] = Math.sin(b1 * theta) * ampY;
    }
    // Candidate target positions: every slot 0..N-1 under the new pair.
    for (let k = 0; k < NUM_DOTS; k++) {
      const theta = rotation + (k * 2 * Math.PI) / NUM_DOTS;
      tgtX[k] = Math.sin(a2 * theta) * ampX;
      tgtY[k] = Math.sin(b2 * theta) * ampY;
    }
    const σ = computeAssignment(srcX, srcY, tgtX, tgtY);
    for (let i = 0; i < NUM_DOTS; i++) targetSlot[i] = σ[i];
  };
  // Per-dot position history for the trail effect. Only the endpoint
  // dots (blue + pink) leave trails — the lines render fresh each
  // frame. Stored as flat number arrays for fast push/shift.
  const trailBlueX: number[][] = Array.from({ length: NUM_DOTS }, () => []);
  const trailBlueY: number[][] = Array.from({ length: NUM_DOTS }, () => []);
  const trailPinkX: number[][] = Array.from({ length: NUM_DOTS }, () => []);
  const trailPinkY: number[][] = Array.from({ length: NUM_DOTS }, () => []);

  const dims = (): [number, number] => {
    // Read parent (set by `new P5(sketch, container)` via
    // `p._userNode`) before the canvas exists so the first
    // `createCanvas()` already matches the wrapper. Falls back to
    // `p.canvas.parentElement` once the canvas is mounted, and to
    // the viewport in the rare case neither is available.
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
    return [800, 800];
  };

  const recomputeSize = () => {
    cx = p.width / 2;
    cy = p.height / 2;
    // Derive amp from the CANVAS, not the viewport — matches the
    // shape-of-time pattern. Previously this read `window.innerWidth/
    // innerHeight` and sized each axis to fill the viewport, which
    // worked when the container was forced to `100vw × 100dvh` but
    // overflowed the actual 90dvh `.piece-sketch` wrapper, hiding
    // the bottom of the figure under the wrapper's `overflow: hidden`.
    // Now that the container respects `inFlow` and the canvas matches
    // the wrapper, `p.width / p.height` are the correct visible
    // dimensions.
    //
    // The X axis uses a slightly tighter ratio on desktop (0.85 vs
    // 0.92 mobile) so the curve pulls in from the screen edges
    // instead of brushing them — the wide landscape viewports made
    // the asterisk read as too wide relative to its vertical extent.
    // Same shape-of-time pattern of having a `AMP_RATIO_X_MOBILE` /
    // desktop split. Mobile keeps the original 0.92 (~4% margin)
    // since the portrait viewport already constrains the curve
    // naturally.
    const isMobile = p.width <= MOBILE_BREAKPOINT;
    ampX = (p.width / 2) * (isMobile ? 0.92 : 0.85);
    ampY = (p.height / 2) * 0.92;
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
    // Full clear — only the endpoint dots leave trails (drawn from a
    // per-dot position history), so the gradient lines stay crisp.
    p.background(19, 12, 18);

    const [a1, b1] = PAIRS[pairIdx];
    const [a2, b2] = PAIRS[nextPairIdx];
    // Slowed way down — at ~0.0015 the planes drift almost imperceptibly,
    // so the illusion is meditative rather than shimmery.
    rotation += 0.0015;

    const ctx = p.drawingContext as CanvasRenderingContext2D;
    // Size visual elements relative to the SMALLER axis so a tall
    // portrait viewport doesn't blow line weights / dots up to absurd
    // sizes just because ampY is large.
    const ampMin = Math.min(ampX, ampY);
    const lineWeight = Math.max(3, ampMin * 0.025);
    ctx.lineWidth = lineWeight;
    ctx.lineCap = "round";

    // Bootstrap the first morph's assignment on first draw (so it has
    // ampX/ampY available — those aren't ready until recomputeSize()
    // has been called).
    if (!assignmentReady) {
      recomputeAssignment();
      assignmentReady = true;
    }

    // Continuous morph — always 0..1 (eased) across MORPH_FRAMES.
    const tEased = easeInOutCubic(frameCounter / MORPH_FRAMES);

    // Pre-compute (sa, sb) for each particle. Each particle reads its
    // source position from slot sourceSlot[i] under pair (a1, b1) and
    // its target position from slot targetSlot[i] under pair (a2, b2)
    // — that source/target slot assignment is set per-rollover by
    // recomputeAssignment so every particle picks the closest free
    // target slot, minimising total travel during interpolation.
    const sas: number[] = new Array(NUM_DOTS);
    const sbs: number[] = new Array(NUM_DOTS);
    for (let i = 0; i < NUM_DOTS; i++) {
      const srcTheta =
        rotation + (sourceSlot[i] * 2 * Math.PI) / NUM_DOTS;
      const tgtTheta =
        rotation + (targetSlot[i] * 2 * Math.PI) / NUM_DOTS;
      const sa1 = Math.sin(a1 * srcTheta) * ampX;
      const sb1 = Math.sin(b1 * srcTheta) * ampY;
      const sa2 = Math.sin(a2 * tgtTheta) * ampX;
      const sb2 = Math.sin(b2 * tgtTheta) * ampY;
      sas[i] = sa1 + (sa2 - sa1) * tEased;
      sbs[i] = sb1 + (sb2 - sb1) * tEased;
    }

    // Pass 1: gradient connectors — temporarily disabled to see how
    // the sketch reads with only the trailing endpoint dots. Restore
    // by uncommenting the block below.
    /*
    for (let k = 0; k < NUM_DOTS; k++) {
      const sa = sas[k];
      const sb = sbs[k];
      const blueX = cx + sa;
      const blueY = cy + sb;
      const pinkX = cx - sa;
      const pinkY = cy - sb;

      // Direction from origin: (sa, sb). Horizontal-ness = |cos(angle)|
      // = |sa| / hypot. Floor at 0.15 so the verticals don't disappear.
      const hyp = Math.hypot(sa, sb) || 1;
      const horiz = Math.abs(sa) / hyp;
      const alphaMult = 0.15 + 0.85 * horiz;
      const endA = alphaMult.toFixed(3);
      const midA = (alphaMult * 0.15).toFixed(3);

      // 3-stop gradient: full at endpoints, mostly transparent in the
      // middle — the eye fills in a luminous "edge" between the two
      // anchor dots.
      const grad = ctx.createLinearGradient(pinkX, pinkY, blueX, blueY);
      grad.addColorStop(0, `rgba(${PROJECT_PINK.r}, ${PROJECT_PINK.g}, ${PROJECT_PINK.b}, ${endA})`);
      grad.addColorStop(0.5, `rgba(148, 78, 242, ${midA})`);
      grad.addColorStop(1, `rgba(${PROJECT_BLUE.r}, ${PROJECT_BLUE.g}, ${PROJECT_BLUE.b}, ${endA})`);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(pinkX, pinkY);
      ctx.lineTo(blueX, blueY);
      ctx.stroke();
    }
    */

    // Pass 2: dot trails — render each dot's recent positions first,
    // with alpha ramping from 0 at the tail end to the current frame.
    // Push the current frame's position into history afterwards so the
    // newest sample participates in the next frame's trail.
    p.noStroke();
    const dotR = Math.max(2, ampMin * 0.01);
    const trailR = dotR; // trail bead = same size as current dot
    for (let k = 0; k < NUM_DOTS; k++) {
      const histLen = trailBlueX[k].length;
      for (let i = 0; i < histLen; i++) {
        // Older entries (small i) get lower alpha — quadratic falloff
        // so most of the tail is faint and the head is bold.
        const t = (i + 1) / TRAIL_LENGTH;
        const a = 220 * t * t;
        p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b, a);
        p.circle(trailBlueX[k][i], trailBlueY[k][i], trailR * 2);
        p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b, a);
        p.circle(trailPinkX[k][i], trailPinkY[k][i], trailR * 2);
      }
    }

    // Pass 3: current dots at full opacity, then record this frame
    // into each dot's history (capped at TRAIL_LENGTH).
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

      trailBlueX[k].push(blueX);
      trailBlueY[k].push(blueY);
      trailPinkX[k].push(pinkX);
      trailPinkY[k].push(pinkY);
      if (trailBlueX[k].length > TRAIL_LENGTH) {
        trailBlueX[k].shift();
        trailBlueY[k].shift();
        trailPinkX[k].shift();
        trailPinkY[k].shift();
      }
    }

    // (Pair label removed — the figure speaks for itself.)

    // Roll over the moment we hit the target. The particles have just
    // arrived at their assigned target slots, so those become the new
    // source slots. Advance nextPairIdx one slot in the cycle and
    // recompute assignment so the new target slots minimise the
    // distance from each particle's current position.
    frameCounter++;
    if (frameCounter >= MORPH_FRAMES) {
      for (let i = 0; i < NUM_DOTS; i++) sourceSlot[i] = targetSlot[i];
      pairIdx = nextPairIdx;
      nextPairIdx = (nextPairIdx + 1) % PAIRS.length;
      frameCounter = 0;
      recomputeAssignment();
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousPairLinesCanvas({
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
        // `inFlow` from the `Sketch` primitive means the canvas
        // lives inside `.piece-sketch` (which is 90dvh on desktop,
        // `calc(100svh - 56px)` on mobile per the global lissajous
        // sizing rule) — fill it via `100%` instead of escaping to
        // `100vw × 100dvh`, otherwise the bottom of the canvas falls
        // into the wrapper's `overflow: hidden` strip and the figure
        // crops vertically.
        width: inFlow ? "100%" : "100vw",
        height: inFlow ? "100%" : "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
