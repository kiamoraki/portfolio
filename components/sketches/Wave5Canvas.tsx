"use client";

import { WaveCanvasShell } from "./WaveCanvasShell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  // Layout — 3×3 on desktop, 2×4 stacked on mobile so each cell can
  // be larger and the grid fits a portrait viewport (sq9 dropped on
  // mobile). On mobile the canvas matches the viewport pixel-for-
  // pixel so cells render perfectly square (no DOM scaling
  // distortion) and the leftover space on each axis distributes as
  // equal outer-margin + inner-gap.
  const isMobileLayout =
    typeof window !== "undefined" && window.innerWidth <= 720;
  const COLS = isMobileLayout ? 2 : 3;
  const ROWS = isMobileLayout ? 4 : 3;
  const SIZE_W =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerWidth)
      : 700;
  const SIZE_H =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerHeight)
      : 700;
  // Cell side — 92% of the tighter axis so each axis always has at
  // least ~8% left over for gaps. Desktop keeps the legacy 225 cell.
  const square = isMobileLayout
    ? Math.floor(Math.min(SIZE_W / COLS, SIZE_H / ROWS) * 0.92)
    : 225;
  const amp = square / 2;
  const cx = square / 2;
  const cy = square / 2;
  // Even gap distribution: (COLS+1) slots on x (one left margin,
  // COLS-1 inner gaps, one right margin), (ROWS+1) on y.
  const gap_x = isMobileLayout
    ? (SIZE_W - COLS * square) / (COLS + 1)
    : 4;
  const gap_y = isMobileLayout
    ? (SIZE_H - ROWS * square) / (ROWS + 1)
    : 4;
  const cellPos = (idx: number): [number, number] => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    return [
      gap_x + col * (square + gap_x),
      gap_y + row * (square + gap_y),
    ];
  };
  const angleAdder = 0.008;
  const angleAdder_2 = 0.016;
  const dot = 2;
  let angle = 0;
  let angle2 = 0;

  p.setup = () => {
    const c = p.createCanvas(SIZE_W, SIZE_H);
    c.style("display", "block");
    c.style("width", "100%");
    c.style("height", "100%");
    p.frameRate(24);
  };

  p.draw = () => {
    angle += angleAdder;
    angle2 += angleAdder_2;
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

    // sq1
    p.push();
    {
      const [gx, gy] = cellPos(0);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 80;
      for (let k = 0; k < 50; k++) {
        let r = Math.cos((5 * a + interval * k) / 3) * (amp - 20);
        const ox = cx + r * Math.sin(a + interval * k);
        const oy = cy + r * Math.cos(a + interval * k);
        p.circle(ox, oy, dot);

        r = Math.sin((5 * a + (interval * k + Math.PI * 2)) / 3) * (amp - 20);
        const tx1 = cx + r * Math.sin(a + interval * k);
        const ty1 = cy + r * Math.cos(a + interval * k);
        p.circle(tx1, ty1, dot);

        r = Math.sin((5 * a + (interval * k + Math.PI * 6)) / 3) * (amp - 20);
        const tx2 = cx + r * Math.sin(a + interval * k);
        const ty2 = cy + r * Math.cos(a + interval * k);
        p.circle(tx2, ty2, dot);

        p.line(ox, oy, tx2, ty2);
      }
    }
    p.pop();

    // sq2
    p.push();
    {
      const [gx, gy] = cellPos(1);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 80;
      for (let k = 0; k < 30; k++) {
        const r = Math.cos((5 * (a + interval * k)) / 3);
        const ox = cx + r * Math.sin(a + interval * k) * amp;
        const oy = cy + r * Math.cos(a + interval * k) * amp;
        p.circle(ox, oy, dot);
        const tx = cx + r * Math.sin(a + interval * (k + 10)) * amp;
        const ty = cy + r * Math.cos(a + interval * (k + 10)) * amp;
        p.circle(tx, ty, dot);
        p.line(ox, oy, tx, ty);
      }
    }
    p.pop();

    // sq3
    p.push();
    {
      const [gx, gy] = cellPos(2);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 50;
      p.beginShape();
      for (let hi = 0; hi < 50; hi++) {
        const ox = cx + 2 + Math.sin(angle2 + interval * hi) * 40 * Math.sin(angle2) * 1.5;
        const oy = cy + 2 + Math.cos(angle2 + interval * hi) * 55 * Math.cos(angle2) * 1.5;
        const tx = cx + 2 + Math.sin(angle2 + interval * hi) * 55;
        const ty = cy + 2 + Math.cos(angle2 + interval * hi) * 55;
        p.vertex(ox, oy);
        p.vertex(tx, ty);
        p.circle(ox, oy, dot);
        p.circle(tx, ty, dot);
      }
      p.endShape();
    }
    p.pop();

    // sq4
    p.push();
    {
      const [gx, gy] = cellPos(3);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 200;
      const interval_2 = (2 * Math.PI) / 4;
      for (let l = 0; l < 2 * Math.PI; l += interval_2) {
        for (let g = 0; g < 400; g += 5) {
          const r = Math.cos((2 * (a + interval * g + l)) / 5) * (amp - 10);
          const ox = cx + r * Math.sin(a + interval * g);
          const oy = cy + r * Math.cos(a + interval * g);
          p.circle(ox, oy, dot);
        }
      }
    }
    p.pop();

    // sq5
    p.push();
    {
      const [gx, gy] = cellPos(4);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 100;
      for (let g = 0; g < 500; g++) {
        const r = Math.cos((1 * (a + interval * g)) / 3) * (amp - 10);
        const ox = cx + r * Math.sin(a + interval * g);
        const oy = cy + r * Math.cos(a + interval * g);
        p.circle(ox, oy, dot);
        const q = Math.sin((2 * (a + interval * g)) / 4) * (amp - 10);
        const tx = cx + q * Math.cos(a + interval * g);
        const ty = cy + q * Math.sin(a + interval * g);
        p.circle(tx, ty, dot);
      }
    }
    p.pop();

    // sq6
    p.push();
    {
      const [gx, gy] = cellPos(5);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 80;
      for (let k = 0; k < 1000; k += 2) {
        const r = Math.cos((5 * a + interval * k) / 3) * (amp - 10);
        const ox = cx + r * Math.sin(a + interval * k);
        const oy = cy + r * Math.cos(a + interval * k);
        p.circle(ox, oy, dot);
        const tx = cx + r * Math.sin(a + interval * (1000 - k));
        const ty = cy + r * Math.cos(a + interval * (1000 - k));
        p.circle(tx, ty, dot);
      }
    }
    p.pop();

    // sq7
    p.push();
    {
      const [gx, gy] = cellPos(6);
      p.translate(gx, gy);
      const interval_2 = (2 * Math.PI) / 20;
      const interval = (2 * Math.PI) / 4;
      p.beginShape();
      for (let k = 0; k < 4; k++) {
        const r = Math.cos((5 * (a + interval_2 * k)) / 3) * amp;
        for (let m = 0; m < 2; m++) {
          const ox = cx + r * Math.sin(a + interval * m);
          const oy = cy + r * Math.cos(a + interval * k);
          p.circle(ox, oy, dot);
          p.vertex(ox, oy);
        }
      }
      p.endShape();
    }
    p.pop();

    // sq8
    p.push();
    {
      const [gx, gy] = cellPos(7);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 6;
      const interval_2 = 0;
      p.beginShape();
      for (let k = 0; k < 10; k += 2) {
        for (let v = 0; v < 6; v++) {
          const r = Math.cos((5 * a + interval * k) / 3) * amp;
          const ox = cx + r * Math.sin(a + interval * k + interval_2 * v);
          const oy = cy + r * Math.cos(a + interval * k + interval_2 * v);
          p.circle(ox, oy, dot);

          const tx = cx + r * Math.sin(a + interval * (k + 2) + interval_2 * v);
          const ty = cy + r * Math.cos(a + interval * (k + 2) + interval_2 * v);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);

          p.vertex(ox, oy);
          p.vertex(tx, ty);
        }
      }
      const closeX = cx + Math.cos((5 * a) / 3) * amp * Math.sin(a);
      const closeY = cx + Math.cos((5 * a) / 3) * amp * Math.cos(a);
      p.vertex(closeX, closeY);
      p.endShape();
    }
    p.pop();

    // sq9
    if (!isMobileLayout) {
      p.push();
      {
        const [gx, gy] = cellPos(8);
        p.translate(gx, gy);
        const interval_2 = (2 * Math.PI) / 20;
        const interval = (2 * Math.PI) / 4;
        p.beginShape();
        for (let k = 0; k < 10; k++) {
          const r = Math.cos((5 * (a + interval_2 * k)) / 3) * amp;
          for (let m = 0; m < 2; m++) {
            const ox = cx + r * Math.sin(a + interval * m);
            const oy = cy + r * Math.cos(a + interval * k);
            p.circle(ox, oy, dot);
            p.vertex(ox, oy);
          }
        }
        const closeX = cx + Math.cos((5 * a) / 3) * amp * Math.sin(a);
        const closeY = cx + Math.cos((5 * a) / 3) * amp * Math.cos(a);
        p.vertex(closeX, closeY);
        p.endShape();
      }
      p.pop();
    }

    p.pop();
  };
};

export function Wave5Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
