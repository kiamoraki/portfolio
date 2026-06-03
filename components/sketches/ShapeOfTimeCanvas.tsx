"use client";

import { useEffect, useRef } from "react";

// Match the lavender/purple used across the wave project sketches.
const WAVE_PURPLE = { r: 181, g: 136, b: 255 };

const AMP_RATIO = 0.4;
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

const pickFreqPair = (): [number, number] => {
  let a = MIN_FREQ + Math.floor(Math.random() * (MAX_FREQ - MIN_FREQ + 1));
  let b = MIN_FREQ + Math.floor(Math.random() * (MAX_FREQ - MIN_FREQ + 1));
  while (a === b) {
    a = MIN_FREQ + Math.floor(Math.random() * (MAX_FREQ - MIN_FREQ + 1));
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
    // Stretch so the curve extends from edge to edge in BOTH axes:
    //   x extent = ampMax · xScale = p.width / 2  → xScale = (w/2)/ampMax
    //   y extent = ampMax · yScale = p.height / 2 → yScale = (h/2)/ampMax
    // Result: the figure spans the full viewport with no margins on
    // any side, regardless of viewport aspect ratio.
    xScale = ampMax > 0 ? p.width / 2 / ampMax : 1;
    yScale = ampMax > 0 ? p.height / 2 / ampMax : 1;

    const cfg = getConfig();
    if (cfg.loopFrames && cfg.loopFrames > 0) {
      freqA = cfg.forcedFreqA ?? LOOP_FREQ_A;
      freqB = cfg.forcedFreqB ?? LOOP_FREQ_B;
    } else if (cfg.forcedFreqA && cfg.forcedFreqB) {
      freqA = cfg.forcedFreqA;
      freqB = cfg.forcedFreqB;
    } else {
      [freqA, freqB] = pickFreqPair();
    }
    const gcd = calculateGCD(freqA, freqB);
    theta = (2 * Math.PI) / gcd;

    // Reference pair is 1:2 (sum = 3); higher-sum ratios get a smaller step
    // so the on-curve dot spacing stays roughly constant.
    const REF_FREQ_SUM = 3;
    const ampStep = cfg.autoDensity
      ? (AMP_STEP * REF_FREQ_SUM) / (freqA + freqB)
      : AMP_STEP;

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
      const s = Math.min(window.innerWidth, window.innerHeight);
      return [s, s];
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
    if (
      loopFrames !== lastLoopFrames ||
      (forcedA !== undefined && forcedA !== freqA) ||
      (forcedB !== undefined && forcedB !== freqB)
    ) {
      buildParticles();
      p.background(0);
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
};

export function ShapeOfTimeCanvas({
  isActive = true,
  loopFrames,
  forcedFreqA,
  forcedFreqB,
  square,
  autoDensity,
  drawing,
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
        width: "100%",
        height: "100dvh",
        background: "#000",
        overflow: "hidden",
        display: square ? "flex" : "block",
        alignItems: square ? "center" : undefined,
        justifyContent: square ? "center" : undefined,
      }}
    />
  );
}
