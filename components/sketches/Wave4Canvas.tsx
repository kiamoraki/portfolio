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
  const angleAdder_001 = 0.001;
  const dot = 2;
  let angle = 0;

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
      const interval = (2 * Math.PI) / 10;
      for (let xii = 0; xii < 20; xii++) {
        p.beginShape();
        for (let _xii = 0; _xii < 200; _xii += 10) {
          const radL = 40 + Math.sin(angle + angleAdder * _xii) * 10;
          const ang = 10 + angle + angleAdder_001 * _xii * xii + interval * xii;
          const sn = Math.sin(ang) * (radL - 10);
          const cn = Math.cos(ang) * (radL - 10);
          p.vertex(cy + cn, cx + sn);
        }
        p.endShape();
      }
    }
    p.pop();

    // sq2
    p.push();
    {
      const [gx, gy] = cellPos(1);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 20;
      for (let kkk = 0; kkk < 20; kkk++) {
        p.beginShape();
        for (let ttt = 0; ttt < 200; ttt += 10) {
          const radL = 40 + Math.sin(angle + angleAdder * ttt) * 27;
          const ang = 10 + angle + angleAdder_001 * ttt * kkk + interval * kkk;
          const sn = Math.sin(ang) * (100 - radL);
          const cn = Math.cos(ang) * (100 - radL);
          p.vertex(cy + cn, cx + sn);
        }
        p.endShape();
      }
    }
    p.pop();

    // sq3
    p.push();
    {
      const [gx, gy] = cellPos(2);
      p.translate(gx, gy);
      const increment = (2 * Math.PI) / 10;
      for (let xv = 0; xv < 40; xv++) {
        p.stroke(181, 136, 255, 200);
        p.beginShape();
        for (let xv2 = 0; xv2 < 100; xv2 += 10) {
          const radL = 40 + Math.sin(angle + angleAdder * xv2) * 45;
          const ang = 10 + angle + angleAdder_001 * xv2 * xv + increment * xv;
          const sn = Math.sin(ang) * radL;
          const cn = Math.cos(ang) * radL;
          p.vertex(cy + cn, cx + sn);
        }
        p.endShape();

        p.stroke(181, 136, 255, 100);
        p.beginShape();
        for (let xv3 = 0; xv3 < 300; xv3 += 10) {
          const radL = 40 + Math.sin(angle + angleAdder * xv3) * 10;
          const ang = 10 + angle + angleAdder_001 * xv3 * xv + increment * xv + 40;
          const sn = Math.sin(ang) * radL;
          const cn = Math.cos(ang) * radL;
          p.vertex(cy + cn, cx + sn);
        }
        p.endShape();
      }
      p.stroke(181, 136, 255, 200);
    }
    p.pop();

    const amp = square / 2;

    // sq4
    p.push();
    {
      const [gx, gy] = cellPos(3);
      p.translate(gx, gy);
      const interval2 = (2 * Math.PI) / 2;
      const interval = (2 * Math.PI) / 2;
      p.fill(181, 136, 255, 200);
      for (let k = 0; k < 2; k++) {
        const r = Math.cos((5 * (a + interval * k)) / 3) * 5;
        for (let m = 0; m < 2; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp - 5 + r);
          const oy = cy + Math.cos(a + interval * k) * (amp - 5 + r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.sin(a + interval2 * (m + 1)) * (amp - 5 + r);
          const ty = cy + Math.cos(a + interval2 * (k + 1)) * (amp - 5 + r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
      p.noFill();
    }
    p.pop();

    // sq5
    p.push();
    {
      const [gx, gy] = cellPos(4);
      p.translate(gx, gy);
      const interval2 = (2 * Math.PI) / 2;
      const interval = (2 * Math.PI) / 3;
      p.fill(181, 136, 255, 200);
      for (let k = 0; k < 3; k++) {
        const r = Math.cos((5 * (a + interval * k)) / 3) * 5;
        for (let m = 0; m < 2; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp - 5 + r);
          const oy = cy + Math.cos(a + interval * k) * (amp - 5 + r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.cos(a + interval2 * (m + 1)) * (amp - 5 + r);
          const ty = cy + Math.cos(a + interval2 * (k + 1)) * (amp - 5 + r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
      p.noFill();
    }
    p.pop();

    // sq6
    p.push();
    {
      const [gx, gy] = cellPos(5);
      p.translate(gx, gy);
      const interval2 = (2 * Math.PI) / 4;
      const interval = (2 * Math.PI) / 4;
      p.fill(181, 136, 255, 200);
      for (let k = 0; k < 4; k++) {
        const r = Math.cos((5 * (a + interval2 * k)) / 3) * 20;
        for (let m = 0; m < 4; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp - 20 - r);
          const oy = cy + Math.cos(a + interval * k) * (amp - 20 - r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.sin(a + interval * (m + 1)) * (amp - 20 - r);
          const ty = cy + Math.cos(a + interval * (k + 1)) * (amp - 20 - r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
      p.noFill();
    }
    p.pop();

    // sq7
    p.push();
    {
      const [gx, gy] = cellPos(6);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 4;
      const interval2 = (2 * Math.PI) / 10;
      p.fill(181, 136, 255, 200);
      for (let k = 0; k < 10; k++) {
        const r = Math.cos((5 * (a + interval2 * k)) / 3) * 5;
        for (let m = 0; m < 4; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp / 2 + r);
          const oy = cy + Math.cos(a + interval * k) * (amp / 2 + r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.cos(a + interval * (m + 1)) * (amp - 5 + r);
          const ty = cy + Math.sin(a + interval * (k + 1)) * (amp - 5 + r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
      p.noFill();
    }
    p.pop();

    // sq8
    p.push();
    {
      const [gx, gy] = cellPos(7);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 24;
      const interval2 = (2 * Math.PI) / 10;
      p.fill(181, 136, 255, 200);
      for (let k = 0; k < 10; k++) {
        const r = Math.cos((5 * (a + interval2 * k)) / 3) * 5;
        for (let m = 0; m < 24; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp / 2 + r);
          const oy = cy + Math.cos(a + interval * (k * (24 / 10))) * (amp / 2 + r);
          p.circle(ox, oy, dot);
          const ripple = Math.sin((5 * (a + interval2 * k + Math.PI / 2)) / 3) * 5;
          const tx = cx + Math.sin(a + interval * (m + 1)) * (amp - 5 + ripple);
          const ty = cy + Math.cos(a + interval * (k * (24 / 10))) * (amp - 5 + ripple);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
      p.noFill();
    }
    p.pop();

    // sq9
    if (!isMobileLayout) {
      p.push();
      {
        const [gx, gy] = cellPos(8);
        p.translate(gx, gy);
        const interval2 = (2 * Math.PI) / 4;
        const interval = (2 * Math.PI) / 20;
        p.fill(181, 136, 255, 200);
        for (let k = 0; k < 20; k++) {
          const r = Math.cos((5 * (a + interval2 * k)) / 3) * 5;
          for (let m = 0; m < 4; m++) {
            const ox = cx + Math.sin(a + interval * m) * (amp - 5 + r);
            const oy = cy + Math.cos(a + interval * k) * (amp - 5 + r);
            const tx = cx + Math.sin(a + interval2 * (m + 1)) * (amp - 5 + r);
            const ty = cy + Math.cos(a + interval2 * (k + 1)) * (amp - 5 + r);
            p.circle(tx, ty, dot);
            p.line(oy, ox, ty, tx);
          }
        }
        p.noFill();
      }
      p.pop();
    }

    p.pop();
  };
};

export function Wave4Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
