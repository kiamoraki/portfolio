"use client";

import { useEffect, useRef } from "react";

// Side-by-side (top/bottom on mobile) comparison: the same Lissajous
// pair rendered with numDots = 20 (aliased — collapses many distinct
// figures onto the same 11×11 lattice) and numDots = 200 (smooth,
// reveals the curve's true continuous form). Cycles through the
// coprime-to-20 cousin pairs so the collapse-vs-distinct contrast is
// obvious for figures that look identical when undersampled.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
const NUM_DOTS_ALIASED = 20;
const NUM_DOTS_SMOOTH = 200;
const HOLD_FRAMES = 90; // ~3s @ 30fps

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

const LINE_WEIGHT = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  let topCy = 0;
  let bottomCy = 0;
  let amp = 0;
  let rotation = 0;
  let pairIdx = 0;
  let frameCounter = 0;

  const dims = (): [number, number] => {
    if (typeof window !== "undefined") {
      return [window.innerWidth, window.innerHeight];
    }
    return [800, 800];
  };

  const recomputeSize = () => {
    cx = p.width / 2;
    const halfH = p.height / 2;
    // Push each curve slightly inward so its label sits in the gutter
    // between the two halves rather than right on top of the curve.
    topCy = halfH * 0.5;
    bottomCy = halfH + halfH * 0.5;
    // Amp must fit inside the half-height AND inside the canvas width,
    // with extra slack for the label below each curve.
    amp = Math.min(p.width * 0.42, halfH * 0.38);
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

    const [a, b] = PAIRS[pairIdx];
    // Slow drift on the global angle so both renderings are alive —
    // makes the aliased side's "snap" to lattice points obvious as
    // rotation moves and reveals identical clusters at each step.
    rotation += 0.004;

    // --- TOP: aliased (20 dots) ---
    const dotR = Math.max(4, amp * 0.025);
    for (let k = 0; k < NUM_DOTS_ALIASED; k++) {
      const theta = rotation + (k * 2 * Math.PI) / NUM_DOTS_ALIASED;
      const sa = Math.sin(a * theta) * amp;
      const sb = Math.sin(b * theta) * amp;
      p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
      p.circle(cx + sa, topCy + sb, dotR * 2);
      p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
      p.circle(cx - sa, topCy - sb, dotR * 2);
    }

    // --- BOTTOM: smooth (200-point closed path) ---
    p.noFill();
    p.strokeWeight(LINE_WEIGHT);
    p.stroke(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
    p.beginShape();
    for (let k = 0; k < NUM_DOTS_SMOOTH; k++) {
      const theta = rotation + (k * 2 * Math.PI) / NUM_DOTS_SMOOTH;
      const sa = Math.sin(a * theta) * amp;
      const sb = Math.sin(b * theta) * amp;
      p.vertex(cx + sa, bottomCy + sb);
    }
    p.endShape(p.CLOSE);
    p.stroke(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
    p.beginShape();
    for (let k = 0; k < NUM_DOTS_SMOOTH; k++) {
      const theta = rotation + (k * 2 * Math.PI) / NUM_DOTS_SMOOTH;
      const sa = Math.sin(a * theta) * amp;
      const sb = Math.sin(b * theta) * amp;
      p.vertex(cx - sa, bottomCy - sb);
    }
    p.endShape(p.CLOSE);
    p.noStroke();

    // --- Labels ---
    p.fill(220, 220, 230, 230);
    p.textFont("monospace");
    p.textAlign(p.CENTER, p.TOP);
    const labelSize = Math.max(12, amp * 0.08);
    p.textSize(labelSize);
    p.text("20 dots", cx, topCy + amp + amp * 0.05);
    p.text("200 dots", cx, bottomCy + amp + amp * 0.05);
    // Big pair label centered at the top.
    p.textSize(Math.max(20, amp * 0.14));
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${a}:${b}`, cx, topCy - amp - amp * 0.16);

    frameCounter++;
    if (frameCounter >= HOLD_FRAMES) {
      frameCounter = 0;
      pairIdx = (pairIdx + 1) % PAIRS.length;
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousAliasingCompareCanvas({
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
