"use client";

import { useEffect, useRef } from "react";

const NUM_RADIALS = 24;
const NUM_PARTICLES = 88;

const COLORS: [number, number, number][] = [
  [255, 31, 224],
  [224, 31, 255],
  [162, 62, 255],
  [69, 217, 255],
  [69, 255, 162],
  [131, 255, 100],
  [193, 255, 162],
  [224, 255, 162],
  [255, 255, 69],
  [255, 217, 69],
  [255, 186, 69],
];
const MAX_RADIAL_SIZE = 300;

export function RadialsCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;

    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        class Radial {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          velocity: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: any;
          radius = 30;
          maxRadius: number;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor(pos: any, vel: any) {
            this.position = pos.copy();
            this.velocity = vel.copy();
            const [cr, cg, cb] = COLORS[0];
            this.color = p.color(cr, cg, cb);
            this.maxRadius = 100 + Math.pow(p.random(), 2) * 200;
          }

          update() {
            this.position.add(this.velocity);
            if (this.position.x > p.width) this.position.x = 0;
            if (this.position.x < 0) this.position.x = p.width;
            if (this.position.y > p.height) this.position.y = 0;
            if (this.position.y < 0) this.position.y = p.height;
          }

          draw() {
            p.stroke(this.color);
            p.strokeWeight(1);
            for (let i = 0; i < 360; i += 5) {
              const r = p.radians(i);
              const x1 = this.position.x + p.cos(r) * (this.radius - 10);
              const y1 = this.position.y + p.sin(r) * (this.radius - 10);
              const x2 = this.position.x + p.cos(r) * this.radius;
              const y2 = this.position.y + p.sin(r) * this.radius;
              p.line(x1, y1, x2, y2);
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        class Particle {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          velocity: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pos2: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: any;
          hasRadial = false;
          angle = 0;
          radius = 0;
          radialRef: Radial | null = null;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor(pos: any, vel: any) {
            this.position = pos.copy();
            this.velocity = vel.copy();
            this.pos2 = p.createVector(0, 0);
            this.color = p.color(p.random(255), p.random(255), p.random(255));
          }

          update() {
            if (!this.hasRadial) {
              this.position.add(this.velocity);
            } else {
              this.angle += this.velocity.x;
            }
            if (this.position.x > p.width) this.position.x = 0;
            if (this.position.x < 0) this.position.x = p.width;
            if (this.position.y > p.height) this.position.y = 0;
            if (this.position.y < 0) this.position.y = p.height;
          }

          draw() {
            p.fill(this.color);
            p.noStroke();

            if (!this.hasRadial) {
              p.circle(this.position.x, this.position.y, 4);
            } else {
              this.pos2.x =
                this.position.x + p.cos(p.radians(this.angle)) * this.radius;
              this.pos2.y =
                this.position.y + p.sin(p.radians(this.angle)) * this.radius;

              p.circle(this.pos2.x, this.pos2.y, 4);

              p.noFill();
              p.stroke(colorForRadius(this.radius));
              p.circle(this.position.x, this.position.y, this.radius * 2);
              p.line(this.position.x, this.position.y, this.pos2.x, this.pos2.y);
            }
          }
        }

        const radials: Radial[] = [];
        const particles: Particle[] = [];

        const colorForRadius = (radius: number) => {
          if (radius <= 30) {
            const [r, g, b] = COLORS[0];
            return p.color(r, g, b);
          }
          if (radius >= MAX_RADIAL_SIZE) {
            const [r, g, b] = COLORS[COLORS.length - 1];
            return p.color(r, g, b);
          }
          const t = (radius - 30) / (MAX_RADIAL_SIZE - 30);
          const segPos = t * (COLORS.length - 1);
          const segIdx = Math.floor(segPos);
          const segT = segPos - segIdx;
          const a = COLORS[segIdx];
          const b = COLORS[segIdx + 1];
          return p.color(
            a[0] + (b[0] - a[0]) * segT,
            a[1] + (b[1] - a[1]) * segT,
            a[2] + (b[2] - a[2]) * segT
          );
        };

        const randomRadial = () => {
          const pos = p.createVector(p.random(p.width), p.random(p.height));
          const vel = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
          return new Radial(pos, vel);
        };

        const randomParticle = () => {
          const pos = p.createVector(p.random(p.width), p.random(p.height));
          const vx = p.random(2.5, 10) * (p.random() < 0.5 ? -1 : 1);
          const vel = p.createVector(vx, p.random(-10, 10));
          return new Particle(pos, vel);
        };

        p.setup = () => {
          const c = p.createCanvas(p.windowWidth, p.windowHeight);
          c.style("display", "block");
          p.frameRate(24);
          for (let i = 0; i < NUM_RADIALS; i++) radials.push(randomRadial());
          for (let i = 0; i < NUM_PARTICLES; i++)
            particles.push(randomParticle());
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };

        p.draw = () => {
          p.background(255);

          for (let i = 0; i < NUM_RADIALS; i++) {
            const r = radials[i];
            r.update();
            if (r.radius >= r.maxRadius && !particles.some((q) => q.radialRef === r)) {
              radials[i] = randomRadial();
            }
          }

          for (let i = 0; i < NUM_PARTICLES; i++) {
            const part = particles[i];
            part.update();

            if (part.hasRadial && Math.abs(part.angle) >= 2 * 360) {
              particles[i] = randomParticle();
              continue;
            }

            if (!part.hasRadial) {
              for (let j = 0; j < NUM_RADIALS; j++) {
                const r = radials[j];
                if (r.radius >= r.maxRadius) continue;
                const d = p.dist(
                  part.position.x,
                  part.position.y,
                  r.position.x,
                  r.position.y
                );
                if (d < r.radius) {
                  part.hasRadial = true;
                  part.radialRef = r;
                  r.velocity = p.createVector(0, 0);
                  r.radius += 10;
                  r.color = colorForRadius(r.radius);

                  part.radius = r.radius;
                  part.position = r.position.copy();
                }
              }
            }
          }

          for (let i = 0; i < NUM_RADIALS; i++) radials[i].draw();

          for (let i = 0; i < NUM_PARTICLES; i++) {
            const a = particles[i];
            a.draw();

            if (a.hasRadial) {
              for (let m = 0; m < NUM_PARTICLES; m++) {
                const b = particles[m];
                if (!b.hasRadial) continue;
                if (a.position.x === b.position.x) continue;
                const partDist = p.dist(a.pos2.x, a.pos2.y, b.pos2.x, b.pos2.y);
                if (partDist < 100) {
                  p.stroke(a.color);
                  p.strokeWeight(1);
                  p.line(a.pos2.x, a.pos2.y, b.pos2.x, b.pos2.y);
                }
              }
            }
          }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, containerRef.current) as any;
    })();

    return () => {
      cancelled = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="Radials_Canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
