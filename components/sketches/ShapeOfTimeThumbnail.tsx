"use client";

import { useEffect, useRef } from "react";

// Scaled-down port of ShapeOfTimeCanvas using the simplest 1:2 Lissajous
// pair — a spiral of particles inward + low-alpha feedback rect for the
// signature trail aesthetic.
const THUMB_SIZE = 90;
const AMP_RATIO = 0.4;
const PARTICLE_DIAMETER = 1.6;
const FEEDBACK_ALPHA = 12;
const AMP_STEP = 0.6;
const AMP_DECAY = 0.18;
const ANGLE_ADDER = 0.012;
const FREQ_A = 1;
const FREQ_B = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sketch = (p: any) => {
  type Particle = { amp: number; angle: number; alpha: number };

  const cx = THUMB_SIZE / 2;
  const cy = THUMB_SIZE / 2;
  const ampMax = THUMB_SIZE * AMP_RATIO;
  const theta = (2 * Math.PI) / 1; // gcd(1,2) = 1
  const particles: Particle[] = [];

  const buildParticles = () => {
    particles.length = 0;
    for (let i = 0; i <= ampMax; i += AMP_STEP) {
      const t = i / ampMax;
      const alpha =
        t < 0.5
          ? Math.floor(70 + (t / 0.5) * (255 - 70))
          : Math.floor(255 - ((t - 0.5) / 0.5) * (255 - 70));
      particles.push({ amp: i, angle: t * theta, alpha });
    }
  };

  p.setup = () => {
    p.pixelDensity(1);
    const c = p.createCanvas(THUMB_SIZE, THUMB_SIZE);
    c.style("display", "block");
    p.frameRate(24);
    p.background(19, 12, 18);
    buildParticles();
  };

  p.draw = () => {
    p.noStroke();
    p.fill(0, 0, 0, FEEDBACK_ALPHA);
    p.rect(0, 0, THUMB_SIZE, THUMB_SIZE);

    for (const particle of particles) {
      particle.angle += ANGLE_ADDER;
      if (particle.angle > theta) particle.angle -= theta;
      particle.amp -= AMP_DECAY;
      if (particle.amp < 0) particle.amp += ampMax;

      const x = cx - particle.amp * Math.sin(FREQ_A * particle.angle);
      const y = cy - particle.amp * Math.sin(FREQ_B * particle.angle);
      p.fill(181, 136, 255, particle.alpha);
      p.circle(x, y, PARTICLE_DIAMETER);
    }
  };
};

export function ShapeOfTimeThumbnail() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let intersectionObserver: IntersectionObserver | null = null;

    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5(sketch as any, containerRef.current) as any;

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inst = p5Instance as any;
            if (!inst) continue;
            if (entry.isIntersecting) inst.loop?.();
            else inst.noLoop?.();
          }
        },
        { threshold: 0.05 }
      );
      intersectionObserver.observe(containerRef.current);
    })();

    return () => {
      cancelled = true;
      intersectionObserver?.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#130c12",
      }}
    />
  );
}
