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
  const angleAdder = 0.009;
  const angleAdder2 = 0.016;
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
    angle2 += angleAdder2;
    const a = angle;
    const amp = square / 2;

    p.background(0);
    p.stroke(181, 136, 255, 255);
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
      const interval = (2 * Math.PI) / 40;
      for (let i = 0; i < 40; i++) {
        const tx = cx + 2 + Math.cos(a + interval * i) * (Math.sin(a + interval * i) * amp);
        const ty = cy + 2 + Math.cos(a + interval * i) * (amp - 5);
        p.circle(ty, tx, dot);
      }
    }
    p.pop();

    // sq2
    p.push();
    {
      const [gx, gy] = cellPos(1);
      p.translate(gx, gy);
      for (let n = 0; n < 360; n += 20) {
        const ox = cx - 44 + Math.sin(a + angleAdder * n) * 44;
        const oy = cy + Math.cos(a + angleAdder * n) * 44;
        const tx = cx + 44 + Math.sin(a + angleAdder * n) * 44;
        const ty = cy - Math.cos(a + angleAdder * n) * 44;
        p.circle(ox, oy, dot);
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
      {
      const flips = [
        { offset: 0, useSin: true, innerFn: "sin" },
        { offset: Math.PI, useSin: false, innerFn: "cos" },
        { offset: 0, useSin: true, innerFn: "sin" },
        { offset: Math.PI, useSin: false, innerFn: "cos" },
      ];
      for (let f = 0; f < flips.length; f++) {
        const cfg = flips[f];
        for (let d = 35; d < square - 25; d += 20) {
          const oy = cfg.useSin
            ? cx + Math.sin(a + cfg.offset + angleAdder * d) * 50
            : cx + Math.cos(a + cfg.offset + angleAdder * d) * 50;
          const ox = cfg.useSin
            ? cy + Math.cos(a + cfg.offset + angleAdder * d) * 50
            : cy + Math.sin(a + cfg.offset + angleAdder * d) * 50;
          for (let k = 0; k < 30; k++) {
            const innerAng = a + Math.sin(a) * ((2 * Math.PI) / 30) * k;
            const useS = cfg.innerFn === "sin";
            const tx = ox + (useS ? Math.sin(innerAng) : Math.cos(innerAng)) * 30;
            const ty = oy + (useS ? Math.cos(innerAng) : Math.sin(innerAng)) * 30;
            p.circle(tx, ty, dot);
          }
        }
      }
      }
    }
    p.pop();

    // sq4
    p.push();
    {
      const [gx, gy] = cellPos(3);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 10;
      const interval2 = (2 * Math.PI) / 6;
      for (let i = 0; i < square; i += 10) {
        for (let s = 0; s < 6; s++) {
          const ox = cx + Math.sin(a + angleAdder * i + interval2 * s) * amp;
          p.circle(ox, i, dot);
          const oy = cy + Math.sin(a + angleAdder * i + interval2 * s) * amp;
          p.circle(i, oy, dot);
        }
      }
      void interval;
    }
    p.pop();

    // sq5
    p.push();
    {
      const [gx, gy] = cellPos(4);
      p.translate(gx, gy);
      const interval2 = (2 * Math.PI) / 6;
      const interval = (2 * Math.PI) / 20;
      for (let k = 0; k < 6; k++) {
        const r = Math.cos((5 * (a + interval2 * k)) / 7) * 5;
        for (let m = 0; m < 20; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp - 5 + r);
          const oy = cy + Math.cos(a + interval * k) * (amp - 5 + r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.sin(a + interval * (m + 1)) * (amp - 5 + r);
          const ty = cy + Math.cos(a + interval * (k + 1)) * (amp - 5 + r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
    }
    p.pop();

    // sq6
    p.push();
    {
      const [gx, gy] = cellPos(5);
      p.translate(gx, gy);
      const interval2 = (2 * Math.PI) / 100;
      const interval = (2 * Math.PI) / 6;
      for (let k = 0; k < 6; k++) {
        const r = Math.cos((5 * (a + interval2 * k)) / 3) * 5;
        for (let m = 0; m < 6; m++) {
          const ox = cx + Math.sin(a + interval * m) * (amp - 10 - r);
          const oy = cy + Math.cos(a + interval * k) * (amp - 10 - r);
          p.circle(ox, oy, dot);
          const tx = cx + Math.sin(a + interval * (m + 1)) * (amp - 10 - r);
          const ty = cy + Math.cos(a + interval * (k + 1)) * (amp - 10 - r);
          p.circle(tx, ty, dot);
          p.line(ox, oy, tx, ty);
        }
      }
    }
    p.pop();

    // sq7
    p.push();
    {
      const [gx, gy] = cellPos(6);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 5;
      const interval2 = (2 * Math.PI) / 5;
      for (let d = 0; d < 5; d++) {
        const oy = cx + Math.sin(a + interval2 * d) * 50;
        const ox = cy + Math.cos(a + interval2 * d) * 50;
        p.circle(ox, oy, dot);
        for (let k = 0; k < 5; k++) {
          const tx = ox + Math.sin(a + interval * k) * 30;
          const ty = oy + Math.cos(a + interval * k) * 30;
          p.circle(tx, ty, dot);
          for (let d2 = 0; d2 < 5; d2++) {
            const thy = cx + Math.sin(a + interval2 * (d2 + 10)) * 50;
            const thx = cy + Math.cos(a + interval2 * (d2 + 10)) * 50;
            p.circle(thx, thy, dot);
          }
        }
      }
    }
    p.pop();

    // sq8
    p.push();
    {
      const [gx, gy] = cellPos(7);
      p.translate(gx, gy);
      const interval = (2 * Math.PI) / 30;
      const interval2 = (2 * Math.PI) / 40;
      for (let d = 0; d < 40; d++) {
        const oy = cx + Math.sin(a + interval2 * d) * 50;
        const ox = cy + Math.cos(a + interval2 * d) * 50;
        for (let k = 0; k < 30; k++) {
          if (k % 2 === 0) {
            const tx = ox + Math.sin(a + interval * k) * 30;
            const ty = oy + Math.cos(a + interval * k) * 30;
            p.circle(tx, ty, dot);
          } else {
            const tx = ox + Math.cos(a + interval * k) * 30;
            const ty = oy + Math.sin(a + interval * k) * 30;
            p.circle(tx, ty, dot);
          }
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
        const interval = (2 * Math.PI) / 3;
        for (let d = 0; d < 3; d++) {
          const oy = cx + Math.cos(a + interval * d) * 50;
          const ox = cy + Math.sin(a + interval * d) * 50;
          for (let k = 0; k < 30; k++) {
            const innerAng = a + Math.sin(a) * ((2 * Math.PI) / 30) * k;
            const tx = ox + Math.sin(innerAng) * 30;
            const ty = oy + Math.cos(innerAng) * 30;
            p.circle(tx, ty, dot);
            p.line(ox, oy, tx, ty);
          }
        }
        for (let d = 0; d < 3; d++) {
          const oy = cx + Math.cos(a + interval * d + Math.PI) * 50;
          const ox = cy + Math.sin(a + interval * d + Math.PI) * 50;
          for (let k = 0; k < 30; k++) {
            const innerAng = a + Math.sin(a + Math.PI) * ((2 * Math.PI) / 30) * k;
            const tx = ox + Math.sin(innerAng) * 30;
            const ty = oy + Math.cos(innerAng) * 30;
            p.circle(tx, ty, dot);
            p.line(ox, oy, tx, ty);
          }
        }
      }
      p.pop();
    }

    p.pop();
    void angle2;
  };
};

export function Wave3Canvas() {
  return <WaveCanvasShell sketch={sketch} />;
}
