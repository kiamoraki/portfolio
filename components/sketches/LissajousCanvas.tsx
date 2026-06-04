"use client";

import { useEffect, useRef } from "react";

export function LissajousCanvas() {
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
        const freqA = 3;
        const freqB = 4;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const curves: any[] = [];

        function gcdOf(a: number, b: number): number {
          let x = a, y = b;
          while (y !== 0) {
            const t = y;
            y = x % y;
            x = t;
          }
          return x;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        class LissajousCurve {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          origin: any;
          amp: number;
          fA: number;
          fB: number;
          gcd: number;
          angle = 0;
          angleAdder = 0.02;
          thetaRadian: number;
          numDots: number;
          dotAdder: number;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dots: any[] = [];
          radius = 5;
          colorswitch = false;
          dotRemove = false;
          pct = 0;
          increment = 0.01846197339865986 * 4;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          constructor(origin: any, amp: number, fA: number, fB: number, gcd: number) {
            this.origin = origin;
            this.amp = amp;
            this.fA = fA;
            this.fB = fB;
            this.gcd = gcd;
            this.thetaRadian = (p.TWO_PI / gcd);
            this.numDots = fA * 40 + fB * 40;
            this.dotAdder = this.thetaRadian / this.numDots;
            this.dots.push(p.createVector(origin.x, origin.y));
          }

          update() {
            if (this.angle <= this.thetaRadian / 2) {
              this.angle += this.angleAdder;
            } else {
              this.angle = 0;
              this.colorswitch = !this.colorswitch;
            }
            if (this.dots.length > 100 || this.dots.length < 1) {
              this.dotRemove = !this.dotRemove;
            }
            if (this.angle <= this.thetaRadian / 6 && !this.dotRemove) {
              this.dots.push(p.createVector(this.origin.x, this.origin.y));
            } else if (this.angle <= this.thetaRadian / 6 && this.dotRemove) {
              this.dots.shift();
            }
            this.pct += this.increment;
            if (this.pct > 1 || this.pct < 0) this.increment *= -1;
          }

          interpolate() {
            this.radius = (1 - this.pct) * 2 + this.pct * 10;
          }

          move() {
            const colors = this.colorswitch
              ? [p.color(0, 0, 255, 100), p.color(255, 0, 0, 100), p.color(255, 255, 0, 100), p.color(0, 255, 0, 100)]
              : [p.color(255, 0, 0, 100), p.color(0, 0, 255, 100), p.color(0, 255, 0, 100), p.color(255, 255, 0, 100)];

            p.noStroke();
            for (let d = 0; d < this.dots.length; d++) {
              const t = this.angle + this.dotAdder * d;
              // Q1
              this.dots[d].x = this.origin.x + this.amp * p.sin(this.fA * t + p.TWO_PI);
              this.dots[d].y = this.origin.y + this.amp * p.sin(this.fB * t + p.PI);
              p.fill(colors[0]); p.circle(this.dots[d].x, this.dots[d].y, this.radius);
              // Q2
              this.dots[d].x = this.origin.x - this.amp * p.sin(this.fA * t);
              this.dots[d].y = this.origin.y - this.amp * p.sin(this.fB * t);
              p.fill(colors[1]); p.circle(this.dots[d].x, this.dots[d].y, this.radius);
              // Q3
              this.dots[d].x = this.origin.x + this.amp * p.sin(this.fA * t);
              this.dots[d].y = this.origin.y + this.amp * p.sin(this.fB * t);
              p.fill(colors[2]); p.circle(this.dots[d].x, this.dots[d].y, this.radius);
              // Q4
              this.dots[d].x = this.origin.x - this.amp * p.sin(this.fA * t + p.TWO_PI);
              this.dots[d].y = this.origin.y - this.amp * p.sin(this.fB * t + p.PI);
              p.fill(colors[3]); p.circle(this.dots[d].x, this.dots[d].y, this.radius);
            }
          }
        }

        const dims = (): number => {
          const parent = (p.canvas && p.canvas.parentElement) as
            | HTMLElement
            | null;
          const containerSize =
            parent && parent.clientWidth > 0 ? parent.clientWidth : 600;
          const viewportSize =
            typeof window !== "undefined" ? window.innerWidth : 600;
          // Cap at viewport width so a wide container can never make
          // the canvas overflow past the visible screen.
          return Math.min(containerSize, viewportSize, 600);
        };

        const buildCurves = () => {
          curves.length = 0;
          const origin = p.createVector(p.width / 2, p.height / 2);
          // Amp tracks the live viewport so the curve scales to what the
          // user actually sees — UNLESS the canvas itself is smaller
          // than the viewport (this sketch's `dims()` caps at 600), in
          // which case the canvas half-dim is the hard ceiling. Without
          // the canvas clamp, amp overflows the 600px square top and
          // bottom on any viewport >600px tall, vertically cropping the
          // curve. The `–20` keeps a small visual margin from the edge.
          const viewportMin =
            typeof window !== "undefined"
              ? Math.min(window.innerWidth, window.innerHeight)
              : Math.min(p.width, p.height);
          const canvasMin = Math.min(p.width, p.height);
          const amp = Math.min(viewportMin, canvasMin) / 2 - 20;
          const gcd = gcdOf(freqA, freqB);
          curves.push(new LissajousCurve(origin, amp, freqA, freqB, gcd));
          curves.push(new LissajousCurve(origin, amp, freqB, freqA, gcd));
        };

        p.setup = () => {
          const size = dims();
          p.createCanvas(size, size);
          p.frameRate(24);
          buildCurves();
        };

        p.windowResized = () => {
          const size = dims();
          p.resizeCanvas(size, size);
          buildCurves();
        };

        p.draw = () => {
          p.background(0, 0, 0);
          for (const c of curves) {
            c.update();
            c.interpolate();
            c.move();
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
      id="Lissajous_Canvas"
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
        margin: "2rem 0",
      }}
    />
  );
}
