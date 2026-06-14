"use client";

import { useLazySketch } from "./useLazySketch";

const THUMB_SIZE = 90;
const CYCLE_SECONDS = 6;
const FPS = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;
  const r = THUMB_SIZE * 0.4;

  const drawMoonPhase = (phaseT: number) => {
    const theta = phaseT * 2 * Math.PI;
    const fLit = 0.5 * (1 - Math.cos(theta));
    const litRight = Math.sin(theta) >= 0;

    if (fLit < 0.001) return;

    p.noStroke();
    p.fill(255);

    if (fLit > 0.999) {
      p.circle(cx, cy, r * 2);
      return;
    }

    const e = r * (1 - 2 * fLit);
    const sign = litRight ? 1 : -1;

    p.beginShape();
    const seg = 48;
    for (let i = 0; i <= seg; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / seg;
      p.vertex(cx + sign * Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    for (let i = seg; i >= 0; i--) {
      const a = -Math.PI / 2 + (Math.PI * i) / seg;
      p.vertex(cx + sign * Math.cos(a) * e, cy + Math.sin(a) * r);
    }
    p.endShape(p.CLOSE);
  };

  p.setup = () => {
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(FPS);
  };

  p.draw = () => {
    p.clear();
    const cycleFrames = CYCLE_SECONDS * FPS;
    const phaseT = (p.frameCount % cycleFrames) / cycleFrames;
    drawMoonPhase(phaseT);
  };
};

export function MoonRavesThumbnail() {
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
