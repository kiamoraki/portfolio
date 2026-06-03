"use client";

import { useEffect, useRef } from "react";

const NUM_CELLS = 20;

type Props = {
  // When true, render inside the document flow (position: absolute, fills
  // parent) instead of the default full-viewport background mode. The
  // p5 canvas sizes itself to the container's clientWidth/Height.
  inFlow?: boolean;
  // 1 = single centered convergence square (default). 4 = a 2×2 grid of
  // convergence squares, each centered in its quadrant. Other counts are
  // treated as 1.
  squares?: 1 | 4;
};

export function EternalReturnObservedCanvas({
  inFlow = false,
  squares = 1,
}: Props = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlowRef = useRef(inFlow);
  useEffect(() => {
    inFlowRef.current = inFlow;
  }, [inFlow]);
  const squaresRef = useRef(squares);
  useEffect(() => {
    squaresRef.current = squares;
  }, [squares]);

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
          // Frames since this cell's pct was last reset to 0. Drives the
          // fade-in at the start of each pulse — mirrors the unobserved
          // canvas's same lifeFrames-based fade. Cells seed this with a
          // random value >= 30 so the hero looks like the animation has
          // already been running on page load (no initial fade-in).
          lifeFrames = 30;
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
            // Slight per-cell jitter (±20%) on pctAdder so cells don't
            // all pulse in perfect sync, but the overall lifespan range
            // stays tight around ~30s.
            this.pctAdder = p.random(0.0018, 0.0024);
            // Seed each cell anywhere from a fresh reset (pct = 0) up
            // through past-the-pulse near the end of its cycle (pct ≈ 1.8).
            // lifeFrames stays correlated so each cell's apparent age
            // matches its progress — the hero opens with cells visibly
            // spread across the entire lifespan.
            this.pct = p.random(0, 1.8);
            this.lifeFrames = Math.floor(this.pct / this.pctAdder);
            this.increment = boxSize / this.numPts;
            this.bigRadiusMin = boxSize * (420 / 600);
            this.bigRadiusMax = boxSize * (1000 / 600);
            this.bigRadius = this.bigRadiusMin;
            // Locked to the single sidebar accent lavender (#b588ff) used
            // throughout the rest of the site chrome.
            this.color = p.color(181, 136, 255);
            this.colorBigRadius = p.color(181, 136, 255, 50);

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

            // Color stays locked at the sidebar lavender — colorStep used
            // to sine-wave through magenta/cyan, but the hero now reads as
            // a single brand color.

          }

          draw() {
            // Fade in only — ramp the dots up over the first 30 frames of
            // each pulse and hold them at full alpha until the next reset.
            this.lifeFrames++;
            const fadeIn = Math.min(1, this.lifeFrames / 30);
            const alpha = Math.floor(220 * fadeIn);
            const c = p.color(181, 136, 255, alpha);
            p.stroke(c);
            p.fill(c);
            p.strokeWeight(0.5);
            for (let i = 0; i < this.sourcePts.length; i++) {
              p.circle(this.interpolatePts[i].x, this.interpolatePts[i].y, 2);
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
                this.lifeFrames = 0;
                break;
              }
            }
          }
        }

        const cells: FirstOrigin[] = [];

        // Quadrant centers for the chosen `squares` layout. 1 → just the
        // canvas center; 4 → a 2×2 grid of quadrant centers.
        const quadrantCenters = (): Pt[] => {
          const n = squaresRef.current === 4 ? 4 : 1;
          if (n === 1) return [{ x: p.width / 2, y: p.height / 2 }];
          return [
            { x: p.width * 0.25, y: p.height * 0.25 },
            { x: p.width * 0.75, y: p.height * 0.25 },
            { x: p.width * 0.25, y: p.height * 0.75 },
            { x: p.width * 0.75, y: p.height * 0.75 },
          ];
        };

        const makeBigCell = (origin: Pt, squaresN: number): FirstOrigin => {
          // Each square is sized to the larger axis of its slot so it
          // fills both directions, with the smaller axis cropping the
          // overflow. squaresN=4 → each slot is half the canvas in both
          // axes; squaresN=1 → the whole canvas.
          const slotW = p.width / (squaresN === 4 ? 2 : 1);
          const slotH = p.height / (squaresN === 4 ? 2 : 1);
          const big = Math.max(slotW, slotH);
          const tx = origin.x - big / 2;
          const ty = origin.y - big / 2;
          const ampMin = big * (80 / 600);
          const ampMax = big * (300 / 600);
          const amp = p.random(ampMin, ampMax);
          return new FirstOrigin(origin, amp, tx, ty, big);
        };

        const populateCells = () => {
          cells.length = 0;
          const centers = quadrantCenters();
          const squaresN = centers.length;
          const perSquare = Math.floor(NUM_CELLS / squaresN);
          for (const center of centers) {
            for (let i = 0; i < perSquare; i++) {
              cells.push(makeBigCell(center, squaresN));
            }
          }
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
          p.frameRate(29);
          populateCells();
        };

        p.windowResized = () => {
          const [cw, ch] = getDims();
          p.resizeCanvas(cw, ch);
          populateCells();
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
      style={
        inFlow
          ? {
              position: "absolute",
              inset: 0,
              background: "#000",
              overflow: "hidden",
            }
          : {
              alignSelf: "stretch",
              marginLeft: "calc(-1 * var(--spacing-page))",
              marginRight: "calc(-1 * var(--spacing-page))",
              height: "100dvh",
              background: "#000",
              overflow: "hidden",
            }
      }
    />
  );
}
