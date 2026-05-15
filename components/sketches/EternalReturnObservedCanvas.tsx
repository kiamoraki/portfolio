"use client";

import { useEffect, useRef } from "react";

const NUM_CELLS = 50;

export function EternalReturnObservedCanvas() {
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
        type Pt = { x: number; y: number };

        class FirstOrigin {
          origin: Pt;
          translateX: number;
          translateY: number;
          boxSize: number;
          amp: number;
          numPts: number;
          increment: number;
          angle = 0;
          angleStep: number;
          pct: number;
          pctAdder: number;
          shaper = 1;
          interpolateOn = true;
          colorStep = true;
          drawCircle = false;
          bigRadius: number;
          bigRadiusMin: number;
          bigRadiusMax: number;
          colorSine = 0;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          colorBigRadius: any;
          sourcePts: Pt[] = [];
          innerRing: Pt[] = [];
          interpolatePts: Pt[] = [];

          constructor(
            origin: Pt,
            amp: number,
            translateX: number,
            translateY: number,
            boxSize: number
          ) {
            this.origin = { x: origin.x, y: origin.y };
            this.translateX = translateX;
            this.translateY = translateY;
            this.boxSize = boxSize;
            this.amp = amp;
            this.numPts = Math.floor(p.random(4, 12));
            this.pct = p.random(0.1, 1);
            this.pctAdder = 0.05;
            this.increment = boxSize / this.numPts;
            this.bigRadiusMin = boxSize * (420 / 600);
            this.bigRadiusMax = boxSize * (1000 / 600);
            this.bigRadius = this.bigRadiusMin;
            this.color = p.color(181, 136, 255);
            this.colorBigRadius = p.color(191, 148, 255, 50);

            for (let i = 0; i < this.numPts; i++) {
              this.sourcePts.push({
                x: i * this.increment + translateX,
                y: translateY,
              });
            }
            for (let j = 0; j < this.numPts; j++) {
              this.sourcePts.push({
                x: boxSize + translateX,
                y: j * this.increment + translateY,
              });
            }
            for (let k = 0; k < this.numPts; k++) {
              this.sourcePts.push({
                x: boxSize - k * this.increment + translateX,
                y: boxSize + translateY,
              });
            }
            for (let l = 0; l < this.numPts; l++) {
              this.sourcePts.push({
                x: translateX,
                y: boxSize - l * this.increment + translateY,
              });
            }

            this.angleStep = p.TWO_PI / this.sourcePts.length;

            for (let n = 0; n < this.sourcePts.length; n++) {
              const ang = this.angleStep * n + (5 * p.PI) / 4;
              this.innerRing.push({
                x: this.origin.x + Math.cos(ang) * this.amp,
                y: this.origin.y + Math.sin(ang) * this.amp,
              });
              this.interpolatePts.push({
                x: this.sourcePts[n].x,
                y: this.sourcePts[n].y,
              });
            }
          }

          update() {
            if (this.interpolateOn) {
              const pp = Math.pow(this.pct, this.shaper);
              for (let i = 0; i < this.sourcePts.length; i++) {
                this.interpolatePts[i].x =
                  (1 - pp) * this.sourcePts[i].x + pp * this.innerRing[i].x;
                this.interpolatePts[i].y =
                  (1 - pp) * this.sourcePts[i].y + pp * this.innerRing[i].y;
              }
            }
            this.pct += this.pctAdder;

            if (this.colorStep) {
              this.angle += this.angleStep;
              this.colorSine = Math.sin(this.angle + this.angleStep);
              const r = p.map(this.colorSine, -1, 1, 247, 92);
              const g = p.map(this.colorSine, -1, 1, 148, 193);
              this.color = p.color(r, g, 255);
              this.colorStep = false;
            }

            if (this.drawCircle) {
              if (this.bigRadius > this.bigRadiusMax) {
                this.bigRadius = this.bigRadiusMin;
                this.drawCircle = false;
              } else {
                this.bigRadius += 0.5 * (this.boxSize / 600);
                const lo = this.bigRadiusMin;
                const hi = this.boxSize * (700 / 600);
                const r = p.map(this.bigRadius, lo, hi, 191, 217);
                const g = p.map(this.bigRadius, lo, hi, 148, 152);
                const b = p.map(this.bigRadius, lo, hi, 255, 158);
                const aMax = this.boxSize * (500 / 600);
                const a = p.map(this.bigRadius, lo, aMax, 50, 100);
                this.colorBigRadius = p.color(r, g, b, a);
              }
            }
          }

          draw() {
            p.stroke(this.color);
            p.fill(this.color);
            p.strokeWeight(0.5);
            for (let i = 0; i < this.sourcePts.length; i++) {
              p.circle(this.interpolatePts[i].x, this.interpolatePts[i].y, 2);
            }
            if (this.drawCircle) {
              p.noFill();
              p.stroke(this.colorBigRadius);
              p.strokeWeight(0.5);
              p.circle(this.origin.x, this.origin.y, this.bigRadius * 2);
            }
          }

          checkPulse() {
            this.colorStep = true;
            for (let q = 0; q < this.interpolatePts.length; q++) {
              if (
                this.interpolatePts[q].x >
                this.translateX + this.boxSize
              ) {
                this.pct = 0;
                this.drawCircle = true;
                break;
              }
            }
          }
        }

        const cells: FirstOrigin[] = [];

        const makeBigCell = (): FirstOrigin => {
          const origin = { x: p.width / 2, y: p.height / 2 };
          const big = Math.min(p.width, p.height) * 0.6;
          const tx = origin.x - big / 2;
          const ty = origin.y - big / 2;
          const ampMin = big * (80 / 600);
          const ampMax = big * (300 / 600);
          const amp = p.random(ampMin, ampMax);
          return new FirstOrigin(origin, amp, tx, ty, big);
        };

        p.setup = () => {
          const c = p.createCanvas(p.windowWidth, p.windowHeight);
          c.style("display", "block");
          p.frameRate(29);
          for (let i = 0; i < NUM_CELLS; i++) cells.push(makeBigCell());
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          cells.length = 0;
          for (let i = 0; i < NUM_CELLS; i++) cells.push(makeBigCell());
        };

        p.draw = () => {
          p.background(0);

          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            cell.update();
            cell.checkPulse();
          }

          for (let i = 0; i < cells.length; i++) cells[i].draw();
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
      id="EternalReturn_Observed_Canvas"
      style={{
        alignSelf: "stretch",
        marginLeft: "calc(-1 * var(--spacing-page))",
        marginRight: "calc(-1 * var(--spacing-page))",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}
