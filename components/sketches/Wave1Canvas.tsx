"use client";

import { WaveCanvasShell } from "./WaveCanvasShell";
import { cellPos as cellPosOf, computeWaveLayout } from "./waveLayout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  // Layout values come from the shared helper so we can recompute on
  // every `windowResized` event — Safari's URL bar appearing/
  // disappearing changes `100dvh` and `window.innerHeight`, so the
  // cells need to re-square + re-distribute or they squish vertically.
  // The mutable `layout` reference is read by `cellPos()` and the
  // draw loop below; recompute mutates it in place and resizes the
  // p5 canvas pixel buffer to match.
  let layout = computeWaveLayout();
  const cellPos = (idx: number) => cellPosOf(layout, idx);
  const angleAdder = 0.013;
  const dot = 2;
  let angle = Math.PI / 3;

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
    // Destructure the latest layout values each frame so resize
    // updates take effect immediately (the layout reference is
    // mutated by `p.windowResized`).
    const { amp, cx, cy, isMobileLayout } = layout;
    angle += angleAdder;
    const a = angle + angleAdder;
    const s = Math.sin(a) * amp;
    const c1 = Math.cos(a) * amp;
    const s_pi = Math.sin(a + Math.PI) * amp;
    const s_pi2 = Math.sin(a + Math.PI / 2) * amp;
    const c_pi = Math.cos(a + Math.PI) * amp;
    const c_pi2 = Math.cos(a + Math.PI / 2) * amp;

    p.background(0);
    p.stroke(181, 136, 255, 200);
    p.noFill();
    p.strokeWeight(2);

    p.push();
    // Canvas resolution matches totalW/H, so centering is a no-op — but
    // leave the push/pop in place so existing relative translates work.
    p.translate(0, 0);

    // sq1
    p.push();
    {
      const [gx, gy] = cellPos(0);
      p.translate(gx, gy);
      p.circle(cx + s, cy + c1, dot);
      p.line(cx, cy, cx + s, cy + c1);
    }
    p.pop();

    // sq2
    p.push();
    {
      const [gx, gy] = cellPos(1);
      p.translate(gx, gy);
      p.circle(cx + c1, cy + s, dot);
      p.line(cx, cy, cx + c1, cy + s);
    }
    p.pop();

    // sq3
    p.push();
    {
      const [gx, gy] = cellPos(2);
      p.translate(gx, gy);
      p.circle(cx + c1, cy + c1, dot);
      p.line(cx, cy, cx + c1, cy + c1);
      p.circle(cx - s, cy + s, dot);
      p.line(cx, cy, cx - s, cy + s);
    }
    p.pop();

    // sq4
    p.push();
    {
      const [gx, gy] = cellPos(3);
      p.translate(gx, gy);
      const ox = cx - s,
        oy = cy + s;
      const tx = cx + s,
        ty = cy - s;
      p.circle(ox, oy, dot);
      p.circle(tx, ty, dot);
      p.line(ox, oy, tx, ty);
    }
    p.pop();

    // sq5
    p.push();
    {
      const [gx, gy] = cellPos(4);
      p.translate(gx, gy);
      p.circle(cx + c1, cy + c1, dot);
      p.line(cx, cy, cx + c1, cy + c1);
      p.circle(cx - c1, cy + c1, dot);
      p.line(cx, cy, cx - c1, cy + c1);
    }
    p.pop();

    // sq6
    p.push();
    {
      const [gx, gy] = cellPos(5);
      p.translate(gx, gy);
      for (let i = 0; i < 6; i++) {
        const intv = (2 * Math.PI) / 6;
        const sn = Math.sin(a + intv * i) * amp;
        p.circle(cx + sn, cy - sn, dot);
        p.circle(cx + sn, cy + sn, dot);
        p.line(cx + sn, cy - sn, cx + sn, cy + sn);
      }
    }
    p.pop();

    // sq7
    p.push();
    {
      const [gx, gy] = cellPos(6);
      p.translate(gx, gy);
      const ox = cx + c_pi2,
        oy = cy + c_pi2;
      const tx = cx - c1,
        ty = cy + c1;
      p.circle(ox, oy, dot);
      p.circle(tx, ty, dot);
      p.line(ox, oy, tx, ty);
    }
    p.pop();

    // sq8
    p.push();
    {
      const [gx, gy] = cellPos(7);
      p.translate(gx, gy);
      const ox = cx - s,
        oy = cy + s;
      const tx = cx + s,
        ty = cy - s;
      p.circle(ox, oy, dot);
      p.circle(tx, ty, dot);
      p.line(ox, oy, tx, ty);
      const thx = cx + c1,
        thy = cy + c1;
      const frx = cx - c1,
        fry = cy - c1;
      p.circle(thx, thy, dot);
      p.circle(frx, fry, dot);
      p.line(thx, thy, frx, fry);
    }
    p.pop();

    // sq9
    if (!isMobileLayout) {
      p.push();
      {
        const [gx, gy] = cellPos(8);
        p.translate(gx, gy);
        const ox = cx + c_pi,
          oy = cy + c_pi2;
        const tx = cx + s_pi2,
          ty = cy + s_pi;
        p.circle(ox, oy, dot);
        p.circle(tx, ty, dot);
        p.line(ox, oy, tx, ty);

        const thx = cx + s_pi2,
          thy = cy - s_pi;
        const frx = cx - c_pi,
          fry = cy + c_pi2;
        p.circle(thx, thy, dot);
        p.circle(frx, fry, dot);
        p.line(thx, thy, frx, fry);

        const fix = cx - s_pi2,
          fiy = cy - s_pi;
        const six = cx + c_pi,
          siy = cy + c_pi2;
        p.circle(fix, fiy, dot);
        p.circle(six, siy, dot);
        p.line(fix, fiy, six, siy);
        p.line(fix, fiy, thx, thy);
      }
      p.pop();
    }

    p.pop();
  };
};

export function Wave1Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
