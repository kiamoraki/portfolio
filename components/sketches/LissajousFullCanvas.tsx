"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef, type MutableRefObject } from "react";

// MORPH_FRAMES drives the continuous pair-to-pair interpolation that
// replaces the old fade-out / pick-new / fade-in cycle. ~90 frames at
// 29fps ≈ 3s per transition. HOLD_FRAMES sits on each pair before the
// next morph so the total cadence (HOLD + MORPH ≈ 200 frames) matches
// the old fade cycle (PCT_INCREMENT 0.01 → 200-frame round trip).
const HOLD_FRAMES = 110;
const MORPH_FRAMES = 90;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const SIZE_MIN = 2;
const SIZE_MAX = 15;
const SIZE_MID = (SIZE_MIN + SIZE_MAX) / 2;
const SIZE_AMP = (SIZE_MAX - SIZE_MIN) / 2;
const SIZE_WAVE_SPEED = 0.05;
const SIZE_PERIODS = 2;
const ALPHA_PEAK = 160;
// Floor for the fade dip during a morph — particles still read clearly
// at this opacity, so the curve never disappears, just softens.
const ALPHA_MIN = 60;
const COLOR_PHASE_OFFSET = Math.PI;
// Matches the grid slide's outermost-dot radius. Mobile gets a slight
// bump from the desktop 0.38 so the curves don't look tiny in the
// stacked mobile cell, but stays smaller than the grid (which is at 0.95)
// so this drawing doesn't dominate.
const AMP_RATIO_DESKTOP = 0.38;
// Visible diameter = 2·amp. AMP_RATIO 0.38 = curve diameter ≈ 76% of
// the viewport min axis so the curve has comfortable breathing room
// inside the carousel slide.
const AMP_RATIO_MOBILE = 0.38;
const ampRatio = () =>
  typeof window !== "undefined" && window.innerWidth <= 720
    ? AMP_RATIO_MOBILE
    : AMP_RATIO_DESKTOP;

function gcdOf(a: number, b: number): number {
  let x = Math.abs(a) || 1;
  let y = Math.abs(b) || 1;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

const pickFreq = () => 1 + Math.floor(Math.random() * 11);
const pickFreqPair = (): [number, number] => {
  const a = pickFreq();
  let b = pickFreq();
  while (a === b) b = pickFreq();
  return [a, b];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  // Current and next pair — particles are always interpolating between
  // them. When morphProgress hits 1, current becomes next and a fresh
  // next pair is picked, no pause.
  let [freqA, freqB] = pickFreqPair();
  let [freqANext, freqBNext] = pickFreqPair();
  while (freqANext === freqA && freqBNext === freqB) {
    [freqANext, freqBNext] = pickFreqPair();
  }
  let angleAdder = 0.04;

  // Continuous (unbounded) dual angles — kept lightly bounded with the
  // % wrap below to avoid floating-point drift over long runs.
  let angle = 0;
  let blueAngle = 0;
  // morphProgress is negative during the hold phase, 0..1 during the
  // morph itself. Encoding hold this way keeps the state machine
  // one variable instead of two.
  let morphProgress = -HOLD_FRAMES / MORPH_FRAMES;
  let amp = 200;
  let sizeWaveOffset = 0;

  const pickNext = () => {
    let [a, b] = pickFreqPair();
    let safety = 0;
    while (a === freqA && b === freqB && safety++ < 20) {
      [a, b] = pickFreqPair();
    }
    freqANext = a;
    freqBNext = b;
  };

  const dims = (): [number, number] => {
    // p._userNode is set by `new P5(sketch, container)` BEFORE p.setup
    // runs — so we can read the wrapper div's size right when the
    // canvas is first created (otherwise the canvas would default to
    // the non-square window viewport).
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
    p.frameRate(29);
    amp =
      (typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height)) * ampRatio();
  };

  p.windowResized = () => {
    const [cw, ch] = dims();
    p.resizeCanvas(cw, ch);
    amp =
      (typeof window !== "undefined"
        ? Math.min(window.innerWidth, window.innerHeight)
        : Math.min(p.width, p.height)) * ampRatio();
  };

  p.draw = () => {
    const ctx = p.drawingContext;
    const cnv = p.canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#130c12";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.restore();

    // Dual unbounded angle accumulators — bounded modulo a large value
    // so float precision stays clean over very long runs. The previous
    // version reset to 0 each period; with continuous interpolation we
    // want unbroken motion across pair transitions.
    angle += angleAdder;
    blueAngle -= angleAdder;
    if (angle > 7200) angle -= 7200;
    if (blueAngle < -7200) blueAngle += 7200;

    // Advance the morph counter. Negative values = holding on the
    // current pair (tEased clamps to 0); 0..1 = interpolating to next;
    // ≥ 1 = arrived — rollover, pick a new next pair, restart hold.
    morphProgress += 1 / MORPH_FRAMES;
    if (morphProgress >= 1) {
      morphProgress = -HOLD_FRAMES / MORPH_FRAMES;
      freqA = freqANext;
      freqB = freqBNext;
      pickNext();
    }
    const tEased =
      morphProgress <= 0 ? 0 : easeInOutCubic(morphProgress);

    // Alpha dips through the morph (full opacity at the endpoints, dips
    // to ALPHA_MIN at the midpoint) so the transition reads as a soft
    // fade-out / fade-in without ever disappearing. During the hold
    // phase (morphProgress < 0) alpha is pinned at ALPHA_PEAK.
    const morphPhase = morphProgress <= 0 ? 0 : morphProgress;
    const alpha =
      ALPHA_PEAK - (ALPHA_PEAK - ALPHA_MIN) * Math.sin(morphPhase * Math.PI);

    const thetaCurr = 360 / gcdOf(freqA, freqB);
    const thetaNext = 360 / gcdOf(freqANext, freqBNext);
    const cx = p.width / 2;
    const cy = p.height / 2;
    sizeWaveOffset += SIZE_WAVE_SPEED;
    // Size wave keyed to the current period so the per-particle size
    // distribution doesn't snap mid-morph. The next pair's size wave
    // simply isn't used (no fade-in/out means no need to balance).
    const phasePerStep = (SIZE_PERIODS * 2 * Math.PI) / thetaCurr;

    // Step adapts to current period so all curves draw roughly the same
    // total dots. Next-pair phases are scaled proportionally so each
    // particle has a unique morph trajectory.
    const step = Math.max(1, Math.round(thetaCurr / 90));

    p.noStroke();
    for (let i = 0; i < thetaCurr; i += step) {
      const iNext = (i / thetaCurr) * thetaNext;

      // Pink (forward angle) positions — current + next, then lerp.
      const pinkRadCurr = (Math.PI / 180) * (angle + i);
      const pinkRadNext = (Math.PI / 180) * (angle + iNext);
      const pinkCurrDx = cx + amp * Math.sin(freqA * pinkRadCurr);
      const pinkCurrDy = cy + amp * Math.sin(freqB * pinkRadCurr);
      const pinkNextDx = cx + amp * Math.sin(freqANext * pinkRadNext);
      const pinkNextDy = cy + amp * Math.sin(freqBNext * pinkRadNext);
      const pinkDx = pinkCurrDx + (pinkNextDx - pinkCurrDx) * tEased;
      const pinkDy = pinkCurrDy + (pinkNextDy - pinkCurrDy) * tEased;

      // Blue (backward angle) positions — same lerp.
      const blueRadCurr = (Math.PI / 180) * (blueAngle + i);
      const blueRadNext = (Math.PI / 180) * (blueAngle + iNext);
      const blueCurrDx = cx + amp * Math.sin(freqA * blueRadCurr);
      const blueCurrDy = cy + amp * Math.sin(freqB * blueRadCurr);
      const blueNextDx = cx + amp * Math.sin(freqANext * blueRadNext);
      const blueNextDy = cy + amp * Math.sin(freqBNext * blueRadNext);
      const blueDx = blueCurrDx + (blueNextDx - blueCurrDx) * tEased;
      const blueDy = blueCurrDy + (blueNextDy - blueCurrDy) * tEased;

      const blueRadius =
        SIZE_MID + SIZE_AMP * Math.sin(sizeWaveOffset + i * phasePerStep);
      const pinkRadius =
        SIZE_MID +
        SIZE_AMP *
          Math.sin(sizeWaveOffset + i * phasePerStep + COLOR_PHASE_OFFSET);
      const blueDiameter = blueRadius * 2;
      const pinkDiameter = pinkRadius * 2;

      // Full alpha throughout — no fade — so the shape always reads.
      p.fill(42, 88, 255, alpha);
      p.circle(blueDx, blueDy, blueDiameter);

      // Pink overlay drawn 5 times with overlapping modulo gates —
      // produces hot-pink hotspots where multiple conditions align.
      if (i % 2 === 0) {
        p.fill(255, 69, 230, alpha);
        p.circle(pinkDx, pinkDy, pinkDiameter);
      }
      if (i % 3 === 0) {
        p.fill(255, 69, 230, alpha);
        p.circle(pinkDx, pinkDy, pinkDiameter);
      }
      if (i % 4 === 0) {
        p.fill(255, 69, 230, alpha);
        p.circle(pinkDx, pinkDy, pinkDiameter);
      }
      if (i % 5 === 0) {
        p.fill(255, 69, 230, alpha);
        p.circle(pinkDx, pinkDy, pinkDiameter);
      }
      if (i % 6 === 0) {
        p.fill(255, 69, 230, alpha);
        p.circle(pinkDx, pinkDy, pinkDiameter);
      }
    }
  };
};

type CanvasProps = {
  isActive?: boolean;
  // When provided, the underlying HTMLCanvasElement is exposed via this ref
  // so a MirrorCanvas in a wrap-clone slot can copy pixels from it.
  canvasRef?: MutableRefObject<HTMLCanvasElement | null>;
  // When true, fill the parent container (height: 100%) instead of the
  // default fixed 100vh — used by mobile stacks that render each canvas
  // in a constrained square box.
  inFlow?: boolean;
};

export function LissajousFullCanvas({
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
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new P5(sketch as any, containerRef.current) as any;
      p5Ref.current = instance;
      if (canvasRef) canvasRef.current = instance.canvas as HTMLCanvasElement;
      // Honour the current isActive at the moment the sketch initializes,
      // so off-screen slides start paused instead of running for a frame.
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
      // Wait for the carousel transition to finish before freezing, so the
      // slide doesn't lock to a stale frame mid-slide.
      const timer = setTimeout(() => p5?.noLoop?.(), 550);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: inFlow ? "100%" : "100dvh",
        background: "#130c12",
        overflow: "hidden",
      }}
    />
  );
}
