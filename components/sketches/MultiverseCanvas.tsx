"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

const NUM_MOL = 15;
const NUM_ORBITS = 4;

/* Sketch FACTORY, taking a dimensions getter, matching the pattern in
   RadialsCanvas. It previously sized itself off `window.innerWidth /
   innerHeight` directly, which is correct in the full-bleed template
   where the canvas IS the viewport, but wrong in the split template
   where it's a grid cell inset by the container's padding: the canvas
   overflowed its column and got clipped at the bottom. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const makeSketch = (getDims: () => [number, number]) => (p: any) => {
  class Molecule {
    center: { x: number; y: number };
    angle: number[] = [];
    angleAdder: number[] = [];
    orbitAngle: number[] = [];
    orbitAngleAdder = 0.01;
    electrons: number[] = [];
    electronInterval: number[] = [];
    ampA: number[];
    ampB: number[];
    ampAdder: number[];
    timecycleSwitch = false;

    constructor() {
      this.center = { x: 0, y: 0 };
      for (let i = 0; i < NUM_ORBITS; i++) {
        this.angle.push(0);
        this.angleAdder.push(0.01 + Math.random() * 0.04);
        this.orbitAngle.push(-2 * Math.PI + Math.random() * 4 * Math.PI);
        const n = 2 + 2 * i;
        this.electrons.push(n);
        this.electronInterval.push((2 * Math.PI) / n);
      }
      this.ampA = [10, 10, -10, -10];
      this.ampB = [10, -10, 10, -10];
      this.ampAdder = [0.15, 0.21, 0.27, 0.33];
    }

    update() {
      const timecycle = Math.floor(performance.now() / 1000);
      if (timecycle % 60 === 0) {
        if (!this.timecycleSwitch) {
          this.ampAdder[0] *= -1;
          this.ampAdder[1] *= -1;
          this.ampAdder[2] *= -1;
          this.ampAdder[3] *= -1;
          this.timecycleSwitch = true;
        }
      } else {
        this.timecycleSwitch = false;
      }
      for (let i = 0; i < NUM_ORBITS; i++) {
        if (this.orbitAngle[i] > 2 * Math.PI) this.orbitAngle[i] = 0;
        this.orbitAngle[i] += this.orbitAngleAdder;
        if (this.angle[i] > 2 * Math.PI) this.angle[i] = 0;
        this.angle[i] += this.angleAdder[i];
        this.ampA[i] += this.ampAdder[i];
        this.ampB[i] += this.ampAdder[i];
      }
    }

    draw() {
      p.fill(42, 88, 255);
      p.noStroke();
      for (let j = 0; j < NUM_ORBITS; j++) {
        const n = this.electrons[j];
        const interval = this.electronInterval[j];
        const aA = this.ampA[j];
        const aB = this.ampB[j];
        const so = Math.sin(this.orbitAngle[j]);
        const co = Math.cos(this.orbitAngle[j]);
        for (let i = 0; i < n; i++) {
          const a = this.angle[j] + i * interval;
          const sa = Math.sin(a);
          const ca = Math.cos(a);
          const px = this.center.x + aA * ca * co - aB * sa * so;
          const py = this.center.y + aA * sa * so + aB * sa * co;
          p.circle(px, py, 3);
        }
      }
    }
  }

  const molecules: Molecule[] = [];

  const layoutMolecules = () => {
    const portrait = p.height > p.width;
    const cols = portrait ? 3 : 5;
    const rows = portrait ? 5 : 3;
    const cellW = p.width / cols;
    const cellH = p.height / rows;
    let idx = 0;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        if (idx >= molecules.length) return;
        molecules[idx].center.x = x * cellW + cellW / 2;
        molecules[idx].center.y = y * cellH + cellH / 2;
        idx++;
      }
    }
  };

  p.setup = () => {
    p.pixelDensity(1);
    const [cw, ch] = getDims();
    const c = p.createCanvas(cw, ch);
    c.style("display", "block");
    p.frameRate(24);
    for (let i = 0; i < NUM_MOL; i++) molecules.push(new Molecule());
    layoutMolecules();
  };

  p.windowResized = () => {
    const [cw, ch] = getDims();
    p.resizeCanvas(cw, ch);
    layoutMolecules();
  };

  p.draw = () => {
    const ctx = p.drawingContext;
    const cnv = p.canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#00001c";
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.restore();

    for (const m of molecules) {
      m.update();
      m.draw();
    }
  };
};

export function MultiverseCanvas({ inFlow = false }: { inFlow?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let intersectionObserver: IntersectionObserver | null = null;

    (async () => {
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Size from the CONTAINER when it has a measurable box, falling
      // back to the viewport. Covers both templates without the sketch
      // needing to know which one it's in.
      const getDims = (): [number, number] => {
        const el = containerRef.current;
        if (el && el.clientWidth > 0 && el.clientHeight > 0) {
          return [el.clientWidth, el.clientHeight];
        }
        return [window.innerWidth, window.innerHeight];
      };
      p5Instance = new P5(makeSketch(getDims) as any, containerRef.current) as any;

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
        width: "100%",
        height: inFlow ? "100%" : "100dvh",
        background: "#00001c",
        overflow: "hidden",
      }}
    />
  );
}
