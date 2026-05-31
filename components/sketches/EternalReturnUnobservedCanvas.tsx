"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const TARGET_CELL_SIZE = 133;
const MAX_RINGS_PER_CELL = 4;

export type EternalReturnCanvasController = {
  setTriggered: (v: boolean) => void;
  setRacing: (v: boolean) => void;
};

type Props = {
  // When true, scroll/resize listeners and the auto-latch are disabled —
  // the canvas's triggered/racing state comes solely from the parent via
  // the imperative controller ref.
  controlled?: boolean;
  // When true, render in document flow (position: relative, fills parent)
  // instead of fixed full-viewport. Used by per-section mobile layouts.
  inFlow?: boolean;
  // Initial triggered state — useful when inFlow + controlled to render
  // the canvas in a fixed "unobserved" or "observed" stance.
  initialTriggered?: boolean;
  // When true, derive cell size from canvas width only (cells fit width
  // exactly, may leave vertical space). Default: cells overflow to fully
  // cover the canvas area.
  fitWidth?: boolean;
  // Force the grid to this exact column count instead of deriving it from
  // TARGET_CELL_SIZE. Used by the mobile layout to lock a 4-up grid.
  cols?: number;
};

export const EternalReturnUnobservedCanvas = forwardRef<
  EternalReturnCanvasController,
  Props
>(function EternalReturnUnobservedCanvas(
  { controlled = false, inFlow = false, initialTriggered = false, fitWidth = false, cols },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(initialTriggered);
  const racingRef = useRef(false);
  const fitWidthRef = useRef(fitWidth);
  useEffect(() => {
    fitWidthRef.current = fitWidth;
  }, [fitWidth]);
  const inFlowRef = useRef(inFlow);
  useEffect(() => {
    inFlowRef.current = inFlow;
  }, [inFlow]);
  const colsRef = useRef(cols);
  useEffect(() => {
    colsRef.current = cols;
  }, [cols]);

  useImperativeHandle(
    ref,
    () => ({
      setTriggered: (v: boolean) => {
        triggeredRef.current = v;
      },
      setRacing: (v: boolean) => {
        racingRef.current = v;
      },
    }),
    []
  );

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;
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
        let observedBoost = false;
        let observedBoostFrame = 0;
        // Frame on which the last unobserved grid cell finished dismantling
        // (was replaced by a big sensor cell). Used to extend the boost a
        // little further into the fully-observed state.
        let observedDismantleEndFrame: number | null = null;
        let observedEase = false;
        let observedEaseT = 0;
        // Snapshot of the unobserved cells taken when the user opens the eye.
        // On returning to unobserved we restore from here so the animation
        // resumes exactly where it paused. Invalidated on resize because the
        // cells are pinned to the previous canvas geometry.
        let savedUnobservedCells: FirstOrigin[] | null = null;
        // Safety cap on the boost — should rarely be reached now that the
        // boost is driven by the dismantling lifecycle.
        const OBSERVED_BOOST_FRAMES = 360;
        // Boost continues this many frames AFTER every grid cell has been
        // replaced by a big cell, carrying the rush into the observed state.
        const OBSERVED_BOOST_POST_DISMANTLE_FRAMES = 3;
        const OBSERVED_EASE_FRAMES = 120;
        // Uniform per-frame rate applied to every ring during the boost.
        // The "rush" is now baked entirely into pctAdder (speedMul stays at
        // 1 throughout the observed state) so the winddown is a single
        // continuous curve on one axis, not a compound slowdown of two
        // multiplicative factors easing together.
        const OBSERVED_BOOST_PCT_ADDER = 0.08;
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
          isFirstLoop = false;
          speedMul = 1;
          hitCenter = false;
          centerHitThresholdSq = 0;

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
            this.pct = p.random(0.002, 0.01);
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

            // A particle counts as "hitting the canvas center" once it gets
            // within a few pixels of its closest approach to the origin.
            // For these radial trajectories the floor of that distance is
            // exactly `amp` (the inner-ring radius), so the threshold is
            // amp + a small buffer to catch the convergence frame reliably.
            const centerHitThreshold = this.amp + 10;
            this.centerHitThresholdSq = centerHitThreshold * centerHitThreshold;

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
            if (this.sensorOn && !this.hitCenter) {
              for (let i = 0; i < this.interpolatePts.length; i++) {
                const dx = this.interpolatePts[i].x - this.origin.x;
                const dy = this.interpolatePts[i].y - this.origin.y;
                if (dx * dx + dy * dy < this.centerHitThresholdSq) {
                  this.hitCenter = true;
                  break;
                }
              }
            }
            // First-loop cells (the initial population) move at 2x speed for
            // the first half, then linearly decay back to 1x by pct=1.
            let speedMul = this.speedMul;
            if (this.isFirstLoop) {
              speedMul *= this.pct < 0.5 ? 2 : Math.max(1, 3 - 2 * this.pct);
            }
            this.pct += this.pctAdder * speedMul;

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
            const alpha = Math.floor(220 * fadeIn * fadeOut);
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
          const cols = colsRef.current
            ? Math.max(1, Math.floor(colsRef.current))
            : Math.max(1, Math.round(p.width / TARGET_CELL_SIZE));
          const approxRows = Math.max(1, Math.round(p.height / TARGET_CELL_SIZE));
          cellSize = fitWidthRef.current
            ? p.width / cols
            : Math.max(p.width / cols, p.height / approxRows);
          const rows = Math.max(1, Math.round(p.height / cellSize));
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
          const big = Math.min(p.width, p.height) * 0.8;
          const tx = origin.x - big / 2;
          const ty = origin.y - big / 2;
          const ampMin = big * (220 / 600);
          const ampMax = big * (290 / 600);
          const amp = p.random(ampMin, ampMax);
          const cell = new FirstOrigin(origin, amp, tx, ty, big, false);
          cell.sensorOn = true;
          // Big cells spawned during the boost/ease inherit the uniform fast
          // rate so they don't crawl in slowly mid-rush.
          if (observedBoost || observedEase) {
            cell.pctAdder = OBSERVED_BOOST_PCT_ADDER;
          }
          return cell;
        };

        // Snapshot helper: returns a deep enough clone of a FirstOrigin so
        // we can stash the unobserved cells while the observed animation
        // mutates the originals. p5 color objects are skipped — they're
        // recreated every frame via the colorStep gate, so freshly created
        // null colors get replaced on the next draw without visual artifact.
        const cloneCell = (src: FirstOrigin): FirstOrigin => {
          const c = Object.create(FirstOrigin.prototype) as FirstOrigin;
          c.origin = { x: src.origin.x, y: src.origin.y };
          c.translateX = src.translateX;
          c.translateY = src.translateY;
          c.boxSize = src.boxSize;
          c.amp = src.amp;
          c.numPts = src.numPts;
          c.increment = src.increment;
          c.angle = src.angle;
          c.angleStep = src.angleStep;
          c.pct = src.pct;
          c.pctAdder = src.pctAdder;
          c.defaultPctAdder = src.defaultPctAdder;
          c.shaper = src.shaper;
          c.interpolateOn = src.interpolateOn;
          c.drawLines = src.drawLines;
          c.sensorOn = src.sensorOn;
          c.colorStep = true; // force color recompute on first draw after restore
          c.drawCircle = src.drawCircle;
          c.bigRadius = src.bigRadius;
          c.bigRadiusMin = src.bigRadiusMin;
          c.bigRadiusMax = src.bigRadiusMax;
          c.colorSine = src.colorSine;
          c.color = src.color;
          c.colorBigRadius = src.colorBigRadius;
          c.sourcePts = src.sourcePts.map((q) => ({ x: q.x, y: q.y }));
          c.innerRing = src.innerRing.map((q) => ({ x: q.x, y: q.y }));
          c.interpolatePts = src.interpolatePts.map((q) => ({ x: q.x, y: q.y }));
          c.lifeFrames = src.lifeFrames;
          c.pctComplete = src.pctComplete;
          c.originIdx = src.originIdx;
          c.isFirstLoop = src.isFirstLoop;
          c.speedMul = src.speedMul;
          c.hitCenter = src.hitCenter;
          c.centerHitThresholdSq = src.centerHitThresholdSq;
          return c;
        };

        const getCanvasDims = (): [number, number] => {
          if (inFlowRef.current && containerRef.current) {
            return [
              containerRef.current.clientWidth,
              containerRef.current.clientHeight,
            ];
          }
          return [p.windowWidth, p.windowHeight];
        };

        p.setup = () => {
          const [cw, ch] = getCanvasDims();
          const c = p.createCanvas(cw, ch);
          c.style("display", "block");
          p.frameRate(29);
          layoutGrid();
          for (let i = 0; i < origins.length; i++) {
            const cell = makeCellAt(i);
            cell.isFirstLoop = true;
            cells.push(cell);
          }
        };

        p.windowResized = () => {
          const [cw, ch] = getCanvasDims();
          p.resizeCanvas(cw, ch);
          layoutGrid();
          cells.length = 0;
          for (let i = 0; i < origins.length; i++) {
            const cell = makeCellAt(i);
            cell.isFirstLoop = true;
            cells.push(cell);
          }
          // The unobserved snapshot is pinned to the previous canvas
          // geometry; discard it so a future return to unobserved starts
          // from the freshly-laid-out grid.
          savedUnobservedCells = null;
        };

        p.draw = () => {
          p.background(0);

          triggered = triggeredRef.current;

          if (triggered !== prevTriggered) {
            if (!triggered) {
              // Leaving observed: restore the unobserved snapshot if we have
              // one so the grid animation resumes exactly where the user
              // paused it. Otherwise fall back to a fresh population.
              cells.length = 0;
              if (savedUnobservedCells) {
                for (const c of savedUnobservedCells) cells.push(c);
                savedUnobservedCells = null;
              } else {
                for (let i = 0; i < origins.length; i++) cells.push(makeCellAt(i));
              }
              currentSpeed = "default";
              observedBoost = false;
              observedBoostFrame = 0;
              observedDismantleEndFrame = null;
              observedEase = false;
              observedEaseT = 0;
            } else {
              // Entering observed: snapshot the unobserved cells first so we
              // can resume from this exact moment when the user closes the
              // eye later. Then always run the convergence rush — every
              // click should re-trigger the boost.
              savedUnobservedCells = cells.map(cloneCell);
              observedBoost = true;
              observedBoostFrame = 0;
              observedDismantleEndFrame = null;
              observedEase = false;
              observedEaseT = 0;
              // Override every current cell's pctAdder so dismantling moves
              // at the uniform fast rate. defaultPctAdder is left alone and
              // restored when ease finishes.
              for (const c of cells) c.pctAdder = OBSERVED_BOOST_PCT_ADDER;
            }
            prevTriggered = triggered;
          }

          // `racing` is the "pump pctAdder up to 0.1 for everyone" state used
          // for carousel-swipe and scroll feedback. We intentionally do NOT
          // include `triggered` here — the observed state's initial rush is
          // handled by the boost speedMul below, so once that boost ends the
          // cells decay back to their slow random pctAdder for a meditative
          // observed loop instead of staying locked at racing speed.
          const racing =
            racingRef.current ||
            Date.now() - scrollState.lastScrollAt < 80;
          const targetSpeed: "racing" | "default" = racing ? "racing" : "default";
          if (currentSpeed !== targetSpeed) {
            for (const c of cells) {
              c.pctAdder = targetSpeed === "racing" ? 0.1 : c.defaultPctAdder;
            }
            currentSpeed = targetSpeed;
          }

          // The observed-state speed boost runs in two phases:
          //   1. Dismantling: hold the boost until every original grid cell
          //      has completed and been replaced by a big sensor cell.
          //   2. Observed carry: continue the boost for
          //      OBSERVED_BOOST_POST_DISMANTLE_FRAMES more frames so the
          //      rush bleeds into the fully-observed state before easing.
          // OBSERVED_BOOST_FRAMES remains as a safety cap.
          if (observedBoost) {
            observedBoostFrame++;
            let anyGridLeft = false;
            for (const c of cells) {
              if (!c.sensorOn) {
                anyGridLeft = true;
                break;
              }
            }
            if (!anyGridLeft && observedDismantleEndFrame === null) {
              observedDismantleEndFrame = observedBoostFrame;
            }
            const dismantleCarryDone =
              observedDismantleEndFrame !== null &&
              observedBoostFrame - observedDismantleEndFrame >=
                OBSERVED_BOOST_POST_DISMANTLE_FRAMES;
            if (dismantleCarryDone || observedBoostFrame >= OBSERVED_BOOST_FRAMES) {
              observedBoost = false;
              observedEase = true;
              observedEaseT = 0;
            }
          }
          // Single-axis winddown: only pctAdder changes during the ease.
          // speedMul stays at 1 throughout observed mode so the perceived
          // deceleration is one continuous curve, not a compound product of
          // two factors easing together.
          if (observedEase) {
            observedEaseT += 1 / OBSERVED_EASE_FRAMES;
            if (observedEaseT >= 1) observedEaseT = 1;
            const eased = 1 - Math.pow(1 - observedEaseT, 3);
            for (const c of cells) {
              c.pctAdder =
                OBSERVED_BOOST_PCT_ADDER +
                (c.defaultPctAdder - OBSERVED_BOOST_PCT_ADDER) * eased;
            }
            if (observedEaseT >= 1) observedEase = false;
          }

          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            cell.update();

            if (triggered && cell.sensorOn) {
              cell.colorStep = true;
              let looped = false;
              for (let q = 0; q < cell.interpolatePts.length; q++) {
                if (
                  cell.interpolatePts[q].x >
                  cell.translateX + cell.boxSize
                ) {
                  cell.pct = 0;
                  cell.drawCircle = true;
                  looped = true;
                }
              }
              if (looped) {
                // Each new loop of the big cell is effectively a new ring
                // appearing — reset lifeFrames so the fade-in plays again
                // (same 30-frame ramp used when a fresh cell is created).
                cell.lifeFrames = 0;
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
                  cells[i].pctAdder = 0.1;
                  const last = cells[cells.length - 1];
                  if (last !== cells[i]) last.pctAdder = 0.1;
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
    let initialLatchCheck: ReturnType<typeof setTimeout> | null = null;
    if (!controlled) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", updateObservedLatch, { passive: true });
      initialLatchCheck = setTimeout(updateObservedLatch, 200);
    }

    // Detect container size changes (e.g. when parent computes inFlow height
    // post-mount) and re-fit the canvas accordingly.
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inst = p5Instance as any;
        if (inst && typeof inst.windowResized === "function") {
          inst.windowResized();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    // Begin animation only when the canvas scrolls / slides into view.
    // Pause immediately on mount; IO flips us on as soon as any portion
    // intersects the viewport (matches the pattern used by RadialsCanvas
    // and WaveCanvasShell). On a dedicated page where the canvas is
    // always visible IO reports `isIntersecting: true` straight away.
    if (containerRef.current && typeof IntersectionObserver !== "undefined") {
      // The p5 instance might not be initialised yet (we're still
      // awaiting the dynamic import in the async block above) — guard
      // with optional chaining and the observer can fire its first
      // callback once the instance is ready.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.noLoop?.();
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const inst = p5Instance as any;
            if (e.isIntersecting) inst?.loop?.();
            else inst?.noLoop?.();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      io?.disconnect();
      if (!controlled) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", updateObservedLatch);
        if (initialLatchCheck) clearTimeout(initialLatchCheck);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, [controlled]);

  return (
    <div
      ref={containerRef}
      {...(inFlow ? {} : { id: "EternalReturn_Unobserved_Canvas" })}
      style={
        inFlow
          ? {
              position: "relative",
              width: "100%",
              height: "100%",
              background: "#000",
              overflow: "hidden",
            }
          : {
              position: "fixed",
              inset: 0,
              zIndex: -1,
              pointerEvents: "none",
              background: "#000",
            }
      }
    />
  );
});
