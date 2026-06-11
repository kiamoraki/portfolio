"use client";

/**
 * ShapeOfTimeV2Canvas — port of the p5.js Web Editor sketch
 * "TD · Scale & Phase shift" (editor.p5js.org/mshhll.rk/sketches/Obxi1ey16).
 *
 * A field of ~hundreds of magenta dots, each riding its own Lissajous
 * curve at a different amplitude. Every frame each dot's amplitude
 * shrinks toward the centre and its phase advances, so the whole figure
 * reads as concentric Lissajous rings continuously scaling inward while
 * phase-shifting — a "shape of time" pulse.
 *
 * Original was a fixed 600×600 canvas; this version sizes a centred
 * square canvas to the live viewport (min of width/height) and derives
 * the amplitude range from the canvas so the figure scales to the slide.
 * The frequency pair is randomised once at mount and preserved across
 * resizes so the figure's identity is stable while you resize.
 */
import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

export function ShapeOfTimeV2Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;

    (async () => {
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        const increment = 0.0021;

        // Frequency pair — randomised once, then kept stable across
        // resizes so the figure doesn't reshuffle when the window moves.
        let freqA = 0;
        let freqB = 0;

        function calculateGCD(a: number, b: number): number {
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
        class Lissa {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          origin: any;
          amp: number;
          freqA: number;
          freqB: number;
          gcd: number;
          theta: number;
          angle: number;
          transparency: number;
          increment = increment;
          angleAdder = increment;
          ampAdder = 1;
          ampMax: number;
          ampMin = 0;
          numParticles = 1;
          phase: number;
          radius = 5;

          constructor(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            origin: any,
            amp: number,
            fA: number,
            fB: number,
            angle: number,
            transparency: number,
            ampMax: number,
          ) {
            this.origin = origin;
            this.amp = amp;
            this.freqA = fA;
            this.freqB = fB;
            this.gcd = calculateGCD(fA, fB);
            this.theta = p.TWO_PI / this.gcd;
            this.angle = angle;
            this.transparency = transparency;
            this.ampMax = ampMax;
            this.phase = this.theta / this.numParticles;
          }

          update() {
            this.angle += this.angleAdder;
            if (this.angle <= this.theta) {
              this.angle += this.angleAdder;
            } else {
              this.angle = 0;
            }
            if (this.amp > this.ampMin) {
              this.amp -= this.ampAdder;
            } else {
              this.amp = this.ampMax;
            }
          }

          move() {
            p.noStroke();
            for (let np = 0; np < this.numParticles; np++) {
              const x =
                this.origin.x -
                this.amp * p.sin(this.freqA * (this.angle + this.phase * np));
              const y =
                this.origin.y -
                this.amp * p.sin(this.freqB * (this.angle + this.phase * np));
              p.fill(255, 0, 255, this.transparency);
              p.circle(x, y, this.radius);
            }
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let lissas: any[] = [];

        const dims = (): number => {
          const w = typeof window !== "undefined" ? window.innerWidth : 600;
          const h = typeof window !== "undefined" ? window.innerHeight : 600;
          return Math.min(w, h);
        };

        const build = () => {
          lissas = [];
          const origin = p.createVector(p.width / 2, p.height / 2);
          // A Lissajous dot's max horizontal/vertical offset from centre
          // equals its amp, so the figure's extremes sit at `cx ± ampMax`.
          // The original's `width/2 + 10` pushed those extremes 10px PAST
          // the canvas edge, clipping the left/right (and top/bottom) dots.
          // Pull the ceiling inside the half-dimension with a margin that
          // clears the dot radius so the whole figure stays on-canvas.
          const ampMax = p.width / 2 - 20;
          const gcd = calculateGCD(freqA, freqB);
          const theta = p.TWO_PI / gcd;
          // Transparency ramps up then back down across the amplitude
          // range so the mid rings are brightest and the inner/outer
          // rings fade — pivot at ~0.43·ampMax mirrors the original's
          // i<132 split on its 310px ampMax.
          const pivot = ampMax * 0.426;
          for (let i = 0; i < ampMax; i += 0.8) {
            const amp = i;
            const angle = p.map(i, 0, ampMax, 0, theta);
            const transparency =
              i < pivot
                ? Math.round(p.map(i, 0, ampMax / 2, 70, 255))
                : Math.round(p.map(i, 0, ampMax / 2, 255, 70));
            lissas.push(
              new Lissa(origin, amp, freqA, freqB, angle, transparency, ampMax),
            );
          }
        };

        p.setup = () => {
          const size = dims();
          p.createCanvas(size, size);
          p.frameRate(24);

          // Distinct random frequencies 1..9 (matches the original's
          // `int(random(1,10))` with a distinctness guard).
          freqA = p.int(p.random(1, 10));
          freqB = p.int(p.random(1, 10));
          while (freqA === freqB) {
            freqA = p.int(p.random(1, 10));
          }

          build();
        };

        p.windowResized = () => {
          const size = dims();
          p.resizeCanvas(size, size);
          build();
        };

        p.draw = () => {
          p.background(0, 0, 0);
          for (let i = 0; i < lissas.length; i++) {
            lissas[i].update();
            lissas[i].move();
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
      id="ShapeOfTimeV2_Canvas"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    />
  );
}
