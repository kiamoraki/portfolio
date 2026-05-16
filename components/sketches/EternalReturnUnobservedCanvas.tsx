"use client";

import { useEffect, useRef } from "react";

const TARGET_CELL_SIZE = 133;
const MAX_RINGS_PER_CELL = 4;

export function EternalReturnUnobservedCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    const scrollState = { lastScrollAt: 0 };

    (async () => {
      const p5Mod = await import("p5");
      const P5 = p5Mod.default;
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        let cellSize = 100;
        let triggered = false;
        let prevTriggered = false;
        let currentSpeed: "racing" | "default" = "default";
        const origins: { x: number; y: number }[] = [];

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
          defaultPctAdder: number;
          shaper = 1;
          interpolateOn = true;
          drawLines = false;
          sensorOn = false;
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
          lifeFrames = 0;
          pctComplete = Infinity;
          originIdx = -1;

          constructor(
            origin: Pt,
            amp: number,
            translateX: number,
            translateY: number,
            boxSize: number,
            pctReset: boolean
          ) {
            this.origin = { x: origin.x, y: origin.y };
            this.translateX = translateX;
            this.translateY = translateY;
            this.boxSize = boxSize;
            this.amp = amp;
            this.numPts = Math.floor(p.random(4, 12));
            this.pct = p.random(0.001, 0.005);
            this.pctAdder = this.pct;
            this.defaultPctAdder = this.pct;
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

            if (pctReset) {
              this.pct = p.random(0.1, 1);
            }

            const rightEdge = translateX + boxSize;
            for (let n = 0; n < this.sourcePts.length; n++) {
              const sx = this.sourcePts[n].x;
              const ix = this.innerRing[n].x;
              const dx = ix - sx;
              if (dx === 0) continue;
              const pCross = (rightEdge - sx) / dx;
              if (pCross > 0 && pCross < this.pctComplete) {
                this.pctComplete = pCross;
              }
            }
          }

          update() {
            this.lifeFrames++;
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
                this.colorBigRadius = p.color(191, 148, 255, 50);
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
            const fadeIn = Math.min(1, this.lifeFrames / 30);
            const framesLeft =
              (this.pctComplete - this.pct) / this.pctAdder;
            const fadeOut = Math.max(0, Math.min(1, framesLeft / 30));
            const alpha = Math.floor(115 * fadeIn * fadeOut);
            const c = p.color(181, 136, 255, alpha);
            p.stroke(c);
            p.fill(c);
            p.strokeWeight(0.5);
            for (let i = 0; i < this.sourcePts.length; i++) {
              p.circle(this.interpolatePts[i].x, this.interpolatePts[i].y, 1);
              if (this.drawLines) {
                p.line(
                  this.interpolatePts[i].x,
                  this.interpolatePts[i].y,
                  this.innerRing[i].x,
                  this.innerRing[i].y
                );
              }
            }
            if (this.drawCircle) {
              p.noFill();
              p.stroke(this.colorBigRadius);
              p.strokeWeight(0.5);
              p.circle(this.origin.x, this.origin.y, this.bigRadius * 2);
            }
          }

          isPctComplete(): boolean {
            for (let i = 0; i < this.interpolatePts.length; i++) {
              if (this.interpolatePts[i].x > this.translateX + this.boxSize) {
                return true;
              }
            }
            return false;
          }
        }

        const cells: FirstOrigin[] = [];

        const layoutGrid = () => {
          const cols = Math.max(1, Math.round(p.width / TARGET_CELL_SIZE));
          const rows = Math.max(1, Math.round(p.height / TARGET_CELL_SIZE));
          cellSize = Math.max(p.width / cols, p.height / rows);
          const offX = (p.width - cellSize * cols) / 2;
          const offY = (p.height - cellSize * rows) / 2;
          origins.length = 0;
          for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
              origins.push({
                x: offX + cellSize / 2 + cellSize * i,
                y: offY + cellSize / 2 + cellSize * j,
              });
            }
          }
        };

        const makeCellAt = (originIdx: number): FirstOrigin => {
          const origin = origins[originIdx];
          const tx = origin.x - cellSize / 2;
          const ty = origin.y - cellSize / 2;
          const ampMin = cellSize * (5 / 200);
          const ampMax = cellSize * (50 / 200);
          const amp = p.random(ampMin, ampMax);
          const cell = new FirstOrigin(origin, amp, tx, ty, cellSize, false);
          cell.originIdx = originIdx;
          return cell;
        };

        const pickOpenOriginIdx = (excludeCellIdx: number): number => {
          const counts = new Array(origins.length).fill(0);
          for (let i = 0; i < cells.length; i++) {
            if (i === excludeCellIdx) continue;
            const oi = cells[i].originIdx;
            if (oi >= 0) counts[oi]++;
          }
          const open: number[] = [];
          for (let i = 0; i < counts.length; i++) {
            if (counts[i] < MAX_RINGS_PER_CELL) open.push(i);
          }
          if (open.length === 0) return Math.floor(p.random(origins.length));
          return open[Math.floor(p.random(open.length))];
        };

        const makeBigCell = (): FirstOrigin => {
          const origin = { x: p.width / 2, y: p.height / 2 };
          const big = Math.min(p.width, p.height) * 0.6;
          const tx = origin.x - big / 2;
          const ty = origin.y - big / 2;
          const ampMin = big * (80 / 600);
          const ampMax = big * (300 / 600);
          const amp = p.random(ampMin, ampMax);
          const cell = new FirstOrigin(origin, amp, tx, ty, big, false);
          cell.sensorOn = true;
          return cell;
        };

        p.setup = () => {
          const c = p.createCanvas(p.windowWidth, p.windowHeight);
          c.style("display", "block");
          p.frameRate(29);
          layoutGrid();
          for (let i = 0; i < origins.length; i++) cells.push(makeCellAt(i));
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
          layoutGrid();
          cells.length = 0;
          for (let i = 0; i < origins.length; i++) cells.push(makeCellAt(i));
        };

        p.draw = () => {
          p.background(0);

          triggered = triggeredRef.current;

          if (triggered !== prevTriggered) {
            if (!triggered) {
              cells.length = 0;
              for (let i = 0; i < origins.length; i++) cells.push(makeCellAt(i));
              currentSpeed = "default";
            }
            prevTriggered = triggered;
          }

          const racing =
            triggered || Date.now() - scrollState.lastScrollAt < 80;
          const targetSpeed: "racing" | "default" = racing ? "racing" : "default";
          if (currentSpeed !== targetSpeed) {
            for (const c of cells) {
              c.pctAdder = targetSpeed === "racing" ? 0.05 : c.defaultPctAdder;
            }
            currentSpeed = targetSpeed;
          }

          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            cell.update();

            if (triggered && cell.sensorOn) {
              cell.colorStep = true;
              for (let q = 0; q < cell.interpolatePts.length; q++) {
                if (
                  cell.interpolatePts[q].x >
                  cell.translateX + cell.boxSize
                ) {
                  cell.pct = 0;
                  cell.drawCircle = true;
                }
              }
            }

            if (!cell.sensorOn && cell.isPctComplete()) {
              if (cell.interpolateOn) cell.interpolateOn = false;

              if (triggered) {
                cells[i] = makeBigCell();
              } else {
                const sourceIdx = cell.originIdx;
                let sourceCount = 0;
                for (const c of cells) {
                  if (c.originIdx === sourceIdx) sourceCount++;
                }
                cells[i] = makeCellAt(pickOpenOriginIdx(i));
                if (sourceCount === 1 && sourceIdx >= 0) {
                  cells.push(makeCellAt(sourceIdx));
                }
                if (currentSpeed === "racing") {
                  cells[i].pctAdder = 0.05;
                  const last = cells[cells.length - 1];
                  if (last !== cells[i]) last.pctAdder = 0.05;
                }
              }
            }
          }

          for (let i = 0; i < cells.length; i++) cells[i].draw();
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, containerRef.current) as any;
    })();

    const updateObservedLatch = () => {
      const rows = document.querySelectorAll("main .row");
      const lastRow = rows[rows.length - 1] as HTMLElement | undefined;
      if (!lastRow) return;
      const rect = lastRow.getBoundingClientRect();
      const vh = window.innerHeight;
      const rowCenter = (rect.top + rect.bottom) / 2;
      const viewportCenter = vh / 2;
      const isCenteredOrAbove = rowCenter <= viewportCenter;
      if (isCenteredOrAbove && !triggeredRef.current) {
        triggeredRef.current = true;
      } else if (!isCenteredOrAbove && triggeredRef.current) {
        triggeredRef.current = false;
      }
    };

    const onScroll = () => {
      scrollState.lastScrollAt = Date.now();
      updateObservedLatch();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateObservedLatch, { passive: true });

    const initialLatchCheck = setTimeout(updateObservedLatch, 200);

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateObservedLatch);
      clearTimeout(initialLatchCheck);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="EternalReturn_Unobserved_Canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        background: "#000",
      }}
    />
  );
}
