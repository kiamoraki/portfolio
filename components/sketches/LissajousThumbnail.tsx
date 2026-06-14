"use client";

import { useLazySketch } from "./useLazySketch";

const THUMB_SIZE = 90;
const FREQ_A = 3;
const FREQ_B = 4;
const STEP = 12;
const SIZE_MIN = 0.6;
const SIZE_MAX = 2.8;
const SIZE_MID = (SIZE_MIN + SIZE_MAX) / 2;
const SIZE_AMP = (SIZE_MAX - SIZE_MIN) / 2;
const SIZE_WAVE_SPEED = 0.05;
const SIZE_PERIODS = 2;
const ALPHA = 160;
const COLOR_PHASE_OFFSET = Math.PI;
const AMP = 30;

function gcdOf(a: number, b: number): number {
  let x = Math.abs(a) || 1;
  let y = Math.abs(b) || 1;
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const thetaDeg = 360 / gcdOf(FREQ_A, FREQ_B);
  const angleAdder = 0.06;
  let angle = 0;
  let blueAngle = 0;
  let sizeWaveOffset = 0;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(29);
  };

  p.draw = () => {
    p.background(0);

    if (angle <= thetaDeg) angle += angleAdder;
    else angle = 0;
    if (blueAngle >= -thetaDeg) blueAngle -= angleAdder;
    else blueAngle = 0;

    const cx = THUMB_SIZE / 2;
    const cy = THUMB_SIZE / 2;
    sizeWaveOffset += SIZE_WAVE_SPEED;
    const phasePerStep = (SIZE_PERIODS * 2 * Math.PI) / (thetaDeg / STEP);

    p.noStroke();
    let stepIdx = 0;
    for (let i = 0; i < thetaDeg; i += STEP) {
      const pinkRadian = (Math.PI / 180) * (angle + i);
      const pinkDx = cx + AMP * Math.sin(FREQ_A * pinkRadian);
      const pinkDy = cy + AMP * Math.sin(FREQ_B * pinkRadian);

      const blueRadian = (Math.PI / 180) * (blueAngle + i);
      const blueDx = cx + AMP * Math.sin(FREQ_A * blueRadian);
      const blueDy = cy + AMP * Math.sin(FREQ_B * blueRadian);

      const blueRadius =
        SIZE_MID + SIZE_AMP * Math.sin(sizeWaveOffset + stepIdx * phasePerStep);
      const pinkRadius =
        SIZE_MID +
        SIZE_AMP *
          Math.sin(sizeWaveOffset + stepIdx * phasePerStep + COLOR_PHASE_OFFSET);

      p.fill(42, 88, 255, ALPHA);
      p.circle(blueDx, blueDy, blueRadius * 2);
      p.fill(255, 69, 230, ALPHA);
      p.circle(pinkDx, pinkDy, pinkRadius * 2);

      stepIdx++;
    }
  };
};

export function LissajousThumbnail() {
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
