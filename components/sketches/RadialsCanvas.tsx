"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const MOBILE_BREAKPOINT = 720;

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

type Props = {
  // When true, render inside the document flow (relative position, fills
  // parent) instead of the default fixed/full-viewport background mode.
  inFlow?: boolean;
  // Multiplier for radius sizes (START_RADIUS, MAX_RADIUS_MIN,
  // MAX_RADIUS_RANGE, MAX_RADIAL_SIZE). Default 1 keeps current
  // desktop/mobile-branched sizes.
  sizeScale?: number;
  // Multiplier for NUM_RADIALS (the growing rings). Default 1.
  radialCountScale?: number;
  // Multiplier for NUM_PARTICLES (the wandering / orbiting dots).
  // Default 1. Independent from radialCountScale so you can thin
  // particles without also thinning rings.
  particleCountScale?: number;
  // Multiplier for animation speed — both the radials' wandering
  // velocity AND particle velocity (linear and rotational). Default 1.
  speedScale?: number;
  // Multiplier for how far a radial's radius grows each frame — the
  // spacing between successive rings. Default 1 (the base 10px step).
  ringStepScale?: number;
};

export function RadialsCanvas({
  inFlow = false,
  sizeScale = 1,
  radialCountScale = 1,
  particleCountScale = 1,
  speedScale = 1,
  ringStepScale = 1,
}: Props = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlowRef = useRef(inFlow);
  useEffect(() => {
    inFlowRef.current = inFlow;
  }, [inFlow]);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;

    (async () => {
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        // Base counts/sizes per viewport class, then scale by the
        // caller-provided multipliers. `Math.max(1, …)` keeps the
        // sketch from degenerating to zero at very small scales.
        const NUM_RADIALS = Math.max(1, Math.round((isMobile ? 12 : 24) * radialCountScale));
        const NUM_PARTICLES = Math.max(1, Math.round((isMobile ? 50 : 100) * particleCountScale));
        const START_RADIUS = (isMobile ? 20 : 30) * sizeScale;
        const MAX_RADIUS_MIN = (isMobile ? 60 : 100) * sizeScale;
        const MAX_RADIUS_RANGE = (isMobile ? 100 : 200) * sizeScale;
        const MAX_RADIAL_SIZE = (isMobile ? 150 : 300) * sizeScale;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        class Radial {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          position: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          velocity: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: any;
          radius = START_RADIUS;
          maxRadius: number;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor(pos: any, vel: any) {
            this.position = pos.copy();
            this.velocity = vel.copy();
            const [cr, cg, cb] = COLORS[0];
            this.color = p.color(cr, cg, cb);
            this.maxRadius =
              MAX_RADIUS_MIN + Math.pow(p.random(), 2) * MAX_RADIUS_RANGE;
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
          if (radius <= START_RADIUS) {
            const [r, g, b] = COLORS[0];
            return p.color(r, g, b);
          }
          if (radius >= MAX_RADIAL_SIZE) {
            const [r, g, b] = COLORS[COLORS.length - 1];
            return p.color(r, g, b);
          }
          const t =
            (radius - START_RADIUS) / (MAX_RADIAL_SIZE - START_RADIUS);
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
          const vel = p.createVector(
            p.random(-0.5, 0.5) * speedScale,
            p.random(-0.5, 0.5) * speedScale,
          );
          return new Radial(pos, vel);
        };

        const MIN_ROTATION_SPEED = (isMobile ? 5 : 2.5) * speedScale;
        const MAX_ROTATION_SPEED = 10 * speedScale;
        const randomParticle = () => {
          const pos = p.createVector(p.random(p.width), p.random(p.height));
          const vx =
            p.random(MIN_ROTATION_SPEED, MAX_ROTATION_SPEED) *
            (p.random() < 0.5 ? -1 : 1);
          const vel = p.createVector(vx, p.random(-MAX_ROTATION_SPEED, MAX_ROTATION_SPEED));
          return new Particle(pos, vel);
        };

        const getDims = (): [number, number] => {
          if (inFlowRef.current && containerRef.current) {
            return [
              containerRef.current.clientWidth,
              containerRef.current.clientHeight,
            ];
          }
          return [p.windowWidth, p.windowHeight];
        };

        p.setup = () => {
          const [cw, ch] = getDims();
          const c = p.createCanvas(cw, ch);
          c.style("display", "block");
          p.frameRate(24);
          for (let i = 0; i < NUM_RADIALS; i++) radials.push(randomRadial());
          for (let i = 0; i < NUM_PARTICLES; i++)
            particles.push(randomParticle());
        };

        p.windowResized = () => {
          const [cw, ch] = getDims();
          p.resizeCanvas(cw, ch);
        };

        p.draw = () => {
          // Transparent clear, not `p.background(255)`. The hard white
          // fill didn't match the page: emergence has no `bg` in
          // frontmatter, so its page renders on the default light
          // `--color-light` (#f8f7ff), and the canvas painted pure
          // #fff on top of it as a visible lighter rectangle. Clearing
          // instead lets the page colour show through, so the sketch
          // matches whatever background it's placed on.
          p.clear();

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
                  r.radius += 10 * ringStepScale;
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

      // Pause draw whenever the canvas is off-screen and resume the
      // moment it scrolls / slides back in. This means the meta
      // animations carousel only "begins" the emergence animation when
      // the user actually swipes into its slide instead of running it
      // invisibly from page load. On dedicated pages where the canvas
      // is always in the viewport, IO reports it as visible immediately
      // and animation plays normally.
      if (!cancelled && containerRef.current) {
        // Start paused — IO will flip us on if the canvas is already
        // in view, otherwise we wait for the user to swipe to us.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p5Instance as any)?.noLoop?.();
        io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p5Instance as any)?.loop?.();
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p5Instance as any)?.noLoop?.();
              }
            }
          },
          { threshold: 0.05 },
        );
        io.observe(containerRef.current);
      }
    })();

    return () => {
      cancelled = true;
      io?.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="Radials_Canvas"
      style={
        inFlow
          ? {
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }
          : {
              position: "fixed",
              inset: 0,
              zIndex: -1,
              pointerEvents: "none",
            }
      }
    />
  );
}
