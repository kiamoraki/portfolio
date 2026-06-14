"use client";

/**
 * ShapeOfTimeV2Canvas — based on the p5.js Web Editor sketch
 * "TD · Scale & Phase shift" (editor.p5js.org/mshhll.rk/sketches/Obxi1ey16).
 *
 * A build → subtract cycle (Shape of Time's macro-loop):
 *
 *   BUILD — an invisible "head" travels the Lissajous curve, spawning a
 *     particle at each step, until it has gone all the way around once.
 *     New particles keep accumulating, so the curve fills in and is
 *     "defined".
 *   SUBTRACT — spawning stops; the particles that exist keep spiralling
 *     inward and drain away to the centre until none are left.
 *   Then a fresh frequency pair is rolled and it builds again.
 *
 * Every particle spirals inward FROM BIRTH and, because the canvas only
 * fades each frame (feedback rect) instead of clearing, leaves its own
 * echo trail the moment it's created — in the build phase as well.
 *
 * The canvas is a centred square sized to the live viewport.
 */
import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const SUBSTEPS = 1; // particles spawned per frame (lower = more separated)
const CYCLE_FRAMES = 880; // frames for the head to travel the whole curve once
const PARTICLE_DIAMETER = 5;
// Each particle spirals inward from the moment it's born (so its echo
// starts immediately, in the build phase too). Kept slower than
// ampMax / CYCLE_FRAMES (≈0.55) so a particle survives the whole build —
// the curve keeps accumulating instead of draining away mid-build.
const SPIRAL_DECAY = 0.45; // px/frame each particle spirals inward
const SPIRAL_DRIFT = 0.0015; // angle drift per frame (mostly radial)

// Trail feedback: fade the previous frame instead of clearing it, so each
// moving particle leaves an echo (255 / alpha ≈ frames to fade).
const FEEDBACK_ALPHA = 10;
const EDGE_MARGIN = 20; // keeps the outermost dot inside the canvas

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
        let freqA = 0;
        let freqB = 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let origin: any = null;
        let ampMax = 0;
        let theta = 0;
        let phaseInc = 0; // head phase advance per substep

        let leaderPhase = 0;
        let builtPhase = 0; // total phase the head has traced this build
        let mode: "build" | "subtract" = "build";
        const particles: { amp: number; angle: number }[] = [];

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

        // Roll a fresh, distinct frequency pair 1..9 for the next build.
        const pickFreqs = () => {
          freqA = p.int(p.random(1, 10));
          freqB = p.int(p.random(1, 10));
          while (freqA === freqB) freqA = p.int(p.random(1, 10));
        };

        const dims = (): number => {
          const w = typeof window !== "undefined" ? window.innerWidth : 600;
          const h = typeof window !== "undefined" ? window.innerHeight : 600;
          return Math.min(w, h);
        };

        // Start a fresh build with the current frequencies + canvas size.
        const build = () => {
          origin = p.createVector(p.width / 2, p.height / 2);
          ampMax = p.width / 2 - EDGE_MARGIN;
          const gcd = calculateGCD(freqA, freqB);
          theta = p.TWO_PI / gcd;
          phaseInc = theta / CYCLE_FRAMES / SUBSTEPS;

          leaderPhase = 0;
          builtPhase = 0;
          mode = "build";
          particles.length = 0;
        };

        p.setup = () => {
          const size = dims();
          p.createCanvas(size, size);
          p.frameRate(24);
          pickFreqs();
          build();
          p.background(0); // clean start before feedback trails accumulate
        };

        p.windowResized = () => {
          const size = dims();
          p.resizeCanvas(size, size);
          build();
          p.background(0);
        };

        p.draw = () => {
          // Feedback: fade the previous frame instead of clearing it.
          p.noStroke();
          p.fill(0, 0, 0, FEEDBACK_ALPHA);
          p.rect(0, 0, p.width, p.height);

          if (mode === "build") {
            // Advance the head, laying down a particle at each substep,
            // until it has traced the whole curve (one full period).
            for (let s = 0; s < SUBSTEPS; s++) {
              leaderPhase += phaseInc;
              builtPhase += phaseInc;
              if (leaderPhase >= theta) leaderPhase -= theta;
              const amp = p.map(leaderPhase, 0, theta, ampMax, 0);
              particles.push({ amp, angle: leaderPhase });
            }
            if (builtPhase >= theta) mode = "subtract";
          } else if (particles.length === 0) {
            // Drained — roll a new pair and build the next curve.
            pickFreqs();
            build();
          }

          // Every particle spirals inward from birth, leaving a feedback
          // echo from the moment it's created (build phase included), and
          // is removed once it reaches the centre. During BUILD new
          // particles are still being added at the head, so the curve
          // accumulates; during SUBTRACT nothing is added, so the field
          // drains away to nothing.
          for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.amp -= SPIRAL_DECAY;
            pt.angle += SPIRAL_DRIFT;
            if (pt.amp <= 0) {
              particles.splice(i, 1);
              continue;
            }
            const x = origin.x - pt.amp * p.sin(freqA * pt.angle);
            const y = origin.y - pt.amp * p.sin(freqB * pt.angle);
            p.fill(255, 0, 255);
            p.circle(x, y, PARTICLE_DIAMETER);
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
