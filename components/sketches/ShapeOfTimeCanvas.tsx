"use client";

import { useEffect, useRef } from "react";

// Match the lavender/purple used across the wave project sketches.
const WAVE_PURPLE = { r: 181, g: 136, b: 255 };

const AMP_RATIO = 0.4;
/* Per-axis vertical amplitude ratio used on mobile so the figure
   stops stretching tall on portrait phones. On mobile the y axis no
   longer derives from `min(width, height)` — it derives directly
   from the viewport HEIGHT, so the vertical curve extent is
   `p.height * AMP_RATIO_Y_MOBILE` (centered on cy). Tune this to
   dial the figure's height in/out without touching the horizontal
   extent:

     0.40 → curve fills ~40% of viewport height (a touch tall on
            very portrait phones)
     0.35 → starts feeling balanced against the AMP_RATIO=0.4 width
     0.30 → noticeably squatter than wide
*/
const AMP_RATIO_Y_MOBILE = 0.8;
/* Horizontal counterpart to `AMP_RATIO_Y_MOBILE` — pulls the curve
   in a touch from the viewport's left + right edges on mobile so the
   figure has visible margins instead of brushing the screen edges.
   `1.0` = match the previous behavior (curve fills full width); `0.9`
   = ~10% narrower (curve sits with ~5% margin on each side). */
const AMP_RATIO_X_MOBILE = 0.9;
/* Desktop counterparts — pulls the curve in slightly from BOTH
   horizontal and vertical canvas edges so the figure has visible
   margins instead of brushing against them. Previously desktop used
   no multiplier (axes filled the canvas edge-to-edge), which made
   the figure feel cramped against the chrome on the `below-nav`
   canvas-fit layout where the canvas already runs flush against the
   navbar bottom and viewport bottom.
     1.0  → fills the canvas exactly (previous behavior)
     0.85 → ~7.5% margin on each side (current — a small breathing
            room, identical X and Y so the figure isn't stretched)
     0.7  → noticeably tighter, almost like the figure is "framed"
            inside the canvas */
const AMP_RATIO_X_DESKTOP = 0.85;
const AMP_RATIO_Y_DESKTOP = 0.85;
/* Breakpoint matching the rest of the site's `@media (max-width:
   720px)` boundary. */
const MOBILE_BREAKPOINT = 720;
/* Multiplier applied to `ampStep` on mobile so the curve gets MORE
   particles than the desktop default would yield. The vertical
   stretch from `AMP_RATIO_Y_MOBILE` makes each particle cover ~2x
   the pixel range it would on desktop; halving the step doubles the
   particle count to compensate so the curve doesn't read sparse.
     0.5 → 2× particles (the on-curve dots stay roughly the same
           visual density as on desktop)
     0.4 → ~2.5× particles
     0.3 → ~3.3× particles (heavier perf cost on lower-end phones)
*/
const MOBILE_AMP_STEP_FACTOR = 0.5;
/* Reference period (seconds) at which the current default
   `AMP_STEP = 0.8` gives a visual density that reads as balanced —
   corresponds to pairs with gcd = 4 (e.g. `4 : 8` → `theta / ANGLE_
   ADDER / 24 ≈ 72.7s`). Longer-period pairs draw the same number of
   particles over a more elaborate curve, so they read SPARSER unless
   we add more particles. The `densityBoost` below scales `ampStep`
   inversely with period so any sketch with a period ≥ this reference
   has its particle count pumped up to match the reference density.
   Periods SHORTER than the reference are left alone (boost clamps to
   1) — the curve is already as dense as the reference there. */
const REF_PERIOD_SEC = 72.7;
const FRAME_RATE = 24;
const PARTICLE_DIAMETER = 3;
const FEEDBACK_ALPHA = 6;
const AMP_STEP = 0.8;
const AMP_DECAY = 0.4;
const ANGLE_ADDER = 0.0009;
const MIN_FREQ = 1;
const MAX_FREQ = 9;
const LOOP_FREQ_A = 2;
const LOOP_FREQ_B = 5;
// Per freq pair: animate for CYCLES_BEFORE_FADE complete inner loops, then
// fade out particles one at a time over FADE_OUT_LOOPS more inner loops.
// shape-of-time-loop-complete fires at the end of fade-out so ShapeOfTime
// picks the next coprime pair, which triggers buildParticles + a fresh
// background clear.
const CYCLES_BEFORE_FADE = 2;
const FADE_OUT_LOOPS = 1;

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

/**
 * Roll a random coprime-friendly pair of frequencies for the next
 * lissajous cycle. Both values land in `[MIN_FREQ, MAX_FREQ]` and are
 * always distinct.
 *
 * @param ascending — when true, also constrains `b > a` so the second
 *   frequency is always the larger of the pair. Used on mobile, where
 *   the viewport's portrait aspect makes the `(freqA, freqB)` pairs
 *   where the SECOND frequency drives the longer axis read more
 *   naturally (taller figures look intentional rather than cramped).
 */
const pickFreqPair = (ascending = false): [number, number] => {
  const roll = () =>
    MIN_FREQ + Math.floor(Math.random() * (MAX_FREQ - MIN_FREQ + 1));
  let a = roll();
  let b = roll();
  // Re-roll until the pair is valid: distinct, and (if requested)
  // b strictly greater than a.
  while (a === b || (ascending && b <= a)) {
    a = roll();
    b = roll();
  }
  return [a, b];
};

type Particle = {
  amp: number;
  angle: number;
  alpha: number;
  initialAmp: number;
  initialAngle: number;
  // Frame at which this particle stops being drawn. Computed in
  // buildParticles such that the outermost particles disappear first and
  // the centermost disappear last, mirroring the spiral's structure.
  removedAtFrame: number;
};

// Module-level config read by the sketch and written by the React wrapper.
// Using a plain global instead of a per-instance map avoids race conditions
// between React's StrictMode double-mount and Turbopack hot-reload.
type GlobalConfig = {
  loopFrames?: number;
  forcedFreqA?: number;
  forcedFreqB?: number;
  // When true, the canvas is sized to a min(width, height) square — useful
  // for recording so MediaRecorder captures only the animated region with
  // no surrounding black bars.
  square?: boolean;
  // When true, the per-cycle particle count scales inversely with the freq
  // sum, so a high-ratio pair like 8:9 gets ~5.7× more particles than 1:2
  // and ends up looking similarly dense along its arc length.
  autoDensity?: boolean;
  // When false, the sketch advances every particle's amp/angle as usual
  // (and keeps firing the per-frame + loop-complete hooks) but skips the
  // actual `p.circle` call, so the feedback rect alone fades the canvas.
  // Defaults to true (= draw) when undefined.
  drawing?: boolean;
  // Monotonically-increasing counter that signals the canvas to re-roll
  // its frequency pair NOW (rather than waiting for the macro-loop
  // boundary). External UI bumps this and the sketch's draw loop
  // detects the change → `buildParticles()` + background clear.
  refreshTick?: number;
};
declare global {
  // eslint-disable-next-line no-var
  var __shapeOfTimeConfig: GlobalConfig | undefined;
  // eslint-disable-next-line no-var
  var __shapeOfTimeOnFrame: ((frameInLoop: number) => void) | undefined;
}
if (typeof window !== "undefined" && !globalThis.__shapeOfTimeConfig) {
  globalThis.__shapeOfTimeConfig = {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let particles: Particle[] = [];
  let cx = 0;
  let cy = 0;
  let freqA = LOOP_FREQ_A;
  let freqB = LOOP_FREQ_B;
  let theta = Math.PI * 2;
  let ampMax = 100;
  // Per-axis stretch factors — multiply the x and y coordinates so the
  // curve fills the full viewport in BOTH directions, no matter the
  // aspect ratio. ampMax stays based on the smaller axis (so the
  // particle iteration bound + alpha curve are independent of viewport
  // shape); these scales then stretch the rendered output back out so
  // the figure spans the entire canvas.
  let xScale = 1;
  let yScale = 1;
  let frameInLoop = 0;
  let lastLoopFrames: number | undefined = undefined;
  /* Same gating pattern as `lastLoopFrames` but for the
     `refreshTick` config field — the canvas observes the tick on
     every draw and re-builds particles whenever it advances. */
  let lastRefreshTick: number | undefined = undefined;
  // Total length of one freq-pair cycle: CYCLES_BEFORE_FADE inner loops of
  // full visibility + FADE_OUT_LOOPS inner loops to remove particles one
  // at a time. Recomputed in buildParticles.
  let macroLoopFrames = 0;
  // One-shot guard so the loop-complete event only fires once per macro cycle.
  let cycleFinishedFired = false;

  const getConfig = (): GlobalConfig => globalThis.__shapeOfTimeConfig ?? {};

  const buildParticles = () => {
    cx = p.width / 2;
    cy = p.height / 2;
    const size = Math.min(p.width, p.height);
    ampMax = size * AMP_RATIO;
    // xScale stretches the curve horizontally. On desktop the curve
    // spans edge to edge in x (`xScale = (p.width / 2) / ampMax`).
    // On mobile we multiply through by `AMP_RATIO_X_MOBILE` so the
    // figure is pulled in slightly from the screen edges instead of
    // brushing them — same shape, just with a small horizontal
    // breathing margin.
    const widthForX =
      p.width <= MOBILE_BREAKPOINT
        ? p.width * AMP_RATIO_X_MOBILE
        : p.width * AMP_RATIO_X_DESKTOP;
    xScale = ampMax > 0 ? widthForX / 2 / ampMax : 1;
    // yScale: was `(p.height / 2) / ampMax`, which stretched the
    // figure to fill the full viewport height in both axes — fine on
    // landscape viewports but pulled the lissajous TALL on portrait
    // phones (a 400×800 viewport gave `yScale = 2.5` while
    // `xScale = 1.25`, so the figure rendered 2x stretched
    // vertically). On mobile we now derive the vertical pixel extent
    // directly from the viewport height via `AMP_RATIO_Y_MOBILE` —
    // setting it equal to `AMP_RATIO` balances the axes; tune
    // higher / lower from there to shape the figure. Desktop keeps
    // the original "stretch to fill" behavior.
    const isMobile = p.width <= MOBILE_BREAKPOINT;
    if (ampMax > 0) {
      const ampMaxY = isMobile
        ? p.height * AMP_RATIO_Y_MOBILE
        : p.height * AMP_RATIO_Y_DESKTOP;
      yScale = ampMaxY / 2 / ampMax;
    } else {
      yScale = 1;
    }

    const cfg = getConfig();
    if (cfg.loopFrames && cfg.loopFrames > 0) {
      freqA = cfg.forcedFreqA ?? LOOP_FREQ_A;
      freqB = cfg.forcedFreqB ?? LOOP_FREQ_B;
    } else if (cfg.forcedFreqA && cfg.forcedFreqB) {
      freqA = cfg.forcedFreqA;
      freqB = cfg.forcedFreqB;
    } else {
      /* `ascending: isMobile` constrains mobile pairs to ones where the
         second frequency is larger than the first. The lissajous's
         second frequency drives the y-axis (via `freqA * particle.angle`
         in the sin term used for `y`) — pinning b > a so the y-axis
         carries the more complex frequency makes the figures read as
         intentionally tall against the portrait viewport, instead of
         randomly looking cramped when a > b. */
      [freqA, freqB] = pickFreqPair(isMobile);
    }
    const gcd = calculateGCD(freqA, freqB);
    theta = (2 * Math.PI) / gcd;

    // Reference pair is 1:2 (sum = 3); higher-sum ratios get a smaller step
    // so the on-curve dot spacing stays roughly constant.
    const REF_FREQ_SUM = 3;
    /* `MOBILE_AMP_STEP_FACTOR` densifies the on-curve dots on small
       viewports to compensate for the larger `yScale` introduced by
       `AMP_RATIO_Y_MOBILE`. Without it the curve reads visibly
       sparse on phones because the same particle count is being
       stretched over ~2× the vertical pixel range.
       (Reuses the `isMobile` already declared above in the yScale
       branch so this stays in sync with the yScale calc.) */
    const baseAmpStep =
      (cfg.autoDensity
        ? (AMP_STEP * REF_FREQ_SUM) / (freqA + freqB)
        : AMP_STEP) * (isMobile ? MOBILE_AMP_STEP_FACTOR : 1);

    /* Period-based density boost. The lissajous period (seconds) is
       `(theta / angleAdder) / FRAME_RATE`. When `cfg.loopFrames` is
       set, the angle stepping accelerates and the period becomes
       `cfg.loopFrames / FRAME_RATE`; otherwise it's the natural
       `theta / ANGLE_ADDER / FRAME_RATE`. Larger periods get a boost
       (`< 1`), shorter ones are left alone. */
    const periodAngleAdder =
      cfg.loopFrames && cfg.loopFrames > 0
        ? theta / cfg.loopFrames
        : ANGLE_ADDER;
    const periodSec = theta / periodAngleAdder / FRAME_RATE;
    const densityBoost = Math.min(1, REF_PERIOD_SEC / periodSec);
    const ampStep = baseAmpStep * densityBoost;

    // Phase A: CYCLES_BEFORE_FADE inner loops with everything visible.
    // Phase B: FADE_OUT_LOOPS inner loops where particles are removed one
    // at a time — outermost first, centermost last.
    const baseLoopFrames = cfg.loopFrames ?? 720;
    const phaseAEndFrame = CYCLES_BEFORE_FADE * baseLoopFrames;
    const fadeOutFrames = FADE_OUT_LOOPS * baseLoopFrames;
    macroLoopFrames = phaseAEndFrame + fadeOutFrames;

    particles = [];
    for (let i = 0; i <= ampMax; i += ampStep) {
      const t = i / ampMax;
      const alpha = t < 0.5
        ? Math.floor(70 + (t / 0.5) * (255 - 70))
        : Math.floor(255 - ((t - 0.5) / 0.5) * (255 - 70));
      // Reverse-order removal: t=1 (outer) gets removalNorm=0 (removed at
      // start of fade-out); t=0 (center) gets removalNorm=1 (removed at
      // end of fade-out).
      const removalNorm = 1 - t;
      const removedAtFrame =
        phaseAEndFrame + Math.floor(removalNorm * fadeOutFrames);
      particles.push({
        amp: i,
        angle: t * theta,
        alpha,
        initialAmp: i,
        initialAngle: t * theta,
        removedAtFrame,
      });
    }
    frameInLoop = 0;
    cycleFinishedFired = false;
    lastLoopFrames = cfg.loopFrames;
  };

  const desiredCanvasSize = (): [number, number] => {
    const cfg = getConfig();
    if (cfg.square) {
      // Batch-record / square mode keeps using the viewport min so a
      // recorder gets a fixed-size square canvas regardless of where
      // the wrapper happens to sit on the page.
      const s = Math.min(window.innerWidth, window.innerHeight);
      return [s, s];
    }
    // Track the PARENT (.piece-sketch wrapper) instead of the viewport.
    // The wrapper is `calc(100dvh - 1rem - 56px)` on desktop under the
    // `below-nav` pattern (and on the standalone shape-of-time desktop
    // route), while the viewport itself is `100dvh`. Sizing the canvas
    // to the viewport made it overflow the wrapper by `1rem + 56px` at
    // the bottom; the wrapper's `overflow: hidden` then clipped the
    // overflow, while the drawing centered in the canvas (cy =
    // p.height/2) landed 36px below the visible vertical center.
    // Reading `_userNode.clientWidth/clientHeight` matches the wrapper
    // exactly so the drawing's center coincides with the visible
    // wrapper's center.
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
    const [w, h] = desiredCanvasSize();
    p.createCanvas(w, h);
    p.frameRate(24);
    buildParticles();
    p.background(0);
  };

  p.windowResized = () => {
    const [w, h] = desiredCanvasSize();
    p.resizeCanvas(w, h);
    buildParticles();
    p.background(0);
  };

  p.draw = () => {
    p.noStroke();
    p.fill(0, 0, 0, FEEDBACK_ALPHA);
    p.rect(0, 0, p.width, p.height);

    const cfg = getConfig();
    const loopFrames = cfg.loopFrames;
    const forcedA = cfg.forcedFreqA;
    const forcedB = cfg.forcedFreqB;
    /* `refreshTick` lets external UI request an immediate re-roll —
       bumping the tick triggers `buildParticles()` (which picks a
       new pair via `pickFreqPair`) + a background clear, identical
       to what would happen at the natural macro-loop boundary. */
    const refreshTick = cfg.refreshTick;
    if (
      loopFrames !== lastLoopFrames ||
      (forcedA !== undefined && forcedA !== freqA) ||
      (forcedB !== undefined && forcedB !== freqB) ||
      (refreshTick !== undefined && refreshTick !== lastRefreshTick)
    ) {
      buildParticles();
      p.background(0);
      lastRefreshTick = refreshTick;
    }

    let angleAdder = ANGLE_ADDER;
    let ampDecay = AMP_DECAY;
    if (loopFrames && loopFrames > 0) {
      angleAdder = theta / loopFrames;
      ampDecay = ampMax / loopFrames;
    }

    const drawing = cfg.drawing !== false;
    for (const particle of particles) {
      particle.angle += angleAdder;
      if (particle.angle > theta) particle.angle -= theta;
      particle.amp -= ampDecay;
      if (particle.amp < 0) particle.amp += ampMax;

      if (!drawing) continue;
      // Past its fade-out slot — stop drawing this particle.
      if (frameInLoop >= particle.removedAtFrame) continue;
      // Rotated 90°: swap which freq controls which axis (freqB now
      // drives x, freqA drives y) and flip y's sign. xScale/yScale
      // stay tied to their viewport axis so the rotated figure still
      // spans the full width and height.
      const x =
        cx - particle.amp * xScale * Math.sin(freqB * particle.angle);
      const y =
        cy + particle.amp * yScale * Math.sin(freqA * particle.angle);
      p.fill(WAVE_PURPLE.r, WAVE_PURPLE.g, WAVE_PURPLE.b, particle.alpha);
      p.circle(x, y, PARTICLE_DIAMETER);
    }

    /* Bottom-center ratio + period label removed per request — the
       refresh chip in the chrome (see `ShapeOfTimeWithRefresh.tsx`)
       takes over as the user-facing affordance for "show me a
       different pair". */

    if (loopFrames && loopFrames > 0) {
      frameInLoop++;
      // Per-frame hook for frame-perfect capture — fires after the canvas
      // has been updated with this frame's draw, so a recorder can call
      // `track.requestFrame()` synchronously and lock the WebM to the
      // sketch's frame count.
      if (typeof globalThis.__shapeOfTimeOnFrame === "function") {
        try {
          globalThis.__shapeOfTimeOnFrame(frameInLoop);
        } catch {
          /* swallow consumer errors */
        }
      }
      // Fire shape-of-time-loop-complete once when the full macro cycle
      // (Phase A + fade-out) has elapsed. ShapeOfTime picks the next
      // coprime pair, the freq mismatch in this same draw loop triggers
      // buildParticles + a fresh p.background, and the new cycle begins.
      if (frameInLoop >= macroLoopFrames && !cycleFinishedFired) {
        cycleFinishedFired = true;
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("shape-of-time-loop-complete"));
        }
      }
    }
  };
};

type CanvasProps = {
  isActive?: boolean;
  loopFrames?: number;
  forcedFreqA?: number;
  forcedFreqB?: number;
  square?: boolean;
  autoDensity?: boolean;
  drawing?: boolean;
  /** Forwarded by the `Sketch` primitive so the canvas container can
   *  match the `.piece-sketch` wrapper instead of hardcoding `100dvh`.
   *  Used in the carousel where the wrapper is `calc(100dvh - 1rem -
   *  56px)` (the `below-nav` canvas-fit pattern) — without respecting
   *  `inFlow`, the 100dvh container overflows the wrapper by 72px at
   *  the bottom (clipped by the wrapper's `overflow: hidden`), and the
   *  drawing centered in the canvas ends up 36px below the visible
   *  center. */
  inFlow?: boolean;
};

export function ShapeOfTimeCanvas({
  isActive = true,
  loopFrames,
  forcedFreqA,
  forcedFreqB,
  square,
  autoDensity,
  drawing,
  inFlow = false,
}: CanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p5Ref = useRef<any>(null);
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;

  // Mirror the props into the global config so the running sketch picks
  // them up immediately.
  useEffect(() => {
    if (typeof window === "undefined") return;
    globalThis.__shapeOfTimeConfig = {
      loopFrames,
      forcedFreqA,
      forcedFreqB,
      square,
      autoDensity,
      drawing,
    };
  }, [loopFrames, forcedFreqA, forcedFreqB, square, autoDensity, drawing]);

  // Runtime hook so a batch recorder can swap freqs mid-run.
  useEffect(() => {
    const onSetFreqs = (e: Event) => {
      const detail = (e as CustomEvent<{ a: number; b: number }>).detail;
      if (!detail) return;
      globalThis.__shapeOfTimeConfig = {
        ...(globalThis.__shapeOfTimeConfig ?? {}),
        forcedFreqA: detail.a,
        forcedFreqB: detail.b,
      };
    };
    window.addEventListener(
      "shape-of-time-set-freqs",
      onSetFreqs as EventListener,
    );
    return () =>
      window.removeEventListener(
        "shape-of-time-set-freqs",
        onSetFreqs as EventListener,
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Seed config before the sketch starts reading.
    globalThis.__shapeOfTimeConfig = {
      loopFrames,
      forcedFreqA,
      forcedFreqB,
      square,
      autoDensity,
      drawing,
    };
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
        // `inFlow` from `Sketch` → match the `.piece-sketch` wrapper
        // (which is `calc(100dvh - 1rem - 56px)` in the carousel under
        // the `below-nav` pattern). Falling back to `100dvh` for the
        // standalone batch-record route where the canvas is the only
        // thing on the page and should fill the viewport.
        width: "100%",
        height: inFlow ? "100%" : "100dvh",
        background: "#000",
        overflow: "hidden",
        display: square ? "flex" : "block",
        alignItems: square ? "center" : undefined,
        justifyContent: square ? "center" : undefined,
      }}
    />
  );
}
