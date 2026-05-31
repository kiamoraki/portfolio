"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShapeOfTimeCanvas } from "@/components/sketches/ShapeOfTimeCanvas";

// Defaults match the recording workflow: 720-frame seamless loop at 24fps
// with auto-density so high-ratio pairs look as dense as 1:2.
const DEFAULT_LOOP_FRAMES = 720;

// All coprime (a, b) pairs with 1 ≤ a < b ≤ 9 — the 27 visually distinct
// Lissajous shapes the sketch can produce.
function gcd(x: number, y: number): number {
  return y === 0 ? x : gcd(y, x % y);
}
const COPRIME_PAIRS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let a = 1; a <= 9; a++) {
    for (let b = a + 1; b <= 9; b++) {
      if (gcd(a, b) === 1) out.push([a, b]);
    }
  }
  return out;
})();

export function ShapeOfTime() {
  return (
    <Suspense fallback={null}>
      <ShapeOfTimeInner />
    </Suspense>
  );
}

function ShapeOfTimeInner() {
  const searchParams = useSearchParams();

  // ?loop=N overrides the default 720-frame cycle. Falsy turns it off
  // (random/non-loop mode).
  const loopFrames = useMemo(() => {
    const raw = searchParams?.get("loop");
    if (raw === null || raw === undefined) return DEFAULT_LOOP_FRAMES;
    if (raw === "0" || raw === "off") return undefined;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 60) return DEFAULT_LOOP_FRAMES;
    return Math.min(n, 10000);
  }, [searchParams]);

  // ?freqA=N&freqB=M pins the pair and disables the auto-cycle.
  const pinnedFreqs = useMemo(() => {
    const aRaw = searchParams?.get("freqA");
    const bRaw = searchParams?.get("freqB");
    if (!aRaw || !bRaw) return undefined;
    const a = parseInt(aRaw, 10);
    const b = parseInt(bRaw, 10);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;
    return [a, b] as [number, number];
  }, [searchParams]);

  // ?solo=1 strips page chrome and squares the canvas — used for recording.
  const solo = !!searchParams?.get("solo");
  // ?density=off disables autoDensity (defaults to on).
  const autoDensity = searchParams?.get("density") !== "off";

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (solo) {
      document.documentElement.classList.add("solo-mode");
      return () => document.documentElement.classList.remove("solo-mode");
    }
  }, [solo]);

  // Auto-cycle through the 27 ratios on each loop completion. Disabled
  // when freqs are pinned via URL or when loop mode is off.
  const [pairIndex, setPairIndex] = useState(() =>
    Math.floor(Math.random() * COPRIME_PAIRS.length),
  );
  const cycleEnabled = !pinnedFreqs && !!loopFrames;
  useEffect(() => {
    if (!cycleEnabled) return;
    const onLoopComplete = () => {
      setPairIndex((i) => {
        let next = Math.floor(Math.random() * COPRIME_PAIRS.length);
        if (next === i) next = (next + 1) % COPRIME_PAIRS.length;
        return next;
      });
    };
    window.addEventListener("shape-of-time-loop-complete", onLoopComplete);
    return () =>
      window.removeEventListener(
        "shape-of-time-loop-complete",
        onLoopComplete,
      );
  }, [cycleEnabled]);

  const [a, b] = pinnedFreqs ?? COPRIME_PAIRS[pairIndex];

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <ShapeOfTimeCanvas
        isActive
        loopFrames={loopFrames}
        forcedFreqA={a}
        forcedFreqB={b}
        square={solo}
        autoDensity={autoDensity}
      />
    </div>
  );
}
