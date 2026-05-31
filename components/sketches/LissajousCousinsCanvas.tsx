"use client";

import { useEffect, useRef } from "react";

// The "cousins" sketch: a single Lissajous figure that cycles through
// every (a, b) pair drawn from the coprime-to-20 family {1, 3, 7, 9}.
// All these pairs share the same x/y coordinate set on the 11×11
// sampling lattice (see LissajousLatticeCanvas), so morphing between
// consecutive pairs reshuffles the same dots — most of them just sit
// in place while a handful fly to different slots, making the shared
// point-cloud structure visceral.
const PROJECT_BLUE = { r: 42, g: 88, b: 255 };
const PROJECT_PINK = { r: 255, g: 69, b: 230 };
const NUM_DOTS = 20;
const HOLD_FRAMES = 36; // ~1.2s @ 30fps holding each formation
const MORPH_FRAMES = 60; // ~2s @ 30fps morphing between pairs

const COPRIME_FREQS = [1, 3, 7, 9];
const PAIRS: Array<[number, number]> = (() => {
  const list: Array<[number, number]> = [];
  for (const a of COPRIME_FREQS) {
    for (const b of COPRIME_FREQS) {
      if (a !== b) list.push([a, b]);
    }
  }
  return list;
})();

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  let cx = 0;
  let cy = 0;
  let amp = 0;
  let pairIdx = 0;
  let nextPairIdx = 1;
  let frameCounter = 0;
  let isMorphing = false;

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

    const [a1, b1] = PAIRS[pairIdx];
    const [a2, b2] = PAIRS[nextPairIdx];
    const tEased = isMorphing
      ? easeInOutCubic(frameCounter / MORPH_FRAMES)
      : 0;

    const dotR = Math.max(4, amp * 0.022);

    for (let k = 0; k < NUM_DOTS; k++) {
      const theta = (k * Math.PI) / 10;
      const x1 = Math.sin(a1 * theta) * amp;
      const y1 = Math.sin(b1 * theta) * amp;
      const x2 = Math.sin(a2 * theta) * amp;
      const y2 = Math.sin(b2 * theta) * amp;
      const xi = x1 + (x2 - x1) * tEased;
      const yi = y1 + (y2 - y1) * tEased;

      p.fill(PROJECT_BLUE.r, PROJECT_BLUE.g, PROJECT_BLUE.b);
      p.circle(cx + xi, cy + yi, dotR * 2);
      p.fill(PROJECT_PINK.r, PROJECT_PINK.g, PROJECT_PINK.b);
      p.circle(cx - xi, cy - yi, dotR * 2);
    }

    // Label: current pair, or "a:b → a':b'" during morph.
    p.fill(220, 220, 230, 230);
    p.textFont("monospace");
    p.textSize(Math.max(16, amp * 0.1));
    p.textAlign(p.CENTER, p.TOP);
    const label = isMorphing
      ? `${a1}:${b1}  →  ${a2}:${b2}`
      : `${a1}:${b1}`;
    p.text(label, cx, cy + amp + amp * 0.08);

    frameCounter++;
    if (isMorphing) {
      if (frameCounter >= MORPH_FRAMES) {
        pairIdx = nextPairIdx;
        isMorphing = false;
        frameCounter = 0;
      }
    } else if (frameCounter >= HOLD_FRAMES) {
      nextPairIdx = (pairIdx + 1) % PAIRS.length;
      isMorphing = true;
      frameCounter = 0;
    }
  };
};

type CanvasProps = { isActive?: boolean; inFlow?: boolean };

export function LissajousCousinsCanvas({
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
