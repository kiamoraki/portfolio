"use client";

import { WaveCanvasShell } from "./WaveCanvasShell";
import { cellPos as cellPosOf, computeWaveLayout } from "./waveLayout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  // Shared layout — see waveLayout.ts. `p.windowResized` mutates
  // `layout` in place + resizes the canvas pixel buffer, so cells
  // stay square when Safari's URL bar toggles `100dvh`.
  let layout = computeWaveLayout();
  const cellPos = (idx: number) => cellPosOf(layout, idx);
  const angleAdder = 0.008;
  const angleAdder_001 = 0.001;
  const dot = 2;
  let angle = 0;

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

  p.draw = () => {
    const { amp, cx, cy, square, isMobileLayout } = layout;
    angle += angleAdder;
    const a = angle + angleAdder;

    p.background(0);
    p.noFill();
    p.strokeWeight(1.2);
    p.stroke(181, 136, 255, 200);

    p.push();
    // Canvas resolution matches totalW/H, so centering is a no-op — but
    // leave the push/pop in place so existing relative translates work.
    p.translate(0, 0);

    // sq1
    p.push();
    {
      const [gx, gy] = cellPos(0);
      p.translate(gx, gy);
      for (let i = 0; i < square; i += 10) {
        const ox = cx + Math.sin(angle + angleAdder * i) * amp;
        p.circle(ox, i, dot);
        const tx = cx + Math.cos(angle + angleAdder * i) * amp;
        p.circle(tx, i, dot);
        p.line(ox, i, tx, i);
      }
    }
    p.pop();

    // sq2
    p.push();
    {
      const [gx, gy] = cellPos(1);
      p.translate(gx, gy);
      for (let i = 0; i < square; i += 10) {
        const oy = cy + Math.sin(angle + angleAdder * i) * amp;
        p.circle(i, oy, dot);
        const ty = cy + Math.cos(angle + angleAdder * i) * amp;
        p.circle(i, ty, dot);
      }
    }
    p.pop();

    // sq3
    p.push();
    {
      const [gx, gy] = cellPos(2);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 6;
      for (let j = 0; j < 6; j++) {
        for (let i = 0; i < square; i += 10) {
          const ox = cx + Math.sin(angle + angleAdder * i + interval * j) * amp;
          p.circle(ox, i, dot);
        }
      }
    }
    p.pop();

    // sq4
    p.push();
    {
      const [gx, gy] = cellPos(3);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 20;
      for (let k = 0; k < 20; k++) {
        const ox = cx + Math.sin(angle + interval * k) * (amp - 10);
        const oy = cy + Math.cos(angle + interval * k) * (amp - 10);
        p.circle(ox, oy, dot);
      }
    }
    p.pop();

    // sq5
    p.push();
    {
      const [gx, gy] = cellPos(4);
      p.translate(gx, gy);
      const r = Math.abs(60 + Math.sin(a) * 20);
      for (let m = 0; m < 10; m++) {
        const ox = cx + Math.sin(a * m) * r;
        const oy = cy + Math.cos(a * m) * r;
        p.stroke(181, 136, 255, 200);
        p.circle(ox, oy, 4);
        const tx = ox + Math.sin(a * 10) * 10;
        const ty = oy + Math.cos(a * 10) * 10;
        p.stroke(255, 255, 255);
        p.circle(tx, ty, dot);
      }
      p.stroke(181, 136, 255, 200);
    }
    p.pop();

    // sq6
    p.push();
    {
      const [gx, gy] = cellPos(5);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 10;
      for (let k = 0; k < 10; k++) {
        const ang = angle + interval * k;
        const o1x = cx + Math.sin(ang) * (amp - 20);
        const o1y = cy + Math.cos(ang) * (amp - 20);
        p.circle(o1x, o1y, dot);
        const o2x = cx + Math.cos(ang) * (amp - 40);
        const o2y = cy + Math.sin(ang) * (amp - 40);
        p.circle(o2x, o2y, dot);
        const o3x = cx + Math.sin(ang) * (amp - 60);
        const o3y = cy + Math.cos(ang) * (amp - 60);
        p.circle(o3x, o3y, dot);
      }
    }
    p.pop();

    // sq7
    p.push();
    {
      const [gx, gy] = cellPos(6);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 12;
      for (let b = 0; b < 6; b++) {
        const aa = angle + angleAdder_001 + interval * b;
        const fx = cx + Math.cos(aa) * amp;
        const fy = cy + Math.cos(aa) * amp;
        const sx = cx + Math.cos(aa) * amp;
        const sy = cy - Math.cos(aa) * amp;
        // OF code swaps x/y on the second circle in line draw, replicate
        p.circle(sy, sx, 1);
        p.circle(fx, fy, 1);
        p.line(fx, fy, sy, sx);
      }
    }
    p.pop();

    // sq8
    p.push();
    {
      const [gx, gy] = cellPos(7);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 2;
      for (let cc = 0; cc < 10; cc++) {
        for (let aIdx = 0; aIdx < 2; aIdx++) {
          const aa = a + Math.PI / 4 + interval * aIdx;
          const ox = cx - Math.cos(aa) * amp;
          const oy = cy - Math.sin(aa) * amp;
          p.circle(ox, oy, dot);

          const bb = angleAdder + interval * aIdx;
          const tx = cx - Math.sin(bb) * (Math.sin(angle) * amp);
          const ty = cy + Math.cos(bb) * (Math.sin(angle) * amp);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
    }
    p.pop();

    // sq9
    if (!isMobileLayout) {
      p.push();
      {
        const [gx, gy] = cellPos(8);
        p.translate(gx, gy);
        const interval = (2 * Math.PI) / 8;
        for (let i = 0; i < 8; i++) {
          const ox = cx - Math.sin(a + Math.PI / 2 + interval * i) * amp;
          const oy = cy - Math.cos(a + Math.PI / 2 + interval * i) * amp;
          p.circle(ox, oy, dot);

          const tx = cx - Math.sin(a + interval * i) * amp;
          const ty = cy + Math.cos(a + interval * i) * amp;
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);

          const thx = cx + Math.sin(a + Math.PI / 2 + interval * i) * amp;
          const thy = cy + Math.cos(a + Math.PI / 2 + interval * i) * amp;
          p.circle(thx, thy, dot);

          const frx = cx - Math.sin(a + interval * i) * amp;
          const fry = cy + Math.cos(a + interval * i) * amp;
          p.circle(frx, fry, dot);
          p.line(frx, fry, thx, thy);
        }
      }
      p.pop();
    }

    p.pop();
  };
};

export function Wave2Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
