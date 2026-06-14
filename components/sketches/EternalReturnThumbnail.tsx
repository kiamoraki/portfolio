"use client";

import { useLazySketch } from "./useLazySketch";

const THUMB_SIZE = 90;
const NUM_PTS = 7;
const BOX = 60;
const AMP = 22;
const FRAMES_PER_CYCLE = 24 * 5;

// One eternal-return ring: points slide from a square outline to an inner
// ring and back, looping smoothly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;
  const tx = cx - BOX / 2;
  const ty = cy - BOX / 2;
  const inc = BOX / NUM_PTS;

  const sourcePts: { x: number; y: number }[] = [];
  for (let i = 0; i < NUM_PTS; i++) sourcePts.push({ x: i * inc + tx, y: ty });
  for (let j = 0; j < NUM_PTS; j++) sourcePts.push({ x: BOX + tx, y: j * inc + ty });
  for (let k = 0; k < NUM_PTS; k++) sourcePts.push({ x: BOX - k * inc + tx, y: BOX + ty });
  for (let l = 0; l < NUM_PTS; l++) sourcePts.push({ x: tx, y: BOX - l * inc + ty });

  const angleStep = (2 * Math.PI) / sourcePts.length;
  const innerRing: { x: number; y: number }[] = [];
  for (let n = 0; n < sourcePts.length; n++) {
    const ang = angleStep * n + (5 * Math.PI) / 4;
    innerRing.push({
      x: cx + Math.cos(ang) * AMP,
      y: cy + Math.sin(ang) * AMP,
    });
  }

  let frame = 0;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
  };

  p.draw = () => {
    p.clear();
    frame++;
    const phase = (frame % FRAMES_PER_CYCLE) / FRAMES_PER_CYCLE;
    const pct = (1 - Math.cos(phase * 2 * Math.PI)) / 2;

    p.fill(181, 136, 255, 230);
    p.noStroke();
    for (let i = 0; i < sourcePts.length; i++) {
      const x = (1 - pct) * sourcePts[i].x + pct * innerRing[i].x;
      const y = (1 - pct) * sourcePts[i].y + pct * innerRing[i].y;
      p.circle(x, y, 2.8);
    }
  };
};

export function EternalReturnThumbnail() {
  const ref = useLazySketch(sketch);
  return (
    <div
      ref={ref}
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
