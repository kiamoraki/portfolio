"use client";

import { useEffect, useRef } from "react";

const FACE_COUNT = 20;

export function TobritCanvas() {
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
        const faces: unknown[] = [];
        const xpos: number[] = [];
        const ypos: number[] = [];
        const faceScale: number[] = [];
        const speed: number[] = [];

        p.preload = () => {
          for (let i = 0; i < FACE_COUNT; i++) {
            faces[i] = p.loadImage(`/img/TOBRIT/faces/face_${i}.png`);
          }
        };

        p.setup = () => {
          const c = p.createCanvas(p.windowWidth, p.windowHeight);
          c.style("display", "block");
          p.frameRate(30);
          for (let i = 0; i < FACE_COUNT; i++) {
            xpos[i] = p.random(-200, p.windowWidth);
            ypos[i] = p.random(p.windowHeight + 200);
            faceScale[i] = p.random(0.3, 0.9);
            speed[i] = p.random(0.5, 0.9);
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };

        p.draw = () => {
          p.background(255, 255, 255);
          for (let i = 0; i < FACE_COUNT; i++) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const face = faces[i] as any;
            if (!face || !face.height) continue;
            ypos[i] = ypos[i] - speed[i];
            if (ypos[i] < 0 - face.height * faceScale[i]) {
              ypos[i] = p.windowHeight;
              xpos[i] = p.random(-200, p.windowWidth);
              faceScale[i] = p.random(0.3, 0.9);
              speed[i] = p.random(0.5, 0.9);
            }
            p.image(
              face,
              xpos[i],
              ypos[i],
              face.width * faceScale[i],
              face.height * faceScale[i]
            );
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
      id="TOBRIT_Canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
