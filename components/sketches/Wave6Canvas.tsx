"use client";

import { WaveCanvasShell } from "./WaveCanvasShell";
import { cellPos as cellPosOf, computeWaveLayout } from "./waveLayout";

// 9 polar-curve variants generated from the Wave5 third-row family
// (sq7/sq8/sq9 share `r = cos((5*(a + intK*k))/3) * amp` + vertex shapes).
// Each cell tweaks one or two parameters so all 9 look distinct.
type Variant = {
  kCount: number;
  kStep: number;
  mCount: number;
  intKDivisor: number;
  intMDivisor: number;
  closeWithTail: boolean;
  linkPairs: boolean;
  // Rotate the cell's local coordinate system (radians). PI/2 flips the
  // apparent motion axis from up/down to left/right.
  rotation?: number;
};

const VARIANTS: Variant[] = [
  { kCount: 4, kStep: 1, mCount: 2, intKDivisor: 20, intMDivisor: 4, closeWithTail: false, linkPairs: false }, // base sq7
  { kCount: 6, kStep: 1, mCount: 2, intKDivisor: 30, intMDivisor: 4, closeWithTail: false, linkPairs: false },
  { kCount: 10, kStep: 1, mCount: 2, intKDivisor: 20, intMDivisor: 4, closeWithTail: true,  linkPairs: false }, // base sq9
  { kCount: 8, kStep: 3, mCount: 3, intKDivisor: 16, intMDivisor: 3, closeWithTail: false, linkPairs: false },
  { kCount: 10, kStep: 2, mCount: 1, intKDivisor: 0,  intMDivisor: 6, closeWithTail: true,  linkPairs: true  }, // sq8-flavor
  { kCount: 3, kStep: 1, mCount: 1, intKDivisor: 24, intMDivisor: 4, closeWithTail: true,  linkPairs: false },
  { kCount: 5,  kStep: 1, mCount: 4, intKDivisor: 10, intMDivisor: 4, closeWithTail: false, linkPairs: false },
  { kCount: 7,  kStep: 1, mCount: 2, intKDivisor: 14, intMDivisor: 5, closeWithTail: true,  linkPairs: false },
  { kCount: 7, kStep: 2, mCount: 2, intKDivisor: 3, intMDivisor: 3, closeWithTail: false, linkPairs: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  // Shared layout — see waveLayout.ts. `p.windowResized` mutates
  // `layout` in place + resizes the canvas pixel buffer, so cells
  // stay square when Safari's URL bar toggles `100dvh`. drawVariant
  // closes over `layout` (not the individual values) so it always
  // reads the latest `cx`/`cy`.
  let layout = computeWaveLayout();
  const cellPos = (idx: number) => cellPosOf(layout, idx);
  const angleAdder = 0.008;
  const dot = 2;
  let angle = 0;

  // Random cardinal rotation per cell, picked once at mount.
  const ROTATIONS = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const cellRotations = Array.from(
    { length: 9 },
    () => ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)]
  );

  p.setup = () => {
    const c = p.createCanvas(layout.SIZE_W, layout.SIZE_H);
    c.style("display", "block");
    c.style("width", "100%");
    c.style("height", "100%");
    p.frameRate(24);
  };

  p.windowResized = () => {
    layout = computeWaveLayout();
    p.resizeCanvas(layout.SIZE_W, layout.SIZE_H);
  };

  const drawVariant = (v: Variant, a: number, amp: number) => {
    const { cx, cy } = layout;
    const intK = v.intKDivisor > 0 ? (2 * Math.PI) / v.intKDivisor : 0;
    const intM = (2 * Math.PI) / v.intMDivisor;
    p.beginShape();
    for (let k = 0; k < v.kCount; k += v.kStep) {
      const kPhase = v.intKDivisor > 0 ? intK : intM;
      const r = Math.cos((5 * (a + kPhase * k)) / 3) * amp;
      for (let m = 0; m < v.mCount; m++) {
        const ox = cx + r * Math.sin(a + intM * m);
        const oy = cy + r * Math.cos(a + intM * k);
        p.circle(ox, oy, dot);
        p.vertex(ox, oy);

        if (v.linkPairs && m + 1 < v.mCount) {
          const tx = cx + r * Math.sin(a + intM * (m + 1));
          const ty = cy + r * Math.cos(a + intM * k);
          p.line(ox, oy, tx, ty);
        }
      }
    }
    if (v.closeWithTail) {
      const closeX = cx + Math.cos((5 * a) / 3) * amp * Math.sin(a);
      const closeY = cx + Math.cos((5 * a) / 3) * amp * Math.cos(a);
      p.vertex(closeX, closeY);
    }
    p.endShape();
  };

  p.draw = () => {
    const { cx, cy, square, isMobileLayout } = layout;
    angle += angleAdder;
    const a = angle;
    const amp = square / 2;

    p.background(0);
    p.stroke(181, 136, 255, 200);
    p.noFill();
    p.strokeWeight(1);

    p.push();
    // Canvas resolution matches totalW/H, so centering is a no-op — but
    // leave the push/pop in place so existing relative translates work.
    p.translate(0, 0);

    // sq1..sq8 (sq9 dropped on mobile)
    const cellCount = isMobileLayout ? 8 : 9;
    for (let idx = 0; idx < cellCount; idx++) {
      // sq1..sq8 live in idx 0..7; sq9 (idx 8) is conditionally drawn below.
      if (idx === 8 && isMobileLayout) continue;
      const variant = VARIANTS[idx];
      const rot = cellRotations[idx];
      p.push();
      {
        const [gx, gy] = cellPos(idx);
        p.translate(gx, gy);
        if (rot) {
          p.translate(cx, cy);
          p.rotate(rot);
          p.translate(-cx, -cy);
        }
        drawVariant(variant, a, amp);
      }
      p.pop();
    }

    // sq9 marker for grep parity with the other Wave files; the gating
    // already happens via cellCount above.
    if (!isMobileLayout) {
      // (sq9 was drawn in the loop above; nothing to do here.)
    }

    p.pop();
  };
};

export function Wave6Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
