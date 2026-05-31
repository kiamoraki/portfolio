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
  const angleAdder = 0.013;
  const dot = 2;
  let angle = Math.PI / 3;

  p.setup = () => {
    const c = p.createCanvas(SIZE_W, SIZE_H);
    c.style("display", "block");
    c.style("width", "100%");
    c.style("height", "100%");
    p.frameRate(24);
  };

  p.draw = () => {
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
