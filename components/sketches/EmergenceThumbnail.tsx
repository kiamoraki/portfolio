"use client";

import { useLazySketch } from "./useLazySketch";

const THUMB_SIZE = 90;

// One radial with a few orbital rings and particles, sampled from the
// emergence palette.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;

  const RADIAL_RADIUS = 12;
  const RINGS = [
    { radius: 20, color: [255, 31, 224] as const, speed: 0.03, offset: 0 },
    { radius: 28, color: [162, 62, 255] as const, speed: 0.022, offset: Math.PI / 2 },
    { radius: 36, color: [69, 217, 255] as const, speed: 0.018, offset: Math.PI },
  ];

  let frame = 0;

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
  };

  p.draw = () => {
    p.background(255);
    frame++;

    // central radial: short spokes around a tight circle
    p.stroke(255, 31, 224);
    p.strokeWeight(1);
    p.noFill();
    for (let i = 0; i < 360; i += 12) {
      const r = (i * Math.PI) / 180;
      const x1 = cx + Math.cos(r) * (RADIAL_RADIUS - 4);
      const y1 = cy + Math.sin(r) * (RADIAL_RADIUS - 4);
      const x2 = cx + Math.cos(r) * RADIAL_RADIUS;
      const y2 = cy + Math.sin(r) * RADIAL_RADIUS;
      p.line(x1, y1, x2, y2);
    }

    // orbital rings + particles
    for (const ring of RINGS) {
      const [rr, rg, rb] = ring.color;
      p.stroke(rr, rg, rb, 180);
      p.noFill();
      p.strokeWeight(0.8);
      p.circle(cx, cy, ring.radius * 2);

      const ang = frame * ring.speed + ring.offset;
      const px = cx + Math.cos(ang) * ring.radius;
      const py = cy + Math.sin(ang) * ring.radius;
      p.noStroke();
      p.fill(rr, rg, rb);
      p.circle(px, py, 3.2);

      p.stroke(rr, rg, rb, 200);
      p.strokeWeight(0.8);
      p.line(cx, cy, px, py);
    }
  };
};

export function EmergenceThumbnail() {
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
